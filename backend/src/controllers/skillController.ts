import { Request, Response } from 'express';
import { CreateSkillRequest, UpdateSkillRequest, UserType } from '../types';
import { createSkill, findSkillById, updateSkill, findSkillsByProviderId, deleteUserSkill, findSkillBySkillId } from '../models/skillModel';

interface AuthRequest extends Request {
    user?: { id: string; userType: UserType; email: string };
}

export const createSkillHandler = async (req: AuthRequest, res: Response) => {
    try {
        const providerId = req.user?.id;
        if (!providerId) {
            res.status(401).json({ message: 'Provider ID not found in token.' });
            return;
        }

        const skillData: CreateSkillRequest = req.body;
        // Basic validation for skillData (e.g., category, hourlyRate etc.)
        if (!skillData.category || !skillData.experience || !skillData.natureOfWork || !skillData.hourlyRate || !skillData.rateCurrency) {
            res.status(400).json({ message: 'Missing required skill fields.' });
            return;
        }

        const newSkill = await createSkill(providerId, skillData);
        res.status(201).json(newSkill);
    } catch (error) {
        console.error('Create skill error:', error);
        res.status(500).json({ message: 'Server error creating skill', error: (error as Error).message });
    }
};

export const updateSkillHandler = async (req: AuthRequest, res: Response) => {
    try {
        const providerId = req.user?.id;
        const skillId = req.params.id;
        if (!providerId) {
            res.status(401).json({ message: 'Provider ID not found in token.' });
            return;
        }
        if (!skillId) {
            res.status(400).json({ message: 'Skill ID is required.' });
            return;
        }

        const skillData: UpdateSkillRequest = req.body;

        const existingSkill = await findSkillById(skillId);
        if (!existingSkill) {
            res.status(404).json({ message: 'Skill not found.' });
            return;
        }
        if (existingSkill.provider_id !== providerId) {
            res.status(403).json({ message: 'Forbidden, you do not own this skill.' });
            return;
        }

        const updated = await updateSkill(skillId, providerId, skillData);
        if (!updated) {
            res.status(400).json({ message: 'No valid fields to update or skill not found.' });
            return;
        }
        res.json(updated);
    } catch (error) {
        console.error('Update skill error:', error);
        res.status(500).json({ message: 'Server error updating skill', error: (error as Error).message });
    }
};
export const getSkillHandler = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id;
       
        const skills = await findSkillBySkillId(id);
        res.json(skills);
    } catch (error) {
        console.error('Get my skills error:', error);
        res.status(500).json({ message: 'Server error fetching skills', error: (error as Error).message });
    }
};
export const getMySkillsHandler = async (req: AuthRequest, res: Response) => {
    try {
        const providerId = req.user?.id;
        if (!providerId) {
            res.status(401).json({ message: 'Provider ID not found in token.' });
            return;
        }
        const skills = await findSkillsByProviderId(providerId);
        res.json(skills);
    } catch (error) {
        console.error('Get my skills error:', error);
        res.status(500).json({ message: 'Server error fetching skills', error: (error as Error).message });
    }
};
/**
 * @desc A user (provider) deletes one of their specific skill entries.
 * @route DELETE /api/v1/skills/me/:id
 * @access Private (Individual or Company user type)
 */
export const deleteUserSkillHandler = async (req: AuthRequest, res: Response) => {
    try {
        const providerId = req.user?.id; // The authenticated user
        const skillIdToDelete = req.params.id; // The ID of the specific user_skill entry

        if (!providerId) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }

        if (!skillIdToDelete) {
            res.status(400).json({ message: 'Skill ID to delete is required.' });
            return;
        }

        // Call the model function to delete the skill
        const deletedCount = await deleteUserSkill(providerId, skillIdToDelete);

        if (deletedCount === 0) {
            res.status(404).json({ message: 'User skill not found or not authorized to delete.' });
            return;
        }

        res.status(200).json({ message: 'User skill deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user skill:', error);
        res.status(500).json({ message: 'Server error deleting user skill.', error: (error as Error).message });
    }
};