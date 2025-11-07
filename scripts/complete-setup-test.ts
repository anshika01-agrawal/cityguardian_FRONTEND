import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('🔧 Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (color: keyof typeof colors, message: string) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function fullDatabaseTest() {
  log('cyan', '\n🚀 CITYGUARDIAN DATABASE COMPLETE TEST');
  log('cyan', '=====================================');
  
  try {
    // Step 1: Environment Check
    log('blue', '\n📋 Step 1: Environment Check');
    log('yellow', `Current IP: 20.192.21.55 (Add this to MongoDB Atlas whitelist)`);
    log('yellow', `MongoDB URI: ${process.env.MONGODB_URI ? 'Configured ✅' : 'Missing ❌'}`);
    log('yellow', `AWS Region: ${process.env.AWS_REGION || 'Not set'}`);
    
    // Dynamic imports to ensure env is loaded first
    const { default: dbConnect } = await import('@/lib/dbConnect');
    const { default: User } = await import('@/models/User');
    const { default: Complaint } = await import('@/models/Complaint');
    
    // Step 2: Connection Test with retry mechanism
    log('blue', '\n🔄 Step 2: Testing MongoDB Connection with Retry');
    
    let connected = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!connected && attempts < maxAttempts) {
      attempts++;
      try {
        log('yellow', `Attempt ${attempts}/${maxAttempts}...`);
        const startTime = Date.now();
        await dbConnect();
        const connectionTime = Date.now() - startTime;
        log('green', `✅ Connected to MongoDB Atlas in ${connectionTime}ms`);
        connected = true;
      } catch (error: any) {
        log('red', `❌ Connection attempt ${attempts} failed: ${error.message.split('.')[0]}`);
        if (attempts < maxAttempts) {
          log('yellow', 'Retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!connected) {
      log('red', '\n🚨 MongoDB Connection Failed - IP Whitelist Required');
      log('yellow', '\n📝 IMMEDIATE ACTION REQUIRED:');
      log('yellow', '1. Go to https://cloud.mongodb.com/v2/projects');
      log('yellow', '2. Select your project → Network Access');
      log('yellow', '3. Click "Add IP Address"');
      log('yellow', '4. Add IP: 20.192.21.55');
      log('yellow', '5. Or add 0.0.0.0/0 for testing (less secure)');
      log('yellow', '6. Wait 2-3 minutes for changes to take effect');
      log('yellow', '\n🔄 Then run: npm run test-db');
      return false;
    }
    
    // Step 3: Database Operations Test
    log('blue', '\n🧪 Step 3: Testing Database Operations');
    
    // Test User creation
    log('yellow', 'Creating test user...');
    const testUser = new User({
      name: 'Test User CityGuardian',
      email: `test-${Date.now()}@cityguardian.com`,
      password: 'SecurePass123!',
      mobile: '9876543210',
      role: 'citizen'
    });
    
    const savedUser = await testUser.save();
    log('green', `✅ User created: ${savedUser.name} (ID: ${savedUser._id})`);
    
    // Test Complaint creation
    log('yellow', 'Creating test complaint...');
    const testComplaint = new Complaint({
      type: 'pothole',
      title: 'Test Pothole on Main Street',
      description: 'Large pothole causing traffic issues near the city center. Needs immediate attention.',
      location: {
        address: 'Main Street, City Center, New Delhi',
        coordinates: [77.2090, 28.6139] // Delhi coordinates
      },
      priority: 'high',
      contact: {
        mobile: '9876543210',
        email: testUser.email
      },
      author: savedUser._id
    });
    
    const savedComplaint = await testComplaint.save();
    log('green', `✅ Complaint created: ${savedComplaint.title} (ID: ${savedComplaint._id})`);
    
    // Step 4: Data Verification & Display
    log('blue', '\n📊 Step 4: Data Verification & Display');
    
    const userCount = await User.countDocuments();
    const complaintCount = await Complaint.countDocuments();
    
    log('green', `👥 Total Users in Database: ${userCount}`);
    log('green', `📝 Total Complaints in Database: ${complaintCount}`);
    
    // Display recent data
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt');
    const recentComplaints = await Complaint.find().sort({ createdAt: -1 }).limit(5).populate('author', 'name');
    
    log('cyan', '\n📋 Recent Users in Database:');
    if (recentUsers.length === 0) {
      log('yellow', '  No users found');
    } else {
      recentUsers.forEach((user, index) => {
        const date = new Date(user.createdAt).toLocaleString();
        log('yellow', `  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
        log('yellow', `     Created: ${date}`);
      });
    }
    
    log('cyan', '\n📋 Recent Complaints in Database:');
    if (recentComplaints.length === 0) {
      log('yellow', '  No complaints found');
    } else {
      recentComplaints.forEach((complaint, index) => {
        const date = new Date(complaint.createdAt).toLocaleString();
        log('yellow', `  ${index + 1}. ${complaint.title}`);
        log('yellow', `     Type: ${complaint.type} | Priority: ${complaint.priority} | Status: ${complaint.status}`);
        log('yellow', `     By: ${(complaint.author as any)?.name || 'Unknown'} | Created: ${date}`);
        log('yellow', `     Location: ${complaint.location.address}`);
      });
    }
    
    // Step 5: API Endpoints Test
    log('blue', '\n🌐 Step 5: Testing Connection Info');
    const mongoose = await import('mongoose');
    const connection = mongoose.default.connection;
    
    log('green', '🔗 Connection Details:');
    log('yellow', `   Host: ${connection.host}`);
    log('yellow', `   Database: ${connection.name}`);
    log('yellow', `   Ready State: ${connection.readyState === 1 ? 'Connected ✅' : 'Not Connected ❌'}`);
    
    // Step 6: Cleanup test data
    log('blue', '\n🧹 Step 6: Cleaning up test data');
    await User.findByIdAndDelete(savedUser._id);
    await Complaint.findByIdAndDelete(savedComplaint._id);
    log('green', '✅ Test data cleaned up');
    
    log('green', '\n🎉 ALL TESTS PASSED! Database is working perfectly!');
    log('cyan', '\n📱 Next Steps:');
    log('yellow', '1. Start your app: npm run dev');
    log('yellow', '2. Visit: http://localhost:3000/citizen/reports');
    log('yellow', '3. Create complaints and see them stored in MongoDB Atlas');
    log('yellow', '4. Check health: http://localhost:3000/api/health');
    
    return true;
    
  } catch (error: any) {
    log('red', '\n❌ Test failed with error:');
    console.error(error);
    
    if (error.message?.includes('serverSelection') || error.message?.includes('ENOTFOUND')) {
      log('yellow', '\n🚨 NETWORK/IP WHITELIST ISSUE DETECTED');
      log('yellow', '\n📝 SOLUTION:');
      log('yellow', '1. Add IP 20.192.21.55 to MongoDB Atlas whitelist');
      log('yellow', '2. Wait 2-3 minutes for changes to propagate');
      log('yellow', '3. Run this test again: npm run test-db');
    }
    
    return false;
  }
}

// Run the test
fullDatabaseTest().then((success) => {
  if (success) {
    log('green', '\n✅ Setup verification complete - Ready for production!');
  } else {
    log('red', '\n❌ Setup verification failed - Please fix MongoDB Atlas IP whitelist');
  }
  process.exit(success ? 0 : 1);
}).catch((error) => {
  log('red', '\n💥 Critical error during testing:');
  console.error(error);
  process.exit(1);
});