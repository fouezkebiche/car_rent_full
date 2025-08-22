import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { validationResult } from 'express-validator';
import { sendRegistrationPendingEmail } from '../services/emailService'; // Import new email function

export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, phone, role } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set status to 'pending' for owners, 'active' for customers
    const status = role === 'owner' ? 'pending' : 'active';

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      status,
      joinDate: new Date(),
    });

    await user.save();

    // Send registration pending email for owners
    if (role === 'owner') {
      await sendRegistrationPendingEmail({ to: email, userName: name });
      return res.status(201).json({
        message: 'Registration successful. Your account is pending admin approval. You will receive an email once your account is approved.',
      });
    }

    // Generate JWT for customers
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name,
        email,
        role,
        status,
        phone: user.phone,
        joinDate: user.joinDate,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check status for owners
    if (user.role === 'owner' && user.status === 'pending') {
      return res.status(403).json({ message: 'Account awaiting admin approval' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        joinDate: user.joinDate,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};