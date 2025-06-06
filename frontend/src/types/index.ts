// backend/src/types/index.ts

export type UserType = 'individual' | 'company';
export type Currency = 'USD' | 'AUD' | 'SGD' | 'INR';
export type WorkNature = 'onsite' | 'online';
export type TaskCategory = 'Tutoring' | 'Handyman' | 'Consulting'; // Example categories
export type SkillCategory = 'Tutoring' | 'Handyman' | 'Consulting'; // Example categories

export interface Address {
    streetNumber?: string;
    streetName?: string;
    citySuburb?: string;
    state?: string;
    postCode?: string;
}

// Base interface for database rows (camelCase for TS, snake_case for DB)
export interface UserDB {
    id: string;
    user_type: UserType;
    email: string;
    password_hash: string;
    mobile_number?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    phone_number?: string;
    business_tax_number?: string;
    street_number?: string;
    street_name?: string;
    city_suburb?: string;
    state?: string;
    post_code?: string;
    created_at: Date;
    updated_at: Date;
}

// User interface for API responses (camelCase)
export interface User {
    id: string;
    userType: UserType;
    email: string;
    mobileNumber?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phoneNumber?: string;
    businessTaxNumber?: string;
    address?: Address;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskDB {
    id: string;
    user_id: string;
    category: TaskCategory;
    task_name: string;
    description: string;
    expected_start_date: string; // YYYY-MM-DD
    expected_working_hours: number;
    hourly_rate_offered: number;
    rate_currency: Currency;
    status: 'open' | 'in_progress' | 'completed_pending_review' | 'closed' | 'cancelled';
    created_at: Date;
    updated_at: Date;
}

export interface Task {
    id: string;
    userId: string;
    category: TaskCategory;
    taskName: string;
    description: string;
    expectedStartDate: string;
    expectedWorkingHours: number;
    hourlyRateOffered: number;
    rateCurrency: Currency;
    status: 'open' | 'in_progress' | 'completed_pending_review' | 'closed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}


export interface SkillDB {
    id: string;
    provider_id: string;
    category: SkillCategory;
    experience: string;
    nature_of_work: WorkNature;
    hourly_rate: number;
    rate_currency: Currency;
    created_at: Date;
    updated_at: Date;
}

export interface Skill {
    id: string;
    providerId: string;
    category: SkillCategory;
    experience: string;
    natureOfWork: WorkNature;
    hourlyRate: number;
    rateCurrency: Currency;
    createdAt: Date;
    updatedAt: Date;
}

export interface OfferDB {
    id: string;
    task_id: string;
    provider_id: string;
    offered_hourly_rate: number;
    offered_rate_currency: Currency;
    offer_status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    created_at: Date;
    updated_at: Date;
}

export interface Offer {
    id: string;
    taskId: string;
    providerId: string;
    offeredHourlyRate: number;
    offeredRateCurrency: Currency;
    offerStatus: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskProgressDB {
    id: string;
    task_id: string;
    provider_id: string;
    description: string;
    progress_timestamp: Date;
    created_at: Date;
}

export interface TaskProgress {
    id: string;
    taskId: string;
    providerId: string;
    description: string;
    progressTimestamp: Date;
    createdAt: Date;
}


// Request DTOs (Data Transfer Objects)
export interface CreateUserRequest {
    userType: UserType;
    email: string;
    password: string; // Plain password for signup (will be hashed)
    mobileNumber?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phoneNumber?: string;
    businessTaxNumber?: string;
    representativeFirstName?: string; // For company
    representativeLastName?: string; // For company
    address?: Address; // Optional for company, mandatory for individual provider
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface CreateTaskRequest {
    category: TaskCategory;
    taskName: string;
    description: string;
    expectedStartDate: string; // YYYY-MM-DD
    expectedWorkingHours: number;
    hourlyRateOffered: number;
    rateCurrency: Currency;
}

export interface UpdateTaskRequest {
    category?: TaskCategory;
    taskName?: string;
    description?: string;
    expectedStartDate?: string; // YYYY-MM-DD
    expectedWorkingHours?: number;
    hourlyRateOffered?: number;
    rateCurrency?: Currency;
    status?: string;
}

export interface CreateSkillRequest {
    category: SkillCategory;
    experience: string;
    natureOfWork: WorkNature;
    hourlyRate: number;
    rateCurrency: Currency;
}

export interface UpdateSkillRequest {
    category?: SkillCategory;
    experience?: string;
    natureOfWork?: WorkNature;
    hourlyRate?: number;
    rateCurrency?: Currency;
}

export interface MakeOfferRequest {
    offeredHourlyRate: number;
    offeredRateCurrency: Currency;
}

export interface UpdateTaskProgressRequest {
    description: string;
}