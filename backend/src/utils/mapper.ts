// backend/src/utils/mapper.ts

import {
    UserDB, User, Address, TaskDB, Task, SkillDB, Skill, OfferDB, Offer, TaskProgressDB, TaskProgress, TaskProgressUpdateDB, TaskProgressUpdate
} from '../types';

// Helper function to map address fields
const mapAddress = (row: any): Address | undefined => {
    if (row.street_number || row.street_name || row.city_suburb || row.state || row.post_code) {
        return {
            streetNumber: row.street_number,
            streetName: row.street_name,
            citySuburb: row.city_suburb,
            state: row.state,
            postCode: row.post_code,
        };
    }
    return undefined;
};

export const mapUserDBToUser = (userDB: UserDB): User => {
    const user: User = {
        id: userDB.id,
        userType: userDB.user_type,
        email: userDB.email,
        phoneNumber: userDB.phone_number || undefined,
        createdAt: userDB.created_at,
        updatedAt: userDB.updated_at,
    };

    if (userDB.user_type === 'individual') {
        user.firstName = userDB.first_name || undefined;
        user.lastName = userDB.last_name || undefined;
        user.address = mapAddress(userDB);
    } else { // company
        user.companyName = userDB.company_name || undefined;
        user.phoneNumber = userDB.phone_number || undefined;
        user.businessTaxNumber = userDB.business_tax_number || undefined;
        user.firstName = userDB.first_name || undefined; // Representative first name
        user.lastName = userDB.last_name || undefined;   // Representative last name
        user.address = mapAddress(userDB); // Optional for company
    }
    return user;
};

export const mapTaskDBToTask = (taskDB: TaskDB): Task => {
    return {
        id: taskDB.id,
        userId: taskDB.user_id,
        category: taskDB.category,
        taskName: taskDB.task_name,
        description: taskDB.description,
        expectedStartDate: taskDB.expected_start_date,
        expectedWorkingHours: parseFloat(taskDB.expected_working_hours.toString()), // Convert numeric to float
        hourlyRateOffered: parseFloat(taskDB.hourly_rate_offered.toString()),
        rateCurrency: taskDB.rate_currency,
        status: taskDB.status,
        createdAt: taskDB.created_at,
        updatedAt: taskDB.updated_at,
    };
};

export const mapSkillDBToSkill = (skillDB: SkillDB): Skill => {
    return {
        id: skillDB.id,
        providerId: skillDB.provider_id,
        category: skillDB.category,
        experience: skillDB.experience,
        natureOfWork: skillDB.nature_of_work,
        hourlyRate: parseFloat(skillDB.hourly_rate.toString()),
        rateCurrency: skillDB.rate_currency,
        createdAt: skillDB.created_at,
        updatedAt: skillDB.updated_at,
    };
};

export const mapOfferDBToOffer = (offerDB: OfferDB): Offer => {
    if (!offerDB.id) console.error('Mapper received offerDB with missing ID:', offerDB);
    return {
        id: offerDB.id,
        taskId: offerDB.task_id,
        providerId: offerDB.provider_id,
        offeredHourlyRate: offerDB.offered_hourly_rate,
        offeredRateCurrency: offerDB.offered_rate_currency,
        offerStatus: offerDB.offer_status,
        message: offerDB.message || undefined,
        createdAt: offerDB.created_at,
        updatedAt: offerDB.updated_at,
    };
};

export const mapTaskProgressUpdateDBToTaskProgressUpdate = (progressDB: TaskProgressUpdateDB): TaskProgressUpdate => {
    return {
        id: progressDB.id,
        taskId: progressDB.task_id,
        providerId: progressDB.provider_id,
        description: progressDB.description,
        createdAt: progressDB.created_at,
    };
};
export const mapTaskProgressDBToTaskProgress = (tpDB: TaskProgressDB): TaskProgress => {
    return {
        id: tpDB.id,
        taskId: tpDB.task_id,
        providerId: tpDB.provider_id,
        description: tpDB.description,
        progressTimestamp: tpDB.progress_timestamp,
        createdAt: tpDB.created_at,
    };
};