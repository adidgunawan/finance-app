-- Add bank_id column to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES banks(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_bank_id ON accounts(bank_id);

