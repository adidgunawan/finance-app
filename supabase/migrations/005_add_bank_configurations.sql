-- Create bank_configurations table
CREATE TABLE bank_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id)
);

-- Create index for faster lookups
CREATE INDEX idx_bank_configurations_account_id ON bank_configurations(account_id);

-- Add trigger for updated_at
CREATE TRIGGER update_bank_configurations_updated_at BEFORE UPDATE ON bank_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

