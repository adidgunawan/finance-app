-- Add is_wallet field to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_wallet BOOLEAN DEFAULT false;

-- Mark cash and bank accounts as wallet accounts (1010-1040)
UPDATE accounts 
SET is_wallet = true 
WHERE account_number IN (1010, 1020, 1030, 1040);

-- Mark credit card accounts as wallet accounts (2010-2020)
UPDATE accounts 
SET is_wallet = true 
WHERE account_number IN (2010, 2020);

