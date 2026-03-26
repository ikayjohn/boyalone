DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'signups'
      AND column_name = 'referral_source'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'signups'
      AND column_name = 'body_art_preference'
  ) THEN
    EXECUTE 'ALTER TABLE signups ADD COLUMN body_art_preference VARCHAR(50)';
    EXECUTE '
      UPDATE signups
      SET body_art_preference = referral_source
      WHERE body_art_preference IS NULL
        AND referral_source IS NOT NULL
    ';
  END IF;
END $$;
