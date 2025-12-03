-- Create banks table
CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_banks_name ON banks(name);

-- Add trigger for updated_at
CREATE TRIGGER update_banks_updated_at BEFORE UPDATE ON banks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial banks
INSERT INTO banks (name) VALUES
  ('BCA'),
  ('Mandiri'),
  ('BNI'),
  ('BRI'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

