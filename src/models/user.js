"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Message, { foreignKey: "senderId" });
      User.hasMany(models.Reaction, { foreignKey: "userId" });
    }
  }
  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Name is required" },
          len: {
            args: [3, 50],
            msg: "Name is must be between 3-50 characters",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Password can not be empty" },
          len: {
            args: [6, 72],
            msg: "Password must be at least 6 caracters",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          isEmail: { msg: "Invalid Email format" },
        },
      },
      profilePic: {
        type: DataTypes.STRING,
        validate: {
          isUrl: { msg: "Profile pic must be a valid url" },
        },
      },
      lastSeen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      onlineStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
