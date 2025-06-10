// backend/src/models/userModel.ts
import db from '../config/db';
// Corrected imports to use the new UserRole and UserType enums
import { CreateUserRequest, User, UserDB, UserRole, UserType } from '../types';
import { mapUserDBToUser } from '../utils/mapper'; // Assuming mapUserDBToUser correctly handles the new 'role' and 'user_type' fields

/**
 * Creates a new user entry in the database.
 * @param userData The data for creating the user from the client request.
 * @param hashedPassword The hashed password to store.
 * @returns A promise that resolves to the created User object (frontend format).
 */
export const createUser = async (userData: CreateUserRequest, hashedPassword: string): Promise<User> => {
    const client = await db.connect();
    try {
        await client.query('BEGIN'); // Start a transaction

        const {
            role,           // Now directly from CreateUserRequest
            userType,     // Now directly from CreateUserRequest
            email,
            firstName,
            lastName,
            companyName,
            phoneNumber,
            businessTaxNumber,
            address
            // 'representativeFirstName' and 'representativeLastName' are no longer directly used
            // for database mapping, as 'firstName' and 'lastName' are considered the primary
            // name fields for the user (or their representative if it's a company).
        } = userData;

        // Insert new user into the 'users' table
        const result = await client.query(
            `INSERT INTO users (
                role,               -- Corrected column name from 'user_type' to 'role'
                user_type,        -- New column for 'individual' or 'company'
                email,
                password_hash,
                first_name,
                last_name,
                company_name,
                phone_number,
                business_tax_number,
                street_number,
                street_name,
                city_suburb,
                state,
                post_code
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`, // RETURNING * fetches the newly created row
            [
                role,                                         // Value for the 'role' column
                userType,                                   // Value for the 'user_type' column
                email,
                hashedPassword,
                firstName || null,                            // Use firstName directly
                lastName || null,                             // Use lastName directly
                userType === UserType.Company ? companyName || null : null, // company_name only if userType is 'company'
                phoneNumber || null,
                userType === UserType.Company ? businessTaxNumber || null : null, // business_tax_number only if userType is 'company'
                address?.streetNumber || null,
                address?.streetName || null,
                address?.citySuburb || null,
                address?.state || null,
                address?.postCode || null
            ]
        );

        await client.query('COMMIT'); // Commit the transaction
        // Map the database row to the frontend User interface
        return mapUserDBToUser(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK'); // Rollback on error
        console.error('Error creating user:', error);
        throw error; // Re-throw to propagate the error
    } finally {
        client.release(); // Release the client back to the pool
    }
};

/**
 * Finds a user by their email address.
 * @param email The email of the user to find.
 * @returns A promise that resolves to the UserDB object or null if not found.
 */
export const findUserByEmail = async (email: string): Promise<UserDB | null> => {
    const result = await db.query<UserDB>('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
};

/**
 * Finds a user by their ID.
 * @param id The ID of the user to find.
 * @returns A promise that resolves to the UserDB object or null if not found.
 */
export const findUserById = async (id: string): Promise<UserDB | null> => {
    const result = await db.query<UserDB>('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
};