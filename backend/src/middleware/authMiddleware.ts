import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, UserType, UserDB, TaskDB } from '../types';
import { findUserById } from '../models/userModel';
import { findTaskById } from '../models/taskModel';

interface AuthRequest extends Request {
    user?: { id: string; role: UserRole; userType: UserType; email: string }; 
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    // Check if token is in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // If no token is provided
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'your_jwt_secret';
        const decoded = jwt.verify(token, secret) as { id: string; role: UserRole; userType: UserType; email: string; iat: number; exp: number }; // Changed userType to userType

        // Find the user by ID from the decoded token payload
        const user = await findUserById(decoded.id);

        // If user does not exist in the database
        if (!user) {
            res.status(401).json({ message: 'Not authorized, user not found' });
            return;
        }

        // Attach user data to the request object for subsequent middleware/route handlers
        req.user = {
            id: user.id,
            role: user.role,           
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

export const authorizeRoles = (roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            console.log('Unauthorized access attempt:', req.user);
            console.log(`Unauthorized access attempt by user with role: ${req.user?.role}`);
            res.status(403).json({ message: 'Forbidden, insufficient role' });
            return;
        }
        next(); // Proceed if authorized
    };
};

export const isTaskOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const taskId = req.params.id || req.params.taskId; // Get task ID from route parameters
    if (!taskId) {
        res.status(400).json({ message: 'Task ID is required' });
        return;
    }

    try {
        const task = await findTaskById(taskId); // Find the task by ID
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // Check if the authenticated user is the owner of the task
        if (task.user_id !== req.user?.id) {
            res.status(403).json({ message: 'Forbidden, you do not own this task' });
            return;
        }
        // Attach the task object to the request for convenience
        req.task = task;
        next(); // Proceed if the user is the task owner
    } catch (error) {
        console.error('Error checking task ownership:', error);
        res.status(500).json({ message: 'Server error' });
        return;
    }
};

// Extend Express Request type to include the 'task' property
declare global {
    namespace Express {
        interface Request {
            task?: TaskDB;
        }
    }
}