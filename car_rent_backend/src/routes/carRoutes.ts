import { Router } from 'express';
import { addCar, getCars, getOwnerCars, getPendingCars, approveCar, rejectCar, editCar } from '../controllers/carController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';
import { check } from 'express-validator';

const router = Router();

router.post(
  '/',
  [
    authMiddleware,
    roleMiddleware(['owner']),
    check('brand', 'Brand is required').not().isEmpty(),
    check('carModel', 'Model is required').not().isEmpty(),
    check('year', 'Year must be a number').isNumeric(),
    check('price', 'Price must be a number').isNumeric(),
    check('image', 'Image URL is required').not().isEmpty(),
    check('category', 'Invalid category').isIn(['Economy', 'Compact', 'SUV', 'Luxury', 'Sports']),
    check('transmission', 'Invalid transmission').isIn(['Manual', 'Automatic']),
    check('fuel', 'Invalid fuel type').isIn(['Petrol', 'Diesel', 'Electric', 'Hybrid']),
    check('seats', 'Seats must be a number').isNumeric(),
    check('location', 'Location is required').not().isEmpty(),
  ],
  addCar
);

router.put(
  '/edit/:carId',
  [
    authMiddleware,
    roleMiddleware(['owner']),
    check('brand', 'Brand is required').not().isEmpty(),
    check('carModel', 'Model is required').not().isEmpty(),
    check('year', 'Year must be a number').isNumeric(),
    check('price', 'Price must be a number').isNumeric(),
    check('image', 'Image URL is required').not().isEmpty(),
    check('category', 'Invalid category').isIn(['Economy', 'Compact', 'SUV', 'Luxury', 'Sports']),
    check('transmission', 'Invalid transmission').isIn(['Manual', 'Automatic']),
    check('fuel', 'Invalid fuel type').isIn(['Petrol', 'Diesel', 'Electric', 'Hybrid']),
    check('seats', 'Seats must be a number').isNumeric(),
    check('location', 'Location is required').not().isEmpty(),
  ],
  editCar
);

router.get('/', getCars);
router.get('/owner', authMiddleware, roleMiddleware(['owner']), getOwnerCars);
router.get('/pending', authMiddleware, roleMiddleware(['admin']), getPendingCars);
router.put('/approve/:carId', authMiddleware, roleMiddleware(['admin']), approveCar);
router.put('/reject/:carId', authMiddleware, roleMiddleware(['admin']), rejectCar);

export default router;