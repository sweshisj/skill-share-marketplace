export enum UserRole {
    Requester = 'requester',
    Provider = 'provider',
}
export enum UserType{
    Individual = 'individual',
    Company = 'company',
} 

export type Currency = 'USD' | 'AUD' | 'SGD' | 'INR';
export type WorkNature = 'onsite' | 'online';

export type TaskCategory = 'Tutoring' | 'Handyman' | 'Consulting' | 'Web Development' | 'Graphic Design'; 
export type SkillCategory = 'Tutoring' | 'Handyman' | 'Consulting' | 'Web Development' | 'Graphic Design'; 

export type TaskStatus = 'open' | 'in_progress' | 'completed_pending_review' | 'completed' | 'closed' | 'cancelled'|'rejected'|'assigned'; 
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'; 

export interface Address {
    streetNumber?: string;
    streetName?: string;
    citySuburb?: string;
    state?: string;
    postCode?: string;
}

export interface UserDB {
    id: string;
    role: UserRole; 
    user_type: UserType; 
    email: string;
    password_hash: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    business_tax_number?: string;
    street_number?: string;
    street_name?: string;
    city_suburb?: string;
    state?: string;
    post_code?: string;
    created_at: Date;
    updated_at: Date;
}

export interface TaskDB {
    id: string;
    user_id: string; 
    provider_id?: string; 
    category: TaskCategory;
    task_name: string;
    description?: string; 
    expected_start_date: string; // YYYY-MM-DD
    expected_working_hours: number;
    hourly_rate_offered: number;
    rate_currency: Currency;
    status: TaskStatus; 
    created_at: Date;
    updated_at: Date;
}

export interface SkillDB {
    id: string;
    provider_id: string;
    category: SkillCategory;
    experience?: string; 
    nature_of_work: WorkNature;
    hourly_rate: number;
    rate_currency: Currency;
    created_at: Date;
    updated_at: Date;
}

export interface OfferDB {
    id: string;
    task_id: string;
    provider_id: string;
    offered_hourly_rate: number;
    offered_rate_currency: Currency;
    offer_status: OfferStatus; 
    message?: string;
    created_at: Date;
    updated_at: Date;
}

export interface TaskProgressUpdateDB {
    id: string;
    task_id: string;
    provider_id: string;
    description: string;
    created_at: Date; 
}


export interface User {
    id: string;
    role: UserRole; 
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
    providerId?: string; 
    category: TaskCategory;
    taskName: string;
    description?: string; 
    expectedStartDate: string;
    expectedWorkingHours: number;
    hourlyRateOffered: number;
    rateCurrency: Currency;
    status: TaskStatus; 
    createdAt: Date;
    updatedAt: Date;
}

export interface Skill {
    id: string;
    providerId: string;
    category: SkillCategory;
    experience?: string; 
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
    offerStatus: OfferStatus; 
    message?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskProgressUpdate {
    id: string;
    taskId: string;
    providerId: string;
    description: string;
    createdAt: Date; 
}
export interface TaskProgressDB {
    id: string;
    task_id: string;
    provider_id: string;
    description: string;
    progress_timestamp: Date;
    created_at: Date;
}

export interface CreateUserRequest {
    role: UserRole;       
    userType: UserType;
    email: string;
    password: string; 
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phoneNumber?: string;
    businessTaxNumber?: string;
    address?: Address;
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
    description?: string; 
    expectedStartDate: string; // YYYY-MM-DD
    expectedWorkingHours: number;
    hourlyRateOffered: number;
    rateCurrency: Currency;
}

export interface UpdateTaskRequest {
    category?: TaskCategory;
    taskName?: string;
    description?: string;
    expectedStartDate?: string;
    expectedWorkingHours?: number;
    hourlyRateOffered?: number;
    rateCurrency?: Currency;
}
export interface UpdateTaskProgressRequest {
    description: string;
}
export interface CreateSkillRequest {
    category: SkillCategory;
    experience?: string; 
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
    message?: string;
}

export interface CreateTaskProgressRequest {
    description: string;
}
export interface TaskProgress {
    id: string;
    taskId: string;
    providerId: string;
    description: string;
    progressTimestamp: Date;
    createdAt: Date;
}

export interface ProviderPublicDetails {
    id: string;
    role: UserRole; 
    userType: UserType; 
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
}

export interface OfferWithProvider extends Offer {
    providerDetails?: ProviderPublicDetails;
}