
# Restaurant Billing Tool

A comprehensive restaurant billing application built with Next.js, Supabase, and Cloudflare.

## Features

- **POS System**: Fast billing, cart management, search.
- **Thermal Printing**: Supports 80mm and 58mm receipts.
- **WhatsApp Integration**: Automatically send bills PDF to customers.
- **Admin Dashboard**: Manage items, settings, and view reports.
- **Multi-tenant**: Secure data isolation for each restaurant.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Setup Environment Variables:
   - Copy `.env.example` to `.env.local` and fill in Supabase credentials.
3. Run Database Migration:
   - Copy SQL from `supabase/schema.sql` and run in Supabase SQL Editor.
4. Start Development Server:
   ```bash
   npm run dev
   ```

## Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full setup instructions including WhatsApp API and Cloudflare deployment.
