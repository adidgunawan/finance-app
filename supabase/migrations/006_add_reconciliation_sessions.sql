-- Create reconciliation_sessions table
CREATE TYPE reconciliation_status AS ENUM ('draft', 'finalized');

CREATE TABLE reconciliation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  csv_data JSONB NOT NULL,
  status reconciliation_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finalized_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX idx_reconciliation_sessions_account_id ON reconciliation_sessions(account_id);
CREATE INDEX idx_reconciliation_sessions_status ON reconciliation_sessions(status);
CREATE INDEX idx_reconciliation_sessions_created_at ON reconciliation_sessions(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_reconciliation_sessions_updated_at BEFORE UPDATE ON reconciliation_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

