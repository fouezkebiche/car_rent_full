import { Request, Response } from 'express';
import Car, { ICar } from '../models/Car';
import { AuthRequest } from '../middleware/authMiddleware';
import { validationResult } from 'express-validator';
import { sendCarStatusEmail } from '../services/emailService';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import mongoose from 'mongoose';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../Uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// File filter to allow only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG images are allowed'));
  }
};

// Initialize Multer
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Optional: Configure Cloudinary (uncomment to use)
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

export const addCar = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { brand, carModel, year, price, category, transmission, fuel, seats, features, wilaya, commune, chauffeur } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'Image file is required' });
  }

  try {
    console.log('Adding car with ownerId:', req.user?.userId); // Debug: Log ownerId
    const imagePath = `/Uploads/${file.filename}`;

    const car = new Car({
      brand,
      carModel,
      year: Number(year),
      price: Number(price),
      image: imagePath,
      category,
      transmission,
      fuel,
      seats: Number(seats),
      available: true,
      features: features ? JSON.parse(features) : [],
      wilaya,
      commune,
      rating: 0,
      ownerId: req.user?.userId,
      status: 'pending',
      chauffeur: chauffeur === 'true' || chauffeur === true,
    });

    await car.save();
    console.log('Car saved:', car); // Debug: Log saved car
    res.status(201).json({ car });
  } catch (error) {
    console.error('Add car error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCars = async (req: Request, res: Response) => {
  try {
    const cars = await Car.find({ status: 'approved' }).populate('ownerId', 'name email');
    console.log('Fetched cars:', cars);
    res.json(cars);
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOwnerCars = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Fetching cars for owner:', req.user?.userId); // Debug: Log userId
    const cars = await Car.find({ ownerId: req.user?.userId });
    console.log('Fetched owner cars:', cars);
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
    const car = await Car.findById(carId).populate('ownerId', 'name email');
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    car.status = 'approved';
    car.updatedAt = new Date();
    await car.save();

    const ownerEmail = (car.ownerId as any).email;
    const ownerName = (car.ownerId as any).name;
    await sendCarStatusEmail({
      to: ownerEmail,
      ownerName,
      carDetails: `${car.brand} ${car.carModel} (${car.year})`,
      status: 'approved',
      chauffeur: car.chauffeur,
    });

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
        wilaya: car.wilaya,
        commune: car.commune,
        rating: car.rating,
        ownerId: car.ownerId,
        status: car.status,
        chauffeur: car.chauffeur,
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
    const car = await Car.findById(carId).populate('ownerId', 'name email');
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    car.status = 'rejected';
    car.rejectionReason = rejectionReason || (definitive ? 'Permanently rejected' : undefined);
    car.updatedAt = new Date();
    await car.save();

    const ownerEmail = (car.ownerId as any).email;
    const ownerName = (car.ownerId as any).name;
    await sendCarStatusEmail({
      to: ownerEmail,
      ownerName,
      carDetails: `${car.brand} ${car.carModel} (${car.year})`,
      status: 'rejected',
      rejectionReason: car.rejectionReason,
      chauffeur: car.chauffeur,
    });

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
        wilaya: car.wilaya,
        commune: car.commune,
        rating: car.rating,
        ownerId: car.ownerId,
        status: car.status,
        rejectionReason: car.rejectionReason,
        chauffeur: car.chauffeur,
      },
    });
  } catch (error) {
    console.error('Reject car error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const editCar = async (req: AuthRequest, res: Response) => {
  const { carId } = req.params;
  const { brand, carModel, year, price, category, transmission, fuel, seats, features, wilaya, commune, chauffeur } = req.body;
  const file = req.file;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Fetch car WITHOUT populate initially
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    console.log('Editing car:', { carId, ownerId: car.ownerId.toString(), userId: req.user?.userId, carStatus: car.status }); // Debug: Log ownership and status

    if (!req.user?.userId) {
      console.log('No userId in request');
      return res.status(401).json({ message: 'Authentication token is missing or invalid' });
    }

    // Use car.ownerId (ObjectId) for comparison
    if (car.ownerId.toString() !== req.user.userId) {
      console.log('Unauthorized: Owner ID mismatch', { carOwnerId: car.ownerId.toString(), userId: req.user.userId });
      return res.status(403).json({ message: 'Unauthorized to edit this car' });
    }

    if (car.status !== 'rejected' && car.status !== 'pending') {
      console.log('Invalid status for editing:', car.status);
      return res.status(400).json({ message: 'Can only edit rejected or pending cars' });
    }

    let imagePath = car.image;
    if (file) {
      imagePath = `/Uploads/${file.filename}`;
      if (car.image && car.image.startsWith('/Uploads/')) {
        const oldImagePath = path.join(__dirname, '../../', car.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    car.brand = brand;
    car.carModel = carModel;
    car.year = Number(year);
    car.price = Number(price);
    car.image = imagePath;
    car.category = category;
    car.transmission = transmission;
    car.fuel = fuel;
    car.seats = Number(seats);
    car.features = features ? JSON.parse(features) : [];
    car.wilaya = wilaya;
    car.commune = commune;
    car.status = 'pending';
    car.rejectionReason = undefined;
    car.updatedAt = new Date();
    car.chauffeur = chauffeur === 'true' || chauffeur === true;

    await car.save();

    // Now populate for email sending
    await car.populate('ownerId', 'name email');

    const ownerEmail = (car.ownerId as any).email;
    const ownerName = (car.ownerId as any).name;
    await sendCarStatusEmail({
      to: ownerEmail,
      ownerName,
      carDetails: `${car.brand} ${car.carModel} (${car.year})`,
      status: 'resubmitted',
      chauffeur: car.chauffeur,
    });

    // Depopulate if needed for response, or just send as is (frontend likely doesn't care)
    res.json({ car });
  } catch (error) {
    console.error('Edit car error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete cars by IDs (admin-only)
export const deleteCarsById = async (req: AuthRequest, res: Response) => {
  const { ids } = req.body;

  // Validate input
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'An array of car IDs is required' });
  }

  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete cars' });
    }

    // Validate that all IDs are valid ObjectIds
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      return res.status(400).json({ message: 'One or more invalid car IDs provided' });
    }

    // Find cars to delete (to clean up images)
    const cars = await Car.find({ _id: { $in: validIds } });

    // Delete associated images from file system
    for (const car of cars) {
      if (car.image && car.image.startsWith('/Uploads/')) {
        const imagePath = path.join(__dirname, '../../', car.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    // Delete cars from database
    const result = await Car.deleteMany({ _id: { $in: validIds } });

    // Check if any cars were deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No cars found with the provided IDs' });
    }

    res.json({
      message: 'Cars deleted successfully',
      deletedCount: result.deletedCount,
      deletedIds: validIds,
    });
  } catch (error) {
    console.error('Delete cars by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};