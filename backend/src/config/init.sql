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

-- Drop the function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables if they exist (order matters due to foreign keys)
DROP TABLE IF EXISTS task_progress_updates CASCADE; -- CASCADE drops dependent objects (like indexes)
DROP TABLE IF EXISTS task_progress CASCADE; -- CASCADE drops dependent objects (like indexes)
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS task_skills CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- --- Enums ---
-- Define custom types for clearer and safer data representation

CREATE TYPE user_type AS ENUM ('individual', 'company');
CREATE TYPE currency_type AS ENUM ('USD', 'AUD', 'SGD', 'INR');
CREATE TYPE work_nature_type AS ENUM ('onsite', 'online');
CREATE TYPE task_category_type AS ENUM ('Tutoring', 'Handyman', 'Consulting');
CREATE TYPE skill_category_type AS ENUM ('Tutoring', 'Handyman', 'Consulting');
---
-- --- Tables ---

-- 1. Users Table
-- Stores user information, including authentication details and role.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_type user_type NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    company_name VARCHAR(255),
    phone_number VARCHAR(50),
    business_tax_number VARCHAR(100),
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

-- 2. Skills Table
-- Stores a list of available skills that can be associated with tasks or users.

-- 3. User Skills Junction Table
-- Connects users to skills (many-to-many relationship).
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Add a primary key for individual skill entries
    provider_id UUID NOT NULL REFERENCES users(id),
    category skill_category_type NOT NULL,          -- e.g., "Web Development" category within a broader "IT" skill
    experience TEXT,        -- e.g., "Junior", "Mid", "Senior"
    nature_of_work work_nature_type NOT NULL,            -- A description of their work or specialization
    hourly_rate NUMERIC(10,2) NOT NULL,
    rate_currency currency_type NOT NULL, -- Uses your existing 'currency' ENUM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tasks Table
-- Stores details about tasks posted by users.
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- The user who posted the task
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    category task_category_type NOT NULL, -- Assuming 'category' is a string. Consider an ENUM if categories are fixed.
    expected_start_date DATE NOT NULL,
    expected_working_hours NUMERIC(5,2) NOT NULL, -- Assuming hours can be decimal (e.g., 8.5 hours)
    hourly_rate_offered NUMERIC(10,2) NOT NULL,
    rate_currency currency_type NOT NULL, -- Using your existing 'currency' ENUM
    status VARCHAR(50) DEFAULT 'open', -- Current status of the task
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient task lookup
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- 5. Task Skills Junction Table
-- Connects tasks to skills (many-to-many relationship).
CREATE TABLE IF NOT EXISTS task_skills (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, skill_id)
);

-- 6. Offers Table
-- Stores offers made by providers on tasks.
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- The provider making the offer
    offered_hourly_rate NUMERIC(10,2) NOT NULL,
    offered_rate_currency currency_type NOT NULL,
    offer_status VARCHAR(50) DEFAULT 'pending', -- Status of the offer (pending, accepted, rejected, withdrawn)
    message TEXT, -- Message from provider to task owner
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (task_id, provider_id)
);

-- Indexes for efficient offer lookup
CREATE INDEX IF NOT EXISTS idx_offers_task_id ON offers(task_id);
CREATE INDEX IF NOT EXISTS idx_offers_provider_id ON offers(provider_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(offer_status);

CREATE TABLE task_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    provider_id UUID NOT NULL REFERENCES users(id), -- Provider who accepted the task
    description TEXT NOT NULL,
    progress_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 7. Task Progress Updates Table
-- Stores detailed progress updates provided by the accepted provider.
CREATE TABLE IF NOT EXISTS task_progress_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Who made the update
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup of progress updates by task_id
CREATE INDEX IF NOT EXISTS idx_task_progress_updates_task_id ON task_progress_updates(task_id);

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