export type Currency = 'USD' | 'AUD' | 'SGD' | 'INR';
export type WorkNature = 'onsite' | 'online';
export type TaskCategory = 'Tutoring' | 'Handyman' | 'Consulting'; // Example categories
export type SkillCategory = 'Tutoring' | 'Handyman' | 'Consulting'; // Example categories

// Renamed UserType to UserType for clarity on what it represents
export enum UserType {
    Individual = 'individual',
    Company = 'company',
}

export enum UserRole {
    Requester = 'requester',
    Provider = 'provider',
}

export type TaskStatus = 'open' | 'in_progress' | 'completed_pending_review' | 'completed' | 'closed' | 'cancelled'|'rejected'|'assigned'; // Added 'completed' for consistency with DB enum


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
    role: UserRole;       // Maps to 'role' in DB
    userType: UserType; // Corrected: Maps to 'user_type' in DB
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phoneNumber?: string;
    businessTaxNumber?: string;
    address?: Address;    // Nested address object for cleaner API
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
    status: TaskStatus;
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

export interface CreateUserRequest {
    role: UserRole;       // Mandatory: User must have a role
    userType: UserType; // Corrected: Use UserType for individual/company
    email: string;
    password: string;     // Plain password for signup (will be hashed)
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phoneNumber?: string;
    businessTaxNumber?: string;
    // representativeFirstName and representativeLastName are removed as firstName/lastName serve this purpose for companies
    address?: Address;    // Address is optional in DTO, but may be enforced by business logic in controllers
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User; // The full User object after successful authentication
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
    status?: string; // Task status can be updated
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
    message?: string; // Optional message with the offer
}

export interface CreateTaskProgressRequest {
    description: string;
}

export interface UpdateTaskProgressRequest { // This interface was previously defined, but seems to only contain `description`
    description: string;
}


export interface ProviderPublicDetails {
    id: string;
    userType: UserType; // Corrected: Use UserType
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    // Phone number, tax number, etc., are usually not public
}

export interface OfferWithProvider extends Offer {
    providerDetails?: ProviderPublicDetails; // Includes public details of the provider who made the offer
}

export interface TaskProgressUpdate {
    id: string;
    taskId: string;
    providerId: string;
    description: string;
    createdAt: Date;
}