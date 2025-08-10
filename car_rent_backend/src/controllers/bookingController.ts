import { Request, Response } from 'express';
import Booking, { IBooking } from '../models/Booking';
import Car from '../models/Car';
import { AuthRequest } from '../middleware/authMiddleware';
import { validationResult } from 'express-validator';

export const createBooking = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { carId, startDate, endDate, pickupLocation, dropoffLocation, additionalServices, paymentMethod } = req.body;

  try {
    const car = await Car.findById(carId);
    if (!car || !car.available) {
      return res.status(400).json({ message: 'Car not available' });
    }

    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24));
    const basePrice = car.price * days;
    const servicePrices = additionalServices.reduce((total: number, service: string) => {
      const prices: { [key: string]: number } = {
        gps: 10,
        insurance: 25,
        'child-seat': 15,
        driver: 20,
        wifi: 8
      };
      return total + (prices[service] || 0);
    }, 0);
    const totalAmount = basePrice + servicePrices * days;

    const booking = new Booking({
      userId: req.user?.userId,
      carId,
      startDate,
      endDate,
      totalAmount,
      status: 'pending',
      pickupLocation,
      dropoffLocation,
      additionalServices,
      paymentMethod
    });

    await booking.save();
    car.available = false;
    await car.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBookings = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.user?.role === 'admin' ? {} : { userId: req.user?.userId };
    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .populate('carId', 'brand carModel');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};