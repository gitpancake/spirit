-- =============================================
-- GENESIS REGISTRY UPDATE SQL - FIXED VERSION
-- Run this to add new fields for Genesis Registry form
-- Split into separate steps to avoid column reference errors
-- =============================================

-- STEP 1: Add new columns for Genesis Registry form fields
ALTER TABLE agent_applications 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS handle TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS public_persona TEXT,
ADD COLUMN IF NOT EXISTS system_instructions TEXT,
ADD COLUMN IF NOT EXISTS memory_context TEXT,
ADD COLUMN IF NOT EXISTS schedule TEXT,
ADD COLUMN IF NOT EXISTS medium TEXT,
ADD COLUMN IF NOT EXISTS daily_goal TEXT,
ADD COLUMN IF NOT EXISTS practice_actions TEXT[],
ADD COLUMN IF NOT EXISTS technical_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_revenue JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lore_origin JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS additional_fields JSONB DEFAULT '{}';

-- STEP 2: Add constraints (run after columns are created)
ALTER TABLE agent_applications 
DROP CONSTRAINT IF EXISTS check_role_values;

ALTER TABLE agent_applications 
ADD CONSTRAINT check_role_values 
CHECK (role IS NULL OR role IN ('Creator', 'Curator', 'Researcher', 'Educator', 'Community Organizer', 'Prediction Maker', 'Governance'));

ALTER TABLE agent_applications 
DROP CONSTRAINT IF EXISTS check_schedule_values;

ALTER TABLE agent_applications 
ADD CONSTRAINT check_schedule_values 
CHECK (schedule IS NULL OR schedule IN ('Hourly', 'Daily', 'Weekly'));

-- STEP 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_applications_handle ON agent_applications(handle);
CREATE INDEX IF NOT EXISTS idx_agent_applications_role ON agent_applications(role);

-- STEP 4: Data migration (run after all columns exist)
-- Map old agent_name to name if name is null
UPDATE agent_applications 
SET name = agent_name 
WHERE name IS NULL AND agent_name IS NOT NULL;

-- Map old description to public_persona if public_persona is null
UPDATE agent_applications 
SET public_persona = description 
WHERE public_persona IS NULL AND description IS NOT NULL;

-- Map old instructions to system_instructions if system_instructions is null
UPDATE agent_applications 
SET system_instructions = instructions 
WHERE system_instructions IS NULL AND instructions IS NOT NULL;

-- STEP 5: Verify the update
SELECT 
    'Schema update complete! Table now supports Genesis Registry fields.' as status,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as with_name,
    COUNT(CASE WHEN handle IS NOT NULL THEN 1 END) as with_handle,
    COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as with_role
FROM agent_applications;