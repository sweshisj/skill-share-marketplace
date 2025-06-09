// backend/src/models/offerModel.ts
import db from '../config/db';
import { MakeOfferRequest, Offer, OfferDB, OfferStatus, OfferWithProvider, ProviderPublicDetails } from '../types'; // Import OfferStatus
import { mapOfferDBToOffer } from '../utils/mapper';

export const createOffer = async (taskId: string, providerId: string, offerData: MakeOfferRequest): Promise<Offer> => {
    try {
        const result = await db.query<OfferDB>(
            `INSERT INTO offers (task_id, provider_id, offered_hourly_rate, offered_rate_currency, message)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [taskId, providerId, offerData.offeredHourlyRate, offerData.offeredRateCurrency, offerData.message || null] // Added message
        );
        return mapOfferDBToOffer(result.rows[0]);
    } catch (error) {
        console.error('Error creating offer:', error);
        throw error;
    }
};
export const findOfferByProviderIdAndTaskId = async (
    providerId: string,
    taskId: string,
    status?: OfferStatus
): Promise<Offer | null> => {
    try {
        let query = 'SELECT * FROM offers WHERE provider_id = $1 AND task_id = $2';
        let params: any[] = [providerId, taskId];
        if (status) {
            query += ' AND offer_status = $3';
            params.push(status);
        }
        const result = await db.query(query, params);
        if (result.rows.length === 0) {
            return null;
        }
        return mapOfferDBToOffer(result.rows[0]);
    } catch (error) {
        console.error(`Error finding offer by provider ${providerId} and task ${taskId}:`, error);
        throw error;
    }
};
export const findOfferById = async (id: string): Promise<Offer | null> => { // Returns mapped Offer type
    try {
        const result = await db.query<OfferDB>('SELECT * FROM offers WHERE id = $1', [id]);
        return result.rows[0] ? mapOfferDBToOffer(result.rows[0]) : null;
    } catch (error) {
        console.error('Error finding offer by ID:', error);
        throw error;
    }
};

export const updateOfferStatus = async (offerId: string, newStatus: OfferStatus): Promise<Offer | null> => { // Use OfferStatus type
    try {
        const result = await db.query<OfferDB>(
            `UPDATE offers SET offer_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [newStatus, offerId]
        );
        return result.rows[0] ? mapOfferDBToOffer(result.rows[0]) : null;
    } catch (error) {
        console.error('Error updating offer status:', error);
        throw error;
    }
};

export const findOffersByTaskId = async (taskId: string): Promise<Offer[]> => {
    try {
        const result = await db.query<OfferDB>('SELECT * FROM offers WHERE task_id = $1 ORDER BY created_at DESC', [taskId]);

        // FIX: Explicitly type the item in the map callback
        return result.rows.map((offerDBItem: OfferDB) => mapOfferDBToOffer(offerDBItem));

    } catch (error) {
        console.error('Error finding offers by task ID:', error);
        throw error;
    }
};

export const findAcceptedOfferForTask = async (taskId: string): Promise<Offer | null> => { // Returns mapped Offer | null
    try {
        const result = await db.query<OfferDB>(
            "SELECT * FROM offers WHERE task_id = $1 AND offer_status = 'accepted'",
            [taskId]
        );
        return result.rows[0] ? mapOfferDBToOffer(result.rows[0]) : null;
    } catch (error) {
        console.error('Error finding accepted offer for task:', error);
        throw error;
    }
};
export const findOffersWithProviderDetailsByTaskId = async (taskId: string): Promise<OfferWithProvider[]> => {
    try {
        const result = await db.query(
            `SELECT
                o.id, o.task_id, o.provider_id, o.offered_hourly_rate, o.offered_rate_currency,
                o.offer_status, o.message, o.created_at, o.updated_at,
                u.id AS user_id, u.user_type, u.email, u.first_name, u.last_name, u.company_name
             FROM offers o
             JOIN users u ON o.provider_id = u.id
             WHERE o.task_id = $1
             ORDER BY o.created_at DESC`,
            [taskId]
        );

        if (result.rows.length === 0) {
            return [];
        }

        // Map the combined DB results to OfferWithProvider type
        const offersWithProviders: OfferWithProvider[] = result.rows.map((row: any) => {
            // Re-use your existing mapOfferDBToOffer for the core offer fields
            // Ensure mapOfferDBToOffer expects an object with snake_case keys (like the DB rows)
            const offer: Offer = mapOfferDBToOffer(row);

            // Map Provider Public Details from the joined user columns
            const providerDetails: ProviderPublicDetails = {
                id: row.user_id, // Alias from the SQL query
                userType: row.user_type,
                email: row.email,
                firstName: row.first_name,
                lastName: row.last_name,
                companyName: row.company_name,
            };

            return {
                ...offer,
                providerDetails: providerDetails,
            };
        });

        return offersWithProviders;

    } catch (error) {
        console.error(`Error finding offers with provider details for task ID ${taskId}:`, error);
        throw error; // Re-throw to be caught by the controller
    }
};