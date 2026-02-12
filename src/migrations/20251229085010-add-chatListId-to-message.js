'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Messages', 'chatListId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'ChatLists', 
        key: 'id',
      },
      onDelete: 'CASCADE',
    });

    // Optionally, remove senderId/receiverId if you want
    await queryInterface.removeColumn('Messages', 'senderId');
    await queryInterface.removeColumn('Messages', 'receiverId');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Messages', 'chatListId');
    // await queryInterface.addColumn('Messages', 'senderId', { type: Sequelize.INTEGER });
    // await queryInterface.addColumn('Messages', 'receiverId', { type: Sequelize.INTEGER });
  },
};
