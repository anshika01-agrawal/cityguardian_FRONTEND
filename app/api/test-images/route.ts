import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Complaint from '@/models/Complaint';
import User from '@/models/User';

export async function POST() {
  try {
    console.log('🧪 Testing database with image data...');
    
    await dbConnect();
    
    // Create a test user if doesn't exist
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123',
        mobile: '9999999999',
        role: 'citizen'
      });
      console.log('✅ Test user created');
    }

    // Create a test complaint with sample images
    const testComplaint = await Complaint.create({
      title: 'Test Complaint with Images',
      type: 'pothole',
      description: 'This is a test complaint to verify image upload functionality.',
      location: {
        address: 'Test Street, Test City',
        coordinates: [77.2090, 28.6139] // Delhi coordinates
      },
      priority: 'medium',
      contact: {
        mobile: '9999999999',
        email: 'test@example.com'
      },
      author: testUser._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800',
          publicId: 'test_image_1'
        },
        {
          url: 'https://images.unsplash.com/photo-1558618666-fbd2c1d0d802?w=800',
          publicId: 'test_image_2'
        }
      ]
    });

    console.log('✅ Test complaint with images created:', testComplaint._id);

    // Fetch the complaint with images to verify
    const savedComplaint = await Complaint.findById(testComplaint._id)
      .populate('author', 'name email')
      .exec();

    console.log('📊 Complaint Details:');
    console.log(`   ID: ${savedComplaint!._id}`);
    console.log(`   Title: ${savedComplaint!.title}`);
    console.log(`   Type: ${savedComplaint!.type}`);
    console.log(`   Images: ${savedComplaint!.images.length} uploaded`);
    
    savedComplaint!.images.forEach((img, index) => {
      console.log(`   Image ${index + 1}: ${img.url}`);
      console.log(`   Public ID: ${img.publicId}`);
    });

    // Get total counts
    const totalComplaints = await Complaint.countDocuments();
    const totalUsers = await User.countDocuments();

    return NextResponse.json({
      success: true,
      message: 'Image upload test completed successfully',
      data: {
        testComplaint: {
          id: savedComplaint!._id,
          title: savedComplaint!.title,
          type: savedComplaint!.type,
          imageCount: savedComplaint!.images.length,
          images: savedComplaint!.images,
          author: savedComplaint!.author
        },
        statistics: {
          totalComplaints,
          totalUsers
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Image upload test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Failed to test image upload functionality'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    
    // Get all complaints with images
    const complaintsWithImages = await Complaint.find({ 
      images: { $exists: true, $not: { $size: 0 } } 
    })
    .populate('author', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

    console.log(`📸 Found ${complaintsWithImages.length} complaints with images`);
    
    complaintsWithImages.forEach((complaint, index) => {
      console.log(`${index + 1}. ${complaint.title} - ${complaint.images.length} images`);
    });

    return NextResponse.json({
      success: true,
      complaintsWithImages: complaintsWithImages.map(complaint => ({
        id: complaint._id,
        title: complaint.title,
        type: complaint.type,
        imageCount: complaint.images.length,
        images: complaint.images,
        author: complaint.author,
        createdAt: complaint.createdAt
      }))
    });

  } catch (error: any) {
    console.error('❌ Failed to fetch complaints with images:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}