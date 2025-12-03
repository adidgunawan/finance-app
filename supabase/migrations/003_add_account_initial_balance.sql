-- Add initial balance fields to accounts table
ALTER TABLE accounts 
ADD COLUMN initial_balance DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN initial_balance_date DATE;

-- Create index for initial balance date queries
CREATE INDEX idx_accounts_initial_balance_date ON accounts(initial_balance_date);


