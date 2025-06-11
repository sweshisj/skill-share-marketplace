// backend/src/types/index.ts

// --- Enums / Union Types ---
// These directly mirror your PostgreSQL ENUMs for consistency

export enum UserRole {
    Requester = 'requester',
    Provider = 'provider',
}
export enum UserType{
    Individual = 'individual',
    Company = 'company',
} // New type to explicitly define if user is an individual or company

export type Currency = 'USD' | 'AUD' | 'SGD' | 'INR';
export type WorkNature = 'onsite' | 'online';

export type TaskCategory = 'Tutoring' | 'Handyman' | 'Consulting' | 'Web Development' | 'Graphic Design'; // Ensure these match your DB enum
export type SkillCategory = 'Tutoring' | 'Handyman' | 'Consulting' | 'Web Development' | 'Graphic Design'; // Ensure these match your DB enum

export type TaskStatus = 'open' | 'in_progress' | 'completed_pending_review' | 'completed' | 'closed' | 'cancelled'|'rejected'|'assigned'; // Added 'completed' for consistency with DB enum
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'; // Consistent with DB enum


// --- Address Interface ---
export interface Address {
    streetNumber?: string;
    streetName?: string;
    citySuburb?: string;
    state?: string;
    postCode?: string;
}

// --- Database Interfaces (snake_case to match DB columns) ---
// These are for data directly retrieved from or sent to the database.

export interface UserDB {
    id: string;
    role: UserRole; // Corrected: Matches 'role' column in DB
    user_type: UserType; // New: Matches 'user_type' column in DB
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
    user_id: string; // The requester
    provider_id?: string; // NEW: Added to match DB schema, the assigned provider
    category: TaskCategory;
    task_name: string;
    description?: string; // Made optional if it can be empty in DB
    expected_start_date: string; // YYYY-MM-DD
    expected_working_hours: number;
    hourly_rate_offered: number;
    rate_currency: Currency;
    status: TaskStatus; // Using the new TaskStatus type
    created_at: Date;
    updated_at: Date;
}

export interface SkillDB {
    id: string;
    provider_id: string;
    category: SkillCategory;
    experience?: string; // Made optional if it can be empty
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
    offer_status: OfferStatus; // Using the new OfferStatus type
    message?: string;
    created_at: Date;
    updated_at: Date;
}

// Corrected: Renamed from TaskProgressDB/TaskProgress to match 'task_progress_updates' table
export interface TaskProgressUpdateDB {
    id: string;
    task_id: string;
    provider_id: string;
    description: string;
    created_at: Date; // Matches 'created_at' in DB, removed 'progress_timestamp' as it's not in the SQL table
}


// --- API Interfaces (camelCase for frontend consumption) ---
// These are for data transformed for API responses or frontend usage.

export interface User {
    id: string;
    role: UserRole; // Corrected: Maps to 'role' in DB
    userType: UserType; // New: Maps to 'user_type' in DB
    email: string;
    firstName?: string;
    lastName?: string;
    // representativeFirstName?: string; // NEW: For company users, the representative's first name
    // representativeLastName?: string; // NEW: For company users, the representative's last name
    companyName?: string;
    phoneNumber?: string;
    businessTaxNumber?: string;
    address?: Address; // Nested address object for cleaner API
    createdAt: Date;
    updatedAt: Date;
}

export interface Task {
    id: string;
    userId: string;
    providerId?: string; // NEW: For the assigned provider
    category: TaskCategory;
    taskName: string;
    description?: string; // Made optional
    expectedStartDate: string;
    expectedWorkingHours: number;
    hourlyRateOffered: number;
    rateCurrency: Currency;
    status: TaskStatus; // Using the new TaskStatus type
    createdAt: Date;
    updatedAt: Date;
}

export interface Skill {
    id: string;
    providerId: string;
    category: SkillCategory;
    experience?: string; // Made optional
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
    offerStatus: OfferStatus; // Using the new OfferStatus type
    message?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Corrected: Renamed from TaskProgress/TaskProgressUpdate to match 'task_progress_updates' table
export interface TaskProgressUpdate {
    id: string;
    taskId: string;
    providerId: string;
    description: string;
    createdAt: Date; // Matches 'createdAt' in DB, removed 'progressTimestamp'
}
export interface TaskProgressDB {
    id: string;
    task_id: string;
    provider_id: string;
    description: string;
    progress_timestamp: Date;
    created_at: Date;
}
// --- Request DTOs (Data Transfer Objects for incoming API requests) ---

export interface CreateUserRequest {
    role: UserRole;       // Corrected: User must specify their role
    userType: UserType; // New: User must specify if individual or company
    email: string;
    password: string; // Plain password for signup (will be hashed)
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phoneNumber?: string;
    businessTaxNumber?: string;
    // representativeFirstName?: string; // Consider if these are truly separate from first/last_name
    // representativeLastName?: string;  // If a company uses a representative, it might just use firstName/lastName
    address?: Address;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User; // The full User object returned after login
}

export interface CreateTaskRequest {
    category: TaskCategory;
    taskName: string;
    description?: string; // Made optional
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
    // You might also allow updating task status here, e.g., status?: TaskStatus;
}
export interface UpdateTaskProgressRequest {
    description: string;
}
export interface CreateSkillRequest {
    category: SkillCategory;
    experience?: string; // Made optional
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

// Corrected: Named to match the specific progress update table
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

// --- Public Details / Specialized Interfaces ---

// This interface is for displaying limited user/provider details to others.
export interface ProviderPublicDetails {
    id: string;
    role: UserRole; // Corrected: Should be 'role'
    userType: UserType; // New: Add user type
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    // You might want to add other public fields like profilePictureUrl, bio, etc.
}

// For offers that include provider details in the response
export interface OfferWithProvider extends Offer {
    providerDetails?: ProviderPublicDetails;
}