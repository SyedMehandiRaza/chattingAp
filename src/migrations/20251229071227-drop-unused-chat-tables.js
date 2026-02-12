// 'use strict';

// /** @type {import('sequelize-cli').Migration} */
// module.exports = {
//   async up (queryInterface, Sequelize) {
//     /**
//      * Add altering commands here.
//      *
//      * Example:
//      * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
//      */
//   },

//   async down (queryInterface, Sequelize) {
//     /**
//      * Add reverting commands here.
//      *
//      * Example:
//      * await queryInterface.dropTable('users');
//      */
//   }
// };

// 'use strict';

// /** @type {import('sequelize-cli').Migration} */
// module.exports = {
//   async up (queryInterface, Sequelize) {
//     /**
//      * Add altering commands here.
//      *
//      * Example:
//      * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
//      */
//   },

//   async down (queryInterface, Sequelize) {
//     /**
//      * Add reverting commands here.
//      *
//      * Example:
//      * await queryInterface.dropTable('users');
//      */
//   }
// };

"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable("chat_lists");
    await queryInterface.dropTable("groups");
    await queryInterface.dropTable("group_members");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable("chat_lists", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId: Sequelize.INTEGER,
      otherUserId: Sequelize.INTEGER,
      lastMessage: Sequelize.STRING,
      unreadCount: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable("groups", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: Sequelize.STRING,
      createdBy: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable("group_members", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      groupId: Sequelize.INTEGER,
      userId: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },
};