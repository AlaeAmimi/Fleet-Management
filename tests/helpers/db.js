const mongoose = require("mongoose");

// A separate database on the Docker MongoDB, so your real "fleet" data is never touched
const TEST_URI = "mongodb://localhost:27017/fleet_test";

async function connect() {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 5000 });
}

async function clear() {
    const collections = mongoose.connection.collections;
    for (const name in collections) {
        await collections[name].deleteMany({});
    }
}

async function disconnect() {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
}

module.exports = { connect, clear, disconnect };