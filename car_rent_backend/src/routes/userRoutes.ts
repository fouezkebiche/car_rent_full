import { Router } from 'express';
import { approveOwner, getUsers, declineUser } from '../controllers/userController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Get all users (admin only)
router.get('/', authMiddleware, roleMiddleware(['admin']), getUsers);

// Approve an owner (admin only)
router.put('/approve/:userId', authMiddleware, roleMiddleware(['admin']), approveOwner);

// Decline and delete a user (admin only)
router.delete('/decline/:userId', authMiddleware, roleMiddleware(['admin']), declineUser);

export default router;