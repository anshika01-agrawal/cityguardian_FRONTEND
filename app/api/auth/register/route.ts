import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/dbConnect'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, address, city, role } = await request.json()

    // Validate required fields
    if (!name || !email || !password || !phone || !address || !city) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['citizen', 'employee', 'admin']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      role: role || 'citizen',
      isActive: true,
      joinedAt: new Date()
    })

    await user.save()

    console.log(`✅ New user registered: ${email} (${role || 'citizen'})`)

    // Return success without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      role: user.role,
      joinedAt: user.joinedAt
    }

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: userResponse
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle duplicate key error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    )
  }
}