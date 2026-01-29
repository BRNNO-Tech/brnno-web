-- Extend a customer's trial
-- Run in Supabase: Dashboard → SQL Editor → New query
--
-- 1. Replace customer@example.com with the customer's login email (twice: in UPDATE and SELECT).
-- 2. Replace 14 with how many days to add (e.g. 7, 14, 30).
-- 3. Run the whole script.

-- Extend trial: set status to trialing and push end date forward
UPDATE businesses
SET
  subscription_status = 'trialing',
  subscription_ends_at = GREATEST(
    COALESCE(subscription_ends_at, NOW()),
    NOW()
  ) + INTERVAL '14 days'
WHERE owner_id IN (
  SELECT id FROM auth.users WHERE email = 'customer@example.com'
);

-- Verify (same email as above)
SELECT
  b.id,
  b.name,
  b.subscription_plan,
  b.subscription_status,
  b.subscription_ends_at
FROM businesses b
JOIN auth.users u ON b.owner_id = u.id
WHERE u.email = 'customer@example.com';
