// backend/src/models/userModel.ts
import db from '../config/db';
import { CreateUserRequest, User, UserDB, UserType } from '../types';
import { mapUserDBToUser } from '../utils/mapper';

export const createUser = async (userData: CreateUserRequest, hashedPassword: string): Promise<User> => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const {
            userType, email, mobileNumber,
            firstName, lastName,
            companyName, phoneNumber, businessTaxNumber,
            representativeFirstName, representativeLastName,
            address
        } = userData;

        // Common fields + specific fields based on userType
        const result = await client.query(
            `INSERT INTO users (
                user_type, email, password_hash, mobile_number,
                first_name, last_name,
                company_name, phone_number, business_tax_number,
                street_number, street_name, city_suburb, state, post_code
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`,
            [
                userType, email, hashedPassword, mobileNumber,
                // Individual fields
                userType === 'individual' ? firstName : representativeFirstName,
                userType === 'individual' ? lastName : representativeLastName,
                // Company fields
                userType === 'company' ? companyName : null,
                userType === 'company' ? phoneNumber : null,
                userType === 'company' ? businessTaxNumber : null,
                // Address fields
                address?.streetNumber || null,
                address?.streetName || null,
                address?.citySuburb || null,
                address?.state || null,
                address?.postCode || null
            ]
        );

        await client.query('COMMIT');
        return mapUserDBToUser(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating user:', error);
        throw error;
    } finally {
        client.release();
    }
};

export const findUserByEmail = async (email: string): Promise<UserDB | null> => {
    const result = await db.query<UserDB>('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
};

export const findUserById = async (id: string): Promise<UserDB | null> => {
    const result = await db.query<UserDB>('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
};