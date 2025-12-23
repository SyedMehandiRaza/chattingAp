"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Message.belongsTo(models.User, { foreignKey: "senderId" });
      Message.hasMany(models.Reaction, { foreignKey: "messageId" });
      Message.belongsTo(models.Group, { foreignKey: "groupId" });
    }
  }
  Message.init(
    {
      // senderId: {
      //   type: DataTypes.INTEGER,
      //   allowNull: false,
      // },
      // receiverId: {
      //   type: DataTypes.INTEGER,
      //   allowNull: false,
      // },
      // groupId: DataTypes.INTEGER,
      // message: DataTypes.TEXT,
      // type: DataTypes.STRING,
      // isEdited: DataTypes.BOOLEAN,
      // isDeleted: DataTypes.BOOLEAN

      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Sender ID is required" },
          isInt: { msg: "Sender ID must be an integer" },
        },
      },

      receiverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          isInt: { msg: "Receiver ID must be an integer" },
        },
      },

      groupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          isInt: { msg: "Group ID must be an integer" },
        },
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 2000],
            msg: "Message cannot be more than 2000 characters",
          },
        },
      },

      type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: {
            args: [["text", "image", "video", "file", "audio"]],
            msg: "Type must be one of: text, image, video, file, audio",
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
      modelName: "Message",
    }
  );
  return Message;
};




