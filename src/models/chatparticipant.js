'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ChatParticipant extends Model {
    static associate(models) {
      ChatParticipant.belongsTo(models.User, { foreignKey: "userId" });
      ChatParticipant.belongsTo(models.ChatList, { foreignKey: "chatListId" });
    }

    canRead() {
      return true; 
    }

    canSend() {
      return true; 
    }
  }

  ChatParticipant.init(
    {
      chatListId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      lastReadMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ChatParticipant',
      indexes: [
        {unique: true, fields: ['chatListId', 'userId']}
      ]
    }
  );

  return ChatParticipant;
};

