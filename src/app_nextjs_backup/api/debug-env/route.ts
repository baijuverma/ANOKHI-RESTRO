
import { NextResponse } from 'next/server';

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if the file exists (using fs) just to be sure
    // Note: This only works in Node runtime, not Edge.
    // We'll rely on process.env first.

    return NextResponse.json({
        server_url_configured: !!url,
        server_key_configured: !!key,
        url_preview: url ? `${url.substring(0, 5)}...` : 'missing',
        node_env: process.env.NODE_ENV
    });
}
