import mongoose from 'mongoose';
import User from '../models/User';
import connectDB from '../lib/mongodb';

/**
 * Seed script to create an admin user
 * Usage: npx ts-node scripts/seed-admin.ts
 * Or: npm run seed:admin
 */

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { username: 'admin' },
        { email: 'admin@suncity.com' },
        { role: 'admin' },
      ],
    });

    if (existingAdmin) {
      console.log('⚠ Admin user already exists:');
      console.log(`  Username: ${existingAdmin.username}`);
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Role: ${existingAdmin.role}`);
      console.log('\nTo create a new admin, delete the existing one first or use a different username/email.');
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@suncity.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin' as const,
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
    console.log('⚠ Set environment variables ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD to customize.');

    process.exit(0);
  } catch (error: any) {
    console.error('✗ Error seeding admin:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the seed function
seedAdmin();
