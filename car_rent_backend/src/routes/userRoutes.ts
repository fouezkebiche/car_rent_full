import { Router } from 'express';
import { approveOwner, getUsers } from '../controllers/userController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.put('/approve/:userId', authMiddleware, roleMiddleware(['admin']), approveOwner);
router.get('/', authMiddleware, roleMiddleware(['admin']), getUsers);

export default router;