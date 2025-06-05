// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, findUserById } from '../models/userModel'; // Assuming findUserById now part of userModel
import { CreateUserRequest, LoginRequest, AuthResponse, UserType, UserDB } from '../types';
import { mapUserDBToUser } from '../utils/mapper';

const generateToken = (id: string, userType: UserType, email: string) => {
    return jwt.sign({ id, userType, email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });
};

export const registerUser = async (req: Request, res: Response) => {
    try {
        const userData: CreateUserRequest = req.body;

        if (!userData.email || !userData.password || !userData.userType) {
            res.status(400).json({ message: 'Email, password, and user type are required.' });
            return;
        }
        if (userData.userType === 'individual' && (!userData.firstName || !userData.lastName || !userData.address)) {
            res.status(400).json({ message: 'For individual users, first name, last name, and address are mandatory.' });
            return;
        }
        if (userData.userType === 'company' && (!userData.companyName || !userData.businessTaxNumber || !userData.representativeFirstName || !userData.representativeLastName)) {
            res.status(400).json({ message: 'For company users, company name, business tax number, and representative names are mandatory.' });
            return;
        }

        const existingUser = await findUserByEmail(userData.email);
        if (existingUser) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const newUser = await createUser(userData, hashedPassword);

        const token = generateToken(newUser.id, newUser.userType, newUser.email);

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

        const token = generateToken(userDB.id, userDB.user_type, userDB.email);
        const user = mapUserDBToUser(userDB);

        res.json({ token, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login', error: (error as Error).message });
    }
};

interface AuthRequest extends Request {

    user?: { id: string; userType: UserType; email: string };

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