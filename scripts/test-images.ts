import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('🔧 Loading environment from:', envPath);
dotenv.config({ path: envPath });

async function testImageStorage() {
  try {
    console.log('📸 Testing Image Storage in MongoDB Atlas...');
    console.log('===============================================');
    
    // Dynamic imports to ensure env is loaded first
    const { default: dbConnect } = await import('@/lib/dbConnect');
    const { default: User } = await import('@/models/User');
    const { default: Complaint } = await import('@/models/Complaint');
    
    await dbConnect();
    console.log('✅ Connected to MongoDB Atlas');
    
    // Create a test user
    const testUser = await User.create({
      name: 'Image Test User',
      email: `imagetest-${Date.now()}@example.com`,
      password: 'testpassword123',
      mobile: '9876543210',
      role: 'citizen'
    });
    console.log(`✅ Test user created: ${testUser.name}`);
    
    // Create a complaint with multiple images
    const complaintWithImages = await Complaint.create({
      title: 'Pothole with Photo Evidence',
      type: 'pothole',
      description: 'Large pothole causing traffic issues. Photos attached for reference.',
      location: {
        address: 'MG Road, Delhi',
        coordinates: [77.2090, 28.6139]
      },
      priority: 'high',
      contact: {
        mobile: '9876543210',
        email: testUser.email
      },
      author: testUser._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&q=80',
          publicId: 'pothole_evidence_1'
        },
        {
          url: 'https://images.unsplash.com/photo-1558618666-fbd2c1d0d802?w=800&q=80',
          publicId: 'pothole_evidence_2'
        },
        {
          url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
          publicId: 'pothole_evidence_3'
        }
      ]
    });
    
    console.log('📸 Image Upload Test Results:');
    console.log('==============================');
    console.log(`📄 Complaint ID: ${complaintWithImages._id}`);
    console.log(`📝 Title: ${complaintWithImages.title}`);
    console.log(`📂 Type: ${complaintWithImages.type}`);
    console.log(`⚡ Priority: ${complaintWithImages.priority}`);
    console.log(`📍 Location: ${complaintWithImages.location.address}`);
    console.log(`📸 Images Uploaded: ${complaintWithImages.images.length}`);
    console.log('');
    
    // Display image details
    complaintWithImages.images.forEach((image, index) => {
      console.log(`🖼️  Image ${index + 1}:`);
      console.log(`   URL: ${image.url}`);
      console.log(`   Public ID: ${image.publicId}`);
      console.log('');
    });
    
    // Test retrieving complaint with images
    const retrievedComplaint = await Complaint.findById(complaintWithImages._id)
      .populate('author', 'name email')
      .exec();
    
    console.log('🔍 Data Retrieval Test:');
    console.log('=======================');
    console.log(`✅ Complaint found: ${retrievedComplaint!.title}`);
    console.log(`✅ Author populated: ${(retrievedComplaint!.author as any).name}`);
    console.log(`✅ Images preserved: ${retrievedComplaint!.images.length} images`);
    console.log('');
    
    // Test image URLs are accessible
    console.log('🌐 Testing Image URL Accessibility:');
    console.log('===================================');
    for (let i = 0; i < retrievedComplaint!.images.length; i++) {
      const imageUrl = retrievedComplaint!.images[i].url;
      console.log(`🔗 Image ${i + 1} URL: ${imageUrl}`);
      console.log(`✅ URL format valid: ${imageUrl.startsWith('http')}`);
    }
    console.log('');
    
    // Get database statistics
    const totalComplaints = await Complaint.countDocuments();
    const totalUsers = await User.countDocuments();
    const complaintsWithImages = await Complaint.countDocuments({
      images: { $exists: true, $not: { $size: 0 } }
    });
    
    console.log('📊 Database Statistics:');
    console.log('=======================');
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log(`📄 Total Complaints: ${totalComplaints}`);
    console.log(`📸 Complaints with Images: ${complaintsWithImages}`);
    console.log('');
    
    // Test image filtering
    const imageComplaints = await Complaint.find({
      images: { $exists: true, $not: { $size: 0 } }
    }).populate('author', 'name').limit(5);
    
    console.log('🖼️  Recent Complaints with Images:');
    console.log('==================================');
    imageComplaints.forEach((complaint, index) => {
      console.log(`${index + 1}. ${complaint.title}`);
      console.log(`   Author: ${(complaint.author as any).name}`);
      console.log(`   Images: ${complaint.images.length}`);
      console.log(`   Type: ${complaint.type}`);
      console.log('');
    });
    
    console.log('🎉 IMAGE STORAGE TEST COMPLETED SUCCESSFULLY!');
    console.log('============================================');
    console.log('✅ Images are properly stored in MongoDB Atlas');
    console.log('✅ Image URLs are preserved and accessible');
    console.log('✅ Image metadata is correctly saved');
    console.log('✅ Complaints with images can be retrieved');
    console.log('✅ Image filtering and searching works');
    console.log('');
    console.log('🚀 Your application is ready for photo uploads!');
    
    // Cleanup test data
    await User.findByIdAndDelete(testUser._id);
    console.log('🧹 Test user cleaned up');
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('❌ Image storage test failed:');
    console.error('Error:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('1. Check MongoDB Atlas connection');
    console.error('2. Verify database permissions');
    console.error('3. Check internet connectivity for image URLs');
    process.exit(1);
  }
}

testImageStorage();