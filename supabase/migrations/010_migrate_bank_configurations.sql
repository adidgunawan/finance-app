-- Migrate existing bank_configurations data to accounts.bank_id
DO $$
DECLARE
  config_record RECORD;
  bank_id_val UUID;
BEGIN
  -- Loop through all bank_configurations
  FOR config_record IN 
    SELECT account_id, bank_name 
    FROM bank_configurations
  LOOP
    -- Find or create bank by name
    SELECT id INTO bank_id_val
    FROM banks
    WHERE name = config_record.bank_name
    LIMIT 1;
    
    -- If bank doesn't exist, create it
    IF bank_id_val IS NULL THEN
      INSERT INTO banks (name)
      VALUES (config_record.bank_name)
      RETURNING id INTO bank_id_val;
    END IF;
    
    -- Update account with bank_id
    UPDATE accounts
    SET bank_id = bank_id_val
    WHERE id = config_record.account_id;
  END LOOP;
END $$;

