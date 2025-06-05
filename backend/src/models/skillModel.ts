// backend/src/models/skillModel.ts
import db from '../config/db';
import { CreateSkillRequest, Skill, SkillDB, UpdateSkillRequest } from '../types';
import { mapSkillDBToSkill } from '../utils/mapper';

export const createSkill = async (providerId: string, skillData: CreateSkillRequest): Promise<Skill> => {
    const result = await db.query<SkillDB>(
        `INSERT INTO skills (provider_id, category, experience, nature_of_work, hourly_rate, rate_currency)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [providerId, skillData.category, skillData.experience, skillData.natureOfWork, skillData.hourlyRate, skillData.rateCurrency]
    );
    return mapSkillDBToSkill(result.rows[0]);
};

export const findSkillById = async (id: string): Promise<SkillDB | null> => {
    const result = await db.query<SkillDB>('SELECT * FROM skills WHERE id = $1', [id]);
    return result.rows[0] || null;
};

export const updateSkill = async (id: string, providerId: string, skillData: UpdateSkillRequest): Promise<Skill | null> => {
    const fields = Object.keys(skillData)
        .filter(key => (skillData as any)[key] !== undefined)
        .map((key, index) => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${index + 3}`); // Convert camelCase to snake_case
    const values = Object.values(skillData).filter(value => value !== undefined);

    if (fields.length === 0) {
        return null; // No fields to update
    }

    const query = `UPDATE skills SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 AND provider_id = $2 RETURNING *`;
    const result = await db.query<SkillDB>(query, [id, providerId, ...values]);

    return result.rows[0] ? mapSkillDBToSkill(result.rows[0]) : null;
};

export const findSkillsByProviderId = async (providerId: string): Promise<Skill[]> => {
    const result = await db.query<SkillDB>('SELECT * FROM skills WHERE provider_id = $1 ORDER BY created_at DESC', [providerId]);
    return result.rows.map(mapSkillDBToSkill);
};