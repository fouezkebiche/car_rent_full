import { Router } from 'express';
import { addCar, getCars, getOwnerCars, getPendingCars, approveCar, rejectCar, editCar, upload, deleteCarsById } from '../controllers/carController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';
import { check } from 'express-validator';

const router = Router();

router.post(
  '/',
  [
    authMiddleware,
    roleMiddleware(['owner']),
    upload.single('image'),
    check('brand', 'Brand is required').not().isEmpty(),
    check('carModel', 'Model is required').not().isEmpty(),
    check('year', 'Year must be a number').isNumeric(),
    check('price', 'Price must be a number').isNumeric(),
    check('category', 'Invalid category').isIn(['Economy', 'Compact', 'SUV', 'Luxury', 'Sports']),
    check('transmission', 'Invalid transmission').isIn(['Manual', 'Automatic']),
    check('fuel', 'Invalid fuel type').isIn(['Petrol', 'Diesel', 'Electric', 'Hybrid']),
    check('seats', 'Seats must be a number').isNumeric(),
    check('wilaya', 'Wilaya is required').not().isEmpty(),
    check('commune', 'Commune is required').not().isEmpty(),
    check('chauffeur', 'Chauffeur must be a boolean').isBoolean(),
  ],
  addCar
);

router.put(
  '/edit/:carId',
  [
    authMiddleware,
    roleMiddleware(['owner']),
    upload.single('image'),
    check('brand', 'Brand is required').not().isEmpty(),
    check('carModel', 'Model is required').not().isEmpty(),
    check('year', 'Year must be a number').isNumeric(),
    check('price', 'Price must be a number').isNumeric(),
    check('category', 'Invalid category').isIn(['Economy', 'Compact', 'SUV', 'Luxury', 'Sports']),
    check('transmission', 'Invalid transmission').isIn(['Manual', 'Automatic']),
    check('fuel', 'Invalid fuel type').isIn(['Petrol', 'Diesel', 'Electric', 'Hybrid']),
    check('seats', 'Seats must be a number').isNumeric(),
    check('wilaya', 'Wilaya is required').not().isEmpty(),
    check('commune', 'Commune is required').not().isEmpty(),
    check('chauffeur', 'Chauffeur must be a boolean').isBoolean(),
  ],
  editCar
);

router.get('/', getCars);
router.get('/owner', authMiddleware, roleMiddleware(['owner']), getOwnerCars);
router.get('/pending', authMiddleware, roleMiddleware(['admin']), getPendingCars);
router.put('/approve/:carId', authMiddleware, roleMiddleware(['admin']), approveCar);
router.put('/reject/:carId', authMiddleware, roleMiddleware(['admin']), rejectCar);
router.post(
  '/delete-by-ids',
  [
    authMiddleware,
    roleMiddleware(['admin']),
    check('ids', 'An array of car IDs is required').isArray({ min: 1 }),
  ],
  deleteCarsById
);

export default router;