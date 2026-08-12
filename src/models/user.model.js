const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

const { beforeCreate, beforeUpdate} = require("./hooks/user.hooks");

const userModel = sequelize.define(
    "users",
    {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        systemUser: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "systemuser",
        },
    },
    {
        timestamps: true,

        hooks: {
            beforeCreate,
            beforeUpdate,
        },
    }
);

userModel.prototype.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = userModel;