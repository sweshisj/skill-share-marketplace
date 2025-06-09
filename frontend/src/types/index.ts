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

// User interface for API responses (camelCase)
export interface User {
    id: string;
    userType: UserType;
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phoneNumber?: string;
    businessTaxNumber?: string;
    address?: Address;
    createdAt: Date;
    updatedAt: Date;
}


export interface Task {
    id: string;
    userId: string;
    category: TaskCategory;
    providerId?: string; 
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

export interface Offer {
    id: string;
    taskId: string;
    providerId: string;
    offeredHourlyRate: number;
    offeredRateCurrency: Currency;
    offerStatus: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    message?: string;
    createdAt: Date;
    updatedAt: Date;
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
export interface ProviderPublicDetails {
    id: string;
    userType: UserType;
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
}
export interface OfferWithProvider extends Offer {
    providerDetails?: ProviderPublicDetails; 
}

export interface TaskProgressUpdate {
    id: string;
    taskId: string;
    providerId: string;
    description: string;
    createdAt: Date; 
}
