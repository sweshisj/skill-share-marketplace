// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, findUserById } from '../models/userModel';
// Corrected imports: UserRole and UserType are now used
import { CreateUserRequest, LoginRequest, AuthResponse, UserDB, UserRole, UserType } from '../types';
import { mapUserDBToUser } from '../utils/mapper';

// Updated: 'role' and 'userType' are now included in the JWT payload
const generateToken = (id: string, role: UserRole, userType: UserType, email: string) => {
    console.log('Generating token for user:', { id, role, userType, email });
    return jwt.sign({ id, role, userType, email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
};

export const registerUser = async (req: Request, res: Response) => {
    try {
        const userData: CreateUserRequest = req.body;

        // Basic mandatory fields check: email, password, role, and userType are always required
        if (!userData.email || !userData.password || !userData.role || !userData.userType) {
            res.status(400).json({ message: 'Email, password, user role, and user type are required.' });
            return;
        }

        // --- Specific validation based on UserType ---
        if (userData.userType === UserType.Individual) {
            // For individual users, first name, last name, and address are mandatory.
            if (!userData.firstName || !userData.lastName || !userData.address) {
                res.status(400).json({ message: 'For individual users, first name, last name, and address are mandatory.' });
                return;
            }
        } else if (userData.userType === UserType.Company) {
            // For company users, company name, business tax number, and representative names (firstName/lastName) are mandatory.
            if (!userData.companyName || !userData.businessTaxNumber || !userData.firstName || !userData.lastName) {
                res.status(400).json({ message: 'For company users, company name, business tax number, and representative names (first & last name) are mandatory.' });
                return;
            }
            // Address is also mandatory for companies based on previous logic.
            // if (!userData.address) {
            //     res.status(400).json({ message: 'For company users, address is mandatory.' });
            //     return;
            // }
        } else {
            // This case should ideally be caught by TypeScript if userData.userType is strictly typed,
            // but good for runtime validation if unexpected values slip through.
            res.status(400).json({ message: 'Invalid user type provided.' });
            return;
        }

        const existingUser = await findUserByEmail(userData.email);
        if (existingUser) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const newUser = await createUser(userData, hashedPassword); // The userModel already handles mapping

        // Generate token with the new role and userType from the created user
        const token = generateToken(newUser.id, newUser.role, newUser.userType, newUser.email);

        res.status(201).json({ token, user: newUser });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration', error: (error as Error).message });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password }: LoginRequest = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required.' });
            return;
        }

        const userDB: UserDB | null = await findUserByEmail(email);
        if (!userDB) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        const isMatch = await bcrypt.compare(password, userDB.password_hash);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        // Generate token using userDB's role and user_type (which are snake_case from DB)
        const token = generateToken(userDB.id, userDB.role, userDB.user_type, userDB.email);
        const user = mapUserDBToUser(userDB); // Map DB object to frontend User interface

        res.json({ token, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login', error: (error as Error).message });
    }
};

// Updated AuthRequest interface to reflect the JWT payload structure (role and userType)
interface AuthRequest extends Request {
    user?: { id: string; role: UserRole; userType: UserType; email: string };
}

export const getMyProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'User not authenticated.' });
            return;
        }
        const userDB = await findUserById(req.user.id);
        if (!userDB) {
            res.status(404).json({ message: 'User profile not found.' });
            return;
        }
        const user = mapUserDBToUser(userDB);
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error fetching profile', error: (error as Error).message });
    }
};