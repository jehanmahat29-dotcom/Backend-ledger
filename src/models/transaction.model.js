const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Transaction = sequelize.define(
    "Transaction",
    {
        transaction_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        fromAccountId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "from_account_id",
            references: {
                model: "accounts",
                key: "account_id",
            },
        },

        toAccountId: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },

        idempotencyKey: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            field: "idempotency_key",
        },
    },
    {
        tableName: "transactions",
        timestamps: true,
    }
);

module.exports = Transaction;