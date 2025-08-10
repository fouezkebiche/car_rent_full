import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

export const approveOwner = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'owner') {
      return res.status(400).json({ message: 'User is not an owner' });
    }

    user.status = 'active';
    user.updatedAt = new Date();
    await user.save();

    res.json({
      message: 'Owner approved',
      user: { id: user._id, name: user.name, email: user.email, status: user.status },
    });
  } catch (error) {
    console.error('Approve owner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password -__v');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};