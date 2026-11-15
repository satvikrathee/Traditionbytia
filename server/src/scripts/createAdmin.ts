import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';

const createAdmin = async () => {
  try {
    const email = process.argv[2] || 'admin@traditionsbytiya.com';
    const password = process.argv[3] || 'Admin@Traditions2026!';
    const name = process.argv[4] || 'Admin - Traditions By Tiya';

    console.log(`[Admin Setup] Connecting to database...`);
    await mongoose.connect(ENV.MONGODB_URI);

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (user) {
      user.role = 'admin';
      user.passwordHash = passwordHash;
      user.name = name;
      await user.save();
      console.log(`[Admin Setup] Updated existing user "${email}" to Admin role.`);
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'admin',
        addresses: [],
      });
      console.log(`[Admin Setup] Created new Admin user "${email}".`);
    }

    console.log(`===============================================`);
    console.log(`  Admin Email:    ${email}`);
    console.log(`  Admin Password: ${password}`);
    console.log(`  Role:           admin`);
    console.log(`===============================================`);

    process.exit(0);
  } catch (error) {
    console.error('[Admin Setup] Failed:', error);
    process.exit(1);
  }
};

createAdmin();

