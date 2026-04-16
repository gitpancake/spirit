-- =============================================
-- FIX LEGACY FIELD CONSTRAINTS
-- Make legacy fields nullable to support Genesis Registry
-- =============================================

-- Make legacy fields nullable
ALTER TABLE agent_applications 
ALTER COLUMN agent_name DROP NOT NULL,
ALTER COLUMN description DROP NOT NULL,
ALTER COLUMN instructions DROP NOT NULL,
ALTER COLUMN launch_date DROP NOT NULL,
ALTER COLUMN artist DROP NOT NULL,
ALTER COLUMN profile_picture DROP NOT NULL;

-- Ensure Genesis Registry fields exist (if not already added)
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

-- Add constraints for Genesis Registry fields
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_applications_handle ON agent_applications(handle);
CREATE INDEX IF NOT EXISTS idx_agent_applications_role ON agent_applications(role);

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agent_applications' 
AND column_name IN ('agent_name', 'description', 'instructions', 'launch_date', 'artist', 'profile_picture', 'name', 'handle', 'role', 'public_persona')
ORDER BY column_name;