'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      // Message belongs to a ChatList (either private or group)
      Message.belongsTo(models.ChatList, { foreignKey: 'chatListId', as: 'chat' });

      // Message belongs to a sender
      Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });

      // Message has many reactions
      Message.hasMany(models.Reaction, { foreignKey: 'messageId', as: 'Reactions' });
    }
  }

  Message.init(
    {
      chatListId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'Chat ID is required' },
          isInt: { msg: 'Chat ID must be an integer' },
        },
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'Sender ID is required' },
          isInt: { msg: 'Sender ID must be an integer' },
        },
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: { args: [0, 2000], msg: 'Message cannot exceed 2000 characters' },
        },
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: {
            args: [['text', 'image', 'video', 'file', 'audio']],
            msg: 'Type must be one of: text, image, video, file, audio',
          },
        },
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'Message',
    }
  );

  return Message;
};
