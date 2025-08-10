import { Request, Response } from 'express';
import Testimonial, { ITestimonial } from '../models/Testimonial';
import { AuthRequest } from '../middleware/authMiddleware';
import { validationResult } from 'express-validator';

export const addTestimonial = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, location, rating, comment, avatar } = req.body;

  try {
    const testimonial = new Testimonial({
      name,
      location,
      rating,
      comment,
      avatar,
      userId: req.user?.userId
    });

    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find().populate('userId', 'name email');
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};