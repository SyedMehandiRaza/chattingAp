"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatList extends Model {
    static associate(models) {
      ChatList.hasMany(models.ChatParticipant, {
        foreignKey: "chatListId",
        as: "participants",
      });

      ChatList.hasMany(models.Message, {
        foreignKey: "chatListId",
        as: "messages",
      });

      ChatList.belongsTo(models.Message, {
        foreignKey: "lastMessageId",
        as: "lastMessage",
      });
    }

    // Helper: Check if a user is part of this chat
    async isUserParticipant(userId) {
      const participant = await sequelize.models.ChatParticipant.findOne({
        where: { chatListId: this.id, userId },
      });
      return !!participant;
    }

    // Helper: Check if a user is admin (for groups)
    async isUserAdmin(userId) {
      const participant = await sequelize.models.ChatParticipant.findOne({
        where: { chatListId: this.id, userId },
      });
      return participant?.isAdmin || false;
    }
  }

  ChatList.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { len: { args: [0, 255], msg: "Name too long" } },
      },
      type: {
        type: DataTypes.ENUM("private", "group"),
        allowNull: false,
        validate: {
          isIn: {
            args: [["private", "group"]],
            msg: "Type must be private or group",
          },
        },
      },
      lastMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "ChatList",
    }
  );

  return ChatList;
};
