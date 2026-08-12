const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

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
            beforeUpdate() {
                throw new Error(
                    "Ledger entries are immutable and cannot be modified"
                );
            },

            beforeDestroy() {
                throw new Error(
                    "Ledger entries are immutable and cannot be deleted"
                );
            },
        },
    }
);

module.exports = accountModel;