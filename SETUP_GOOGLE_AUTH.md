
# How to Enable Google Login (Requires ~5-10 minutes)

To fix the "Unsupported provider" error, you must enable Google in your Supabase dashboard. This involves getting API keys from Google.

## Step 1: Get Google API Credentials
1. Go to the **[Google Cloud Console](https://console.cloud.google.com/apis/credentials)**.
2. Create a new Project (if you haven't already).
3. Go to **APIs & Services > Credentials**.
4. Click **Create Credentials** -> **OAuth client ID**.
5. If asked to "Configure Consent Screen":
   - Select **External**.
   - Enter an App Name (e.g., "Restaurant Billing").
   - Enter your email for support.
   - Click "Save and Continue" through the rest (you can skip scopes for now).
6. Back in "Create Credentials" -> "OAuth client ID":
   - Application Type: **Web application**.
   - Name: "Supabase Login".
   - **Authorized Redirect URIs**: You need your Supabase Callback URL.
     - Go to Supabase Dashboard > Authentication > Providers > Google to find this (it looks like `https://<your-project>.supabase.co/auth/v1/callback`).
     - Paste that URL into the Google Console under "Authorized redirect URIs".
7. Click **Create**.
8. Copy the **Client ID** and **Client Secret**.

## Step 2: Enable Google in Supabase
1. Go to your **[Supabase Dashboard](https://supabase.com/dashboard/project/_/auth/providers)**.
2. Click **Authentication** on the left -> **Providers**.
3. Select **Google**.
4. Toggle "Enable Google" to **ON**.
5. Paste the **Client ID** and **Client Secret** you copied from Google.
6. Click **Save**.

## Step 3: Test
1. Go back to your website login page.
2. Click "Sign in with Google".
3. It should now show the Google consent popup instead of the JSON error.
