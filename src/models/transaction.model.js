const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const transactionModel = sequelize.define(
    "transactions",
    {
        fromAccountId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "from_account_id",
            references: {
                model: "accounts",
                key: "account_id",
            },
        },

        toAccountId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "to_account_id",
            references: {
                model: "accounts",
                key: "account_id",
            },
        },

        status: {
            type: DataTypes.ENUM(
                "PENDING",
                "COMPLETED",
                "FAILED",
                "REVERSED"
            ),
            allowNull: false,
            defaultValue: "PENDING",
        },

        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        idempotencyKey: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = transactionModel;