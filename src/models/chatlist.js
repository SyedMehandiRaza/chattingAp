'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ChatList.init({
    userId: DataTypes.INTEGER,
    otherUserId: DataTypes.INTEGER,
    lastMessage: DataTypes.STRING,
    unreadCount: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ChatList',
  });
  return ChatList;
};