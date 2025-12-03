-- Create a function to reset match_status when a transaction is deleted
CREATE OR REPLACE FUNCTION reset_match_status_on_transaction_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- When a transaction is deleted, update all reconciliation matches
  -- that reference this transaction to reset their status
  -- This runs BEFORE DELETE so we can still reference OLD.id
  UPDATE bank_transaction_matches
  SET 
    transaction_id = NULL,
    match_status = 'pending'
  WHERE transaction_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires before delete on transactions
-- This ensures we can update matches before the foreign key constraint
-- sets transaction_id to NULL
CREATE TRIGGER reset_match_status_on_transaction_delete_trigger
  BEFORE DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION reset_match_status_on_transaction_delete();

