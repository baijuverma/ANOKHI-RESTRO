
# How to Fix "Email Rate Limit Exceeded"

Supabase has a strict limit on how many emails can be sent per hour to prevent spam. Since you are testing, you have likely hit this limit.

## Solution 1: Wait
The limit usually resets after **1 hour**.

## Solution 2: Disable Email Confirmation (Recommended for Dev)
1. Go to **Supabase Dashboard** > **Authentication** > **Providers** > **Email**.
2. **UNCHECK** "Confirm email".
3. Click **Save**.
4. Now you can sign up smoothly without waiting for emails.

## Solution 3: Increase Rate Limits (If disabling confirmation doesn't help)
1. Go to **Supabase Dashboard** > **Authentication** > **Rate Limits**.
2. Increase "Email Rate Limit" (e.g., to 30 per hour).
3. Click **Save**.

## What to do RIGHT NOW?
If you are just trying to log in:
1. Use the account you **already created** (if you remember the email/password).
2. Or use a fake email like `test1@example.com` (if you disabled "Confirm email" in Step 2 above).
