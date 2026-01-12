const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables - check both .env.local and .env
const rootDir = path.join(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');
const envPath = path.join(rootDir, '.env');

// Try .env.local first (preferred for Next.js), then .env as fallback
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('✓ Loaded environment variables from .env.local');
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✓ Loaded environment variables from .env');
} else {
  console.warn('⚠ Warning: No .env.local or .env file found. Using system environment variables only.');
}

// Define User schema matching the TypeScript model
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 6,
  },
  role: { 
    type: String, 
    enum: ['admin', 'user'], 
    default: 'user' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
}, { 
  timestamps: true 
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Note: unique: true on fields automatically creates indexes, so we don't need explicit index() calls
// If you want to create compound indexes, you can add them here

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedAdmin() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('✗ Error: MONGODB_URI not found in environment variables');
      console.error('Please create a .env.local file with MONGODB_URI');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { username: process.env.ADMIN_USERNAME || 'admin' },
        { email: process.env.ADMIN_EMAIL || 'admin@suncity.com' },
      ],
    });

    if (existingAdmin) {
      console.log('\n⚠ Admin user already exists:');
      console.log(`  Username: ${existingAdmin.username}`);
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Role: ${existingAdmin.role}`);
      console.log('\nTo create a new admin, delete the existing one first or use different credentials.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@suncity.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      isActive: true,
    };

    console.log('\nCreating admin user...');
    const admin = await User.create(adminData);

    console.log('\n✓ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Credentials:');
    console.log(`  Username: ${admin.username}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${adminData.password} (please change this)`);
    console.log(`  Role: ${admin.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠ IMPORTANT: Change the default password after first login!');
    console.log('⚠ Set environment variables ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD in .env.local to customize.');

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding admin:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();
