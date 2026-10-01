require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const exists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (exists) {
    console.log('Admin already exists');
  } else {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await User.create({
      firstName: 'Admin',
      lastName: 'Fleet',
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
    });
    console.log('Admin created');
  }
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});