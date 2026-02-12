'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [];
    const password = 'Password123'; // same password for all
    const hashedPassword = await bcrypt.hash(password, 10);

    for (let i = 1; i <= 100; i++) {
      users.push({
        name: `User${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        profilePic: `https://picsum.photos/200/200?random=${i}`,
        lastSeen: new Date(),
        onlineStatus: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Bulk insert all users at once
    await queryInterface.bulkInsert('Users', users, {});
  },

  async down(queryInterface, Sequelize) {
    // Remove all seeded users
    await queryInterface.bulkDelete('Users', null, {});
  }
};
