-- backend/src/config/init.sql

-- This file contains the SQL commands to initialize your PostgreSQL database schema.
-- It creates tables, defines enums, sets up primary and foreign keys,
-- and adds indexes for performance.

-- --- DROP EXISTING OBJECTS (FOR A FRESH START) ---
-- Drop objects in reverse order of creation to respect dependencies

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;
DROP TRIGGER IF EXISTS update_skills_updated_at ON skills; -- New trigger for skills table

-- Drop the function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables if they exist (order matters due to foreign keys)
DROP TABLE IF EXISTS task_progress_updates CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS task_skills CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types (enums) if they exist
-- Drop in an order that respects dependencies if any custom types depended on each other
DROP TYPE IF EXISTS user_role_enum;
DROP TYPE IF EXISTS user_type_enum;
DROP TYPE IF EXISTS currency_type;
DROP TYPE IF EXISTS work_nature_type;
DROP TYPE IF EXISTS task_category_type;
DROP TYPE IF EXISTS skill_category_type;
DROP TYPE IF EXISTS task_status_enum; -- New enum
DROP TYPE IF EXISTS offer_status_enum; -- New enum

-- Ensure the UUID extension is enabled (run this once per database)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

---
-- --- Enums ---
-- Define custom types for clearer and safer data representation

-- User Role (Requester/Provider)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('requester', 'provider');
    END IF;
END
$$;

-- User Type (Individual/Company)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
        CREATE TYPE user_type_enum AS ENUM ('individual', 'company');
    END IF;
END
$$;

-- Currency Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_type') THEN
        CREATE TYPE currency_type AS ENUM ('USD', 'AUD', 'SGD', 'INR');
    END IF;
END
$$;

-- Nature of Work (Onsite/Online)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_nature_type') THEN
        CREATE TYPE work_nature_type AS ENUM ('onsite', 'online');
    END IF;
END
$$;

-- Task Category Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_category_type') THEN
        CREATE TYPE task_category_type AS ENUM ('Tutoring', 'Handyman', 'Consulting', 'Web Development', 'Graphic Design');
    END IF;
END
$$;

-- Skill Category Types (can be the same as task categories or more granular)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skill_category_type') THEN
        CREATE TYPE skill_category_type AS ENUM ('Tutoring', 'Handyman', 'Consulting', 'Web Development', 'Graphic Design');
    END IF;
END
$$;

-- Task Status Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
        CREATE TYPE task_status_enum AS ENUM (
            'open',
            'in_progress',
            'completed_pending_review',
            'completed',
            'closed',
            'cancelled'
        );
    END IF;
END
$$;

-- Offer Status Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status_enum') THEN
        CREATE TYPE offer_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
    END IF;
END
$$;

---
-- --- Tables ---

-- 1. Users Table
-- Stores user information, including authentication details and role.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Role on the platform (e.g., 'requester' posts tasks, 'provider' performs them)
    role user_role_enum NOT NULL DEFAULT 'requester',

    -- Type of user (e.g., 'individual' person or 'company')
    user_type user_type_enum NOT NULL DEFAULT 'individual',

    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Storing hashed passwords

    -- Personal details (primarily for individuals)
    first_name VARCHAR(255),
    last_name VARCHAR(255),

    -- Company details (primarily for companies, but a requester might be an individual representing a company)
    company_name VARCHAR(255),
    business_tax_number VARCHAR(100), -- ABN for Australia, EIN for US, etc.

    phone_number VARCHAR(50),

    -- --- NEW ADDRESS FIELDS ---
    street_number VARCHAR(50), -- e.g., '123', 'Unit 5A'
    street_name VARCHAR(255),  -- e.g., 'Main Street', 'High Road'
    city_suburb VARCHAR(255),  -- e.g., 'Melbourne', 'Richmond'
    state VARCHAR(50),         -- e.g., 'VIC', 'NSW' (for Australia) or 'CA', 'NY' (for US)
    post_code VARCHAR(20),     -- e.g., '3000', '90210'
    -- --- END NEW ADDRESS FIELDS ---

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick email lookups during login
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

---

-- 2. Skills Table
-- Stores a list of specific skills a provider offers, linked to their user account.
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Primary key for a specific skill listing
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- The provider offering this skill
    category skill_category_type NOT NULL,
    experience TEXT, -- e.g., "Junior", "Mid", "Senior", or a textual description of experience
    nature_of_work work_nature_type NOT NULL,
    hourly_rate NUMERIC(10,2) NOT NULL,
    rate_currency currency_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup of skills by provider
CREATE INDEX IF NOT EXISTS idx_skills_provider_id ON skills(provider_id);
-- Index for quick lookup of skills by category
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

---

-- 3. Tasks Table
-- Stores details about tasks posted by users.
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- The user (requester) who posted the task
    provider_id UUID REFERENCES users(id), -- The provider who accepted the task (can be NULL initially)
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    category task_category_type NOT NULL,
    expected_start_date DATE NOT NULL,
    expected_working_hours NUMERIC(5,2) NOT NULL,
    hourly_rate_offered NUMERIC(10,2) NOT NULL,
    rate_currency currency_type NOT NULL,
    status task_status_enum DEFAULT 'open', -- Using task_status_enum for strict status control
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient task lookup
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_provider_id ON tasks(provider_id); -- New index for provider lookup
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

---

-- 4. Task Skills Junction Table
-- Connects tasks to specific skills (many-to-many relationship).
-- This indicates which skills are REQUIRED for a task.
CREATE TABLE IF NOT EXISTS task_skills (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, skill_id)
);

-- Indexes for efficient lookup of task_skills
CREATE INDEX IF NOT EXISTS idx_task_skills_task_id ON task_skills(task_id);
CREATE INDEX IF NOT EXISTS idx_task_skills_skill_id ON task_skills(skill_id);

---

-- 5. Offers Table
-- Stores offers made by providers on tasks.
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- The provider making the offer
    offered_hourly_rate NUMERIC(10,2) NOT NULL,
    offered_rate_currency currency_type NOT NULL,
    offer_status offer_status_enum DEFAULT 'pending', -- Using offer_status_enum
    message TEXT, -- Message from provider to task owner
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (task_id, provider_id) -- Ensures a provider can only make one offer per task
);

-- Indexes for efficient offer lookup
CREATE INDEX IF NOT EXISTS idx_offers_task_id ON offers(task_id);
CREATE INDEX IF NOT EXISTS idx_offers_provider_id ON offers(provider_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(offer_status);

---

-- 6. Task Progress Updates Table
-- Stores detailed progress updates provided by the accepted provider for an assigned task.
CREATE TABLE IF NOT EXISTS task_progress_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Who made the update
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- For individual update timestamps
);

-- Index for quick lookup of progress updates by task_id
CREATE INDEX IF NOT EXISTS idx_task_progress_updates_task_id ON task_progress_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_updates_provider_id ON task_progress_updates(provider_id);

---
-- --- Trigger to update 'updated_at' timestamp on changes ---
-- This function will be called by triggers on table updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at
BEFORE UPDATE ON skills
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); -- New trigger for skills table