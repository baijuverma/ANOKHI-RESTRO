
# Restaurant Billing Tool Deployment Guide

## 1. Prerequisites
- Node.js 18+ installed
- Supabase Account
- Cloudflare Account
- Meta Business Account (for WhatsApp Cloud API)

## 2. Supabase Setup

1. **Create a new project** in Supabase.
2. **Database Schema**:
   - Go to `SQL Editor` in Supabase Dashboard.
   - Copy the contents of `supabase/schema.sql`.
   - Run the SQL to create tables, RLS policies, and storage bucket.
3. **Authentication**:
   - Go to `Authentication` -> `Providers`.
   - Enable `Email` and `Google` (if needed).
   - For Google, configure Client ID and Secret from Google Cloud Console.
4. **Storage**:
   - The SQL script should have created a public bucket named `bills`.
   - Verify in `Storage` tab.
5. **Edge Functions**:
   - Install Supabase CLI locally: `npm install -g supabase`.
   - Login: `supabase login`.
   - Link project: `supabase link --project-ref your-project-ref`.
   - Deploy function: `supabase functions deploy send-whatsapp --no-verify-jwt`.
   - Set Secrets:
     ```bash
     supabase secrets set WHATSAPP_ACCESS_TOKEN=your_token WHATSAPP_PHONE_NUMBER_ID=your_id
     ```

## 3. WhatsApp Cloud API Setup

1. Create an App in Meta Developers Portal.
2. Add "WhatsApp" product.
3. Get a permanent Access Token (System User) or use temporary for testing.
4. Get Phone Number ID.
5. **Important**: Create a Message Template named `bill_notification` with a "Document" header and three body parameters: {{1}} Customer Name, {{2}} Restaurant Name, {{3}} Total Amount.
   - If you skip this, standard text messages might fail outside the 24h window, but direct messages work for testing. The provided code assumes a template structure.

## 4. Local Development

1. Copy `.env.example` to `.env.local`.
2. Fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Run `npm install` (if not done).
4. Run `npm run dev`.

## 5. Cloudflare Pages Deployment

1. Push code to GitHub/GitLab.
2. Log in to Cloudflare Dashboard -> Workers & Pages.
3. Create Application -> Connect to Git.
4. Select the repository.
5. Build Settings:
   - Framework: `Next.js`
   - Build Command: `npx @cloudflare/next-on-pages@1` (or `npm run build` if using Nodejs compatibility)
   - Output Directory: `.vercel/output/static` or `.next` depending on adapter.
   - **Recommended**: Use standard Vercel deployment for easiest Next.js support, or use `opennextjs-cloudflare` for Cloudflare.
   - *Standard Next.js build*: `npm run build` -> Output `.next`.
6. Environment Variables:
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Cloudflare Pages settings.

## 6. Project Structure

- `src/app`: Next.js App Router pages (Dashboard, Login, API).
- `src/components`: UI components (Shadcn UI based), POS interface, Charts.
- `src/lib`: Utilities, Supabase Clients.
- `src/store`: Zustand state management (Cart).
- `supabase`: Logical configuration for backend.

## 7. Features Checklist

- [x] Auth (Email/Google)
- [x] Dashboard (Sales, Orders)
- [x] POS (Billing, Cart, Search)
- [x] Thermal Printing (80mm/58mm)
- [x] WhatsApp Integration (PDF send)
- [x] Item Management
- [x] Report Aggregation (Daily)
- [x] Multi-tenant (RLS)

Happy Billing!
