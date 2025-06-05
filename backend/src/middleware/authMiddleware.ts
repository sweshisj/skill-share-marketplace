// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserType, UserDB, TaskDB } from '../types';
import { findUserById } from '../models/userModel'; // Import to verify user existence
import { findTaskById } from '../models/taskModel';

interface AuthRequest extends Request {
    user?: { id: string; userType: UserType; email: string };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'your_jwt_secret';
        const decoded: any = jwt.verify(token, secret);

        const user = await findUserById(decoded.id);

        if (!user) {
            res.status(401).json({ message: 'Not authorized, user not found' });
            return;
        }

        req.user = {
            id: user.id,
            userType: user.user_type,
            email: user.email
        };
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ message: 'Not authorized, token failed' });
        return;
    }
};

export const authorizeRoles = (roles: UserType[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.userType)) {
            res.status(403).json({ message: 'Forbidden, insufficient role' });
            return;
        }
        next();
    };
};

export const isTaskOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const taskId = req.params.id || req.params.taskId;
    if (!taskId) {
        res.status(400).json({ message: 'Task ID is required' });
        return;
    }

    try {
        const task = await findTaskById(taskId);
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        if (task.user_id !== req.user?.id) {
            res.status(403).json({ message: 'Forbidden, you do not own this task' });
            return;
        }
        req.task = task;
        next();
    } catch (error) {
        console.error('Error checking task ownership:', error);
        res.status(500).json({ message: 'Server error' });
        return;
    }
};

// Extend Request type to include task for isTaskOwner middleware
declare global {
    namespace Express {
        interface Request {
            task?: TaskDB;
        }
    }
}