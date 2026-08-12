const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const {
    beforeUpdate,
    beforeDestroy,
} = require("./hooks/account.hooks");

const accountModel = sequelize.define(
    "Accounts",
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
            references: {
                model: "users",
                key: "id",
            },
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
            type: DataTypes.STRING,
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

module.exports = accountModel;