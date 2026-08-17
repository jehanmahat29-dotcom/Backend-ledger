const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const {
    beforeUpdate,
    beforeDestroy,
} = require("./hooks/account.hooks");

const Account = sequelize.define(
    "Account",
    {
        account_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "user_id",
        },

        status: {
            type: DataTypes.ENUM(
                "ACTIVE",
                "FROZEN",
                "CLOSED"
            ),
            allowNull: false,
            defaultValue: "ACTIVE",
        },

        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: "INR",
        },
    },

    {
        tableName: "accounts",
        timestamps: true,

        hooks: {
            beforeUpdate,
            beforeDestroy,
        },
    }
);

module.exports = Account;