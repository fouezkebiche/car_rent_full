import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/User';
import Car from './models/Car';
import Booking from './models/Booking';
import Testimonial from './models/Testimonial';

dotenv.config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Clear existing data (optional, comment out to keep existing data)
    await User.deleteMany({});
    await Car.deleteMany({});
    await Booking.deleteMany({});
    await Testimonial.deleteMany({});
    console.log('Cleared existing data');

    // Insert users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = await User.insertMany([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        phone: '+1234567890',
        role: 'customer',
        status: 'active'
      },
      {
        name: 'Jane Owner',
        email: 'jane@example.com',
        password: hashedPassword,
        phone: '+1234567891',
        role: 'owner',
        status: 'active' // Active for testing
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        phone: '+1234567899',
        role: 'admin',
        status: 'active'
      }
    ]);
    console.log('Inserted users');

    // Find owner
    const owner = users.find((u: any) => u.role === 'owner');
    if (!owner) {
      throw new Error('No owner user found');
    }
    const ownerId = owner._id;

    // Insert cars
    const cars = await Car.insertMany([
      {
        brand: 'Toyota',
        carModel: 'Camry', // Updated to carModel
        year: 2023,
        price: 45,
        image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=500',
        category: 'Compact',
        transmission: 'Automatic',
        fuel: 'Petrol',
        seats: 5,
        available: true,
        features: ['GPS', 'AC', 'Bluetooth'],
        location: 'Downtown',
        rating: 4.5,
        ownerId: ownerId
      },
      {
        brand: 'BMW',
        carModel: 'X5', // Updated to carModel
        year: 2023,
        price: 95,
        image: 'https://images.pexels.com/photos/244206/pexels-photo-244206.jpeg?auto=compress&cs=tinysrgb&w=500',
        category: 'SUV',
        transmission: 'Automatic',
        fuel: 'Petrol',
        seats: 7,
        available: true,
        features: ['GPS', 'Leather Seats', 'Sunroof'],
        location: 'Airport',
        rating: 4.8,
        ownerId: ownerId
      }
    ]);
    console.log('Inserted cars');

    // Find customer
    const customer = users.find((u: any) => u.role === 'customer');
    if (!customer) {
      throw new Error('No customer user found');
    }
    const customerId = customer._id;

    // Insert bookings
    await Booking.insertMany([
      {
        userId: customerId,
        carId: cars[0]._id,
        startDate: new Date('2025-08-15'),
        endDate: new Date('2025-08-18'),
        totalAmount: 135,
        status: 'confirmed',
        pickupLocation: 'Downtown Office',
        dropoffLocation: 'Airport',
        additionalServices: ['gps', 'insurance'],
        paymentMethod: 'credit-card'
      }
    ]);
    console.log('Inserted bookings');

    // Insert testimonials
    await Testimonial.insertMany([
      {
        name: 'Emily Davis',
        location: 'New York, NY',
        rating: 5,
        comment: 'Excellent service!',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
        userId: customerId
      }
    ]);
    console.log('Inserted testimonials');

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase();