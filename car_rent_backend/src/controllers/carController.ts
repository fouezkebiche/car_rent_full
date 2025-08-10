import { Request, Response } from 'express';
import Car, { ICar } from '../models/Car';
import { AuthRequest } from '../middleware/authMiddleware';
import { validationResult } from 'express-validator';

export const addCar = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { brand, carModel, year, price, image, category, transmission, fuel, seats, features, location } = req.body;

  try {
    const car = new Car({
      brand,
      carModel,
      year,
      price,
      image,
      category,
      transmission,
      fuel,
      seats,
      available: true,
      features,
      location,
      rating: 0,
      ownerId: req.user?.userId,
      status: 'pending',
    });

    await car.save();
    res.status(201).json({
      car: {
        id: car._id,
        brand: car.brand,
        carModel: car.carModel,
        year: car.year,
        price: car.price,
        image: car.image,
        category: car.category,
        transmission: car.transmission,
        fuel: car.fuel,
        seats: car.seats,
        available: car.available,
        features: car.features,
        location: car.location,
        rating: car.rating,
        ownerId: car.ownerId,
        status: car.status,
      },
    });
  } catch (error) {
    console.error('Add car error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCars = async (req: Request, res: Response) => {
  try {
    const cars = await Car.find({ status: 'approved' }).populate('ownerId', 'name email');
    res.json(cars);
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOwnerCars = async (req: AuthRequest, res: Response) => {
  try {
    const cars = await Car.find({ ownerId: req.user?.userId });
    res.json(cars);
  } catch (error) {
    console.error('Get owner cars error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPendingCars = async (req: AuthRequest, res: Response) => {
  try {
    const cars = await Car.find({ status: 'pending' }).populate('ownerId', 'name email');
    res.json(cars);
  } catch (error) {
    console.error('Get pending cars error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const approveCar = async (req: AuthRequest, res: Response) => {
  const { carId } = req.params;

  try {
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    car.status = 'approved';
    car.updatedAt = new Date();
    await car.save();

    res.json({
      car: {
        id: car._id,
        brand: car.brand,
        carModel: car.carModel,
        year: car.year,
        price: car.price,
        image: car.image,
        category: car.category,
        transmission: car.transmission,
        fuel: car.fuel,
        seats: car.seats,
        available: car.available,
        features: car.features,
        location: car.location,
        rating: car.rating,
        ownerId: car.ownerId,
        status: car.status,
      },
    });
  } catch (error) {
    console.error('Approve car error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const rejectCar = async (req: AuthRequest, res: Response) => {
  const { carId } = req.params;
  const { rejectionReason, definitive } = req.body;

  try {
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    car.status = 'rejected';
    car.rejectionReason = rejectionReason || (definitive ? 'Permanently rejected' : undefined);
    car.updatedAt = new Date();
    await car.save();

    res.json({
      car: {
        id: car._id,
        brand: car.brand,
        carModel: car.carModel,
        year: car.year,
        price: car.price,
        image: car.image,
        category: car.category,
        transmission: car.transmission,
        fuel: car.fuel,
        seats: car.seats,
        available: car.available,
        features: car.features,
        location: car.location,
        rating: car.rating,
        ownerId: car.ownerId,
        status: car.status,
        rejectionReason: car.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Reject car error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const editCar = async (req: AuthRequest, res: Response) => {
  const { carId } = req.params;
  const { brand, carModel, year, price, image, category, transmission, fuel, seats, features, location } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.ownerId.toString() !== req.user?.userId) {
      return res.status(403).json({ message: 'Unauthorized to edit this car' });
    }

    if (car.status !== 'rejected') {
      return res.status(400).json({ message: 'Can only edit rejected cars' });
    }

    car.brand = brand;
    car.carModel = carModel;
    car.year = year;
    car.price = price;
    car.image = image;
    car.category = category;
    car.transmission = transmission;
    car.fuel = fuel;
    car.seats = seats;
    car.features = features;
    car.location = location;
    car.status = 'pending';
    car.rejectionReason = undefined;
    car.updatedAt = new Date();

    await car.save();

    res.json({
      car: {
        id: car._id,
        brand: car.brand,
        carModel: car.carModel,
        year: car.year,
        price: car.price,
        image: car.image,
        category: car.category,
        transmission: car.transmission,
        fuel: car.fuel,
        seats: car.seats,
        available: car.available,
        features: car.features,
        location: car.location,
        rating: car.rating,
        ownerId: car.ownerId,
        status: car.status,
        rejectionReason: car.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Edit car error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};