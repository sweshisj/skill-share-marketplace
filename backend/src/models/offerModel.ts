// backend/src/models/offerModel.ts
import db from '../config/db';
import { MakeOfferRequest, Offer, OfferDB } from '../types';
import { mapOfferDBToOffer } from '../utils/mapper';

export const createOffer = async (taskId: string, providerId: string, offerData: MakeOfferRequest): Promise<Offer> => {
    const result = await db.query<OfferDB>(
        `INSERT INTO offers (task_id, provider_id, offered_hourly_rate, offered_rate_currency)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [taskId, providerId, offerData.offeredHourlyRate, offerData.offeredRateCurrency]
    );
    return mapOfferDBToOffer(result.rows[0]);
};

export const findOfferById = async (id: string): Promise<OfferDB | null> => {
    const result = await db.query<OfferDB>('SELECT * FROM offers WHERE id = $1', [id]);
    return result.rows[0] || null;
};

export const updateOfferStatus = async (offerId: string, newStatus: string): Promise<Offer | null> => {
    const result = await db.query<OfferDB>(
        `UPDATE offers SET offer_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [newStatus, offerId]
    );
    return result.rows[0] ? mapOfferDBToOffer(result.rows[0]) : null;
};

export const findOffersByTaskId = async (taskId: string): Promise<Offer[]> => {
    const result = await db.query<OfferDB>('SELECT * FROM offers WHERE task_id = $1 ORDER BY created_at DESC', [taskId]);
    return result.rows.map(mapOfferDBToOffer);
};

export const findAcceptedOfferForTask = async (taskId: string): Promise<OfferDB | null> => {
    const result = await db.query<OfferDB>(
        "SELECT * FROM offers WHERE task_id = $1 AND offer_status = 'accepted'",
        [taskId]
    );
    return result.rows[0] || null;
};