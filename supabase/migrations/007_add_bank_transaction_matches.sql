-- Create bank_transaction_matches table
CREATE TYPE match_status AS ENUM ('matched', 'new', 'pending');

CREATE TABLE bank_transaction_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconciliation_session_id UUID NOT NULL REFERENCES reconciliation_sessions(id) ON DELETE CASCADE,
  csv_row_index INTEGER NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  match_status match_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reconciliation_session_id, csv_row_index)
);

-- Create indexes for better query performance
CREATE INDEX idx_bank_transaction_matches_session_id ON bank_transaction_matches(reconciliation_session_id);
CREATE INDEX idx_bank_transaction_matches_transaction_id ON bank_transaction_matches(transaction_id);
CREATE INDEX idx_bank_transaction_matches_status ON bank_transaction_matches(match_status);


