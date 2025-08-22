import { Request, Response } from 'express';
import Booking, { IBooking } from '../models/Booking';
import Car from '../models/Car';
import User from '../models/User'; // Added import
import { AuthRequest } from '../middleware/authMiddleware';
import { validationResult } from 'express-validator';
import { sendBookingStatusEmail } from '../services/emailService';

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
      ownerId: car.ownerId,
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

    // Send notification email to owner
    const owner = await User.findById(car.ownerId).select('email name');
    if (owner) {
      await sendBookingStatusEmail({
        to: owner.email,
        userName: owner.name,
        carDetails: `${car.brand} ${car.carModel}`,
        status: 'pending', // Fixed in emailService.ts
        pickupLocation: booking.pickupLocation,
        startDate: booking.startDate,
      });
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBookings = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.user?.role === 'admin' ? {} : { userId: req.user?.userId };
    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .populate('carId', 'brand carModel ownerId');
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPendingOwnerBookings = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const bookings = await Booking.find({ ownerId: req.user.userId, status: 'pending' })
      .populate('userId', 'name email')
      .populate('carId', 'brand carModel ownerId');
    res.json(bookings);
  } catch (error) {
    console.error('Get pending owner bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('carId', 'brand carModel ownerId');
    res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const approveBooking = async (req: AuthRequest, res: Response) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email')
      .populate('carId', 'brand carModel ownerId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user?.role !== 'owner' || booking.ownerId.toString() !== req.user?.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = 'confirmed';
    booking.updatedAt = new Date();
    await booking.save();

    // Send approval email to customer
    const userEmail = (booking.userId as any).email;
    const userName = (booking.userId as any).name;
    const carDetails = `${(booking.carId as any).brand} ${(booking.carId as any).carModel}`;
    await sendBookingStatusEmail({
      to: userEmail,
      userName,
      carDetails,
      status: 'confirmed',
      pickupLocation: booking.pickupLocation,
      startDate: booking.startDate,
    });

    res.json({
      booking: {
        id: booking._id,
        userId: booking.userId,
        carId: booking.carId,
        ownerId: booking.ownerId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmount: booking.totalAmount,
        status: booking.status,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        additionalServices: booking.additionalServices,
        paymentMethod: booking.paymentMethod,
        rejectionReason: booking.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const rejectBooking = async (req: AuthRequest, res: Response) => {
  const { bookingId } = req.params;
  const { rejectionReason } = req.body;

  try {
    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email')
      .populate('carId', 'brand carModel ownerId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user?.role !== 'owner' || booking.ownerId.toString() !== req.user?.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = 'cancelled';
    booking.rejectionReason = rejectionReason || '';
    booking.updatedAt = new Date();
    await booking.save();

    // Set car back to available
    const car = await Car.findById(booking.carId);
    if (car) {
      car.available = true;
      await car.save();
    }

    // Send rejection email to customer
    const userEmail = (booking.userId as any).email;
    const userName = (booking.userId as any).name;
    const carDetails = `${(booking.carId as any).brand} ${(booking.carId as any).carModel}`;
    await sendBookingStatusEmail({
      to: userEmail,
      userName,
      carDetails,
      status: 'cancelled',
      pickupLocation: booking.pickupLocation,
      startDate: booking.startDate,
      rejectionReason,
    });

    res.json({
      booking: {
        id: booking._id,
        userId: booking.userId,
        carId: booking.carId,
        ownerId: booking.ownerId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmount: booking.totalAmount,
        status: booking.status,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        additionalServices: booking.additionalServices,
        paymentMethod: booking.paymentMethod,
        rejectionReason: booking.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};