-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-attachments', 'transaction-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on attachments table
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Policy for attachments table: Allow fully permissive access to authenticated users
CREATE POLICY "Allow authenticated users full access to attachments"
ON attachments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for storage.objects: Allow uploads to 'transaction-attachments'
CREATE POLICY "Allow authenticated uploads to transaction-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'transaction-attachments');

-- Policy for storage.objects: Allow reads from 'transaction-attachments'
CREATE POLICY "Allow authenticated reads from transaction-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'transaction-attachments');

-- Policy for storage.objects: Allow deletes from 'transaction-attachments'
CREATE POLICY "Allow authenticated deletes from transaction-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'transaction-attachments');
