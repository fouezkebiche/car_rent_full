import { Router } from 'express';
import { createBooking, getBookings } from '../controllers/bookingController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';
import { check } from 'express-validator';

const router = Router();

router.post(
  '/',
  [
    authMiddleware,
    roleMiddleware(['customer']),
    check('carId', 'Car ID is required').not().isEmpty(),
    check('startDate', 'Start date is required').isISO8601(),
    check('endDate', 'End date is required').isISO8601(),
    check('pickupLocation', 'Pickup location is required').not().isEmpty(),
    check('dropoffLocation', 'Dropoff location is required').not().isEmpty(),
    check('paymentMethod', 'Invalid payment method').isIn(['credit-card', 'paypal'])
  ],
  createBooking
);

router.get('/', authMiddleware, roleMiddleware(['customer', 'admin']), getBookings);

export default router;