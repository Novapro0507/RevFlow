import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    // Use service role key for admin operations (auto-confirm users)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create user with admin API - this auto-confirms the email
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (createError) {
      // If user already exists, try to update/confirm them
      if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
        // Get existing user by email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === email)
        
        if (existingUser) {
          // Update the user to confirm email and reset password
          const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            {
              email_confirm: true,
              password: password,
              user_metadata: {
                first_name: firstName || existingUser.user_metadata?.first_name,
                last_name: lastName || existingUser.user_metadata?.last_name,
              },
            }
          )
          
          if (updateError) {
            return NextResponse.json(
              { error: 'Could not update account. Please contact support.' },
              { status: 400 }
            )
          }
          
          return NextResponse.json({
            user: updatedUser.user,
            message: 'Account confirmed successfully. You can now log in.',
          })
        }
        
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      user: userData.user,
      message: 'Account created successfully. You can now log in.',
    })
  } catch (err) {
    console.error('[v0] Sign up API error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
