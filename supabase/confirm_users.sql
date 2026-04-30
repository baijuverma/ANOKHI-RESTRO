
-- Confirm all existing users immediately
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
