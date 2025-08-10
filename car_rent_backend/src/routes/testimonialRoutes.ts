import { Router } from 'express';
import { addTestimonial, getTestimonials } from '../controllers/testimonialController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';
import { check } from 'express-validator';

const router = Router();

router.post(
  '/',
  [
    authMiddleware,
    roleMiddleware(['customer']),
    check('name', 'Name is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    check('comment', 'Comment is required').not().isEmpty(),
    check('avatar', 'Avatar URL is required').not().isEmpty()
  ],
  addTestimonial
);

router.get('/', getTestimonials);

export default router;