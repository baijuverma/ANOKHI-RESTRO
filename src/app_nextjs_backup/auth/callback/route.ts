
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const { searchParams, origin } = requestUrl

    // Check for errors from the provider
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')
    if (error) {
        console.error('Auth Error:', error, error_description)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error)}`)
    }

    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        // In dev (http), we must ensure secure is false, otherwise cookies are rejected
                        const isDev = process.env.NODE_ENV === 'development'
                        cookieStore.set({
                            name,
                            value,
                            ...options,
                            secure: isDev ? false : options.secure,
                        })
                    } catch (error) {
                        console.error('Cookie set error', error)
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        const isDev = process.env.NODE_ENV === 'development'
                        cookieStore.set({
                            name,
                            value: '',
                            ...options,
                            secure: isDev ? false : options.secure,
                        })
                    } catch (error) {
                        console.error('Cookie remove error', error)
                    }
                },
            },
        }
    )

    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error('Verify OTP Error:', error)
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
        }
    }

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error('Exchange Code Error:', error)
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
        }
    }

    // Return to login with generic error if no code/hash
    return NextResponse.redirect(`${origin}/login?error=Invalid%20Link`)
}
