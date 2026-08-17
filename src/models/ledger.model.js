const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Ledger = sequelize.define(
    "Ledger",
    {
        ledger_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        accountId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "account_id",

            references: {
                model: "accounts",
                key: "account_id",
            },
        },

        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },

        transactionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "transaction_id",

            references: {
                model: "transactions",
                key: "transaction_id",
            },
        },

        type: {
            type: DataTypes.ENUM(
                "DEBIT",
                "CREDIT"
            ),
            allowNull: false,
        },
    },

    {
        tableName: "ledgers",
        timestamps: true,
    }
);

module.exports = Ledger;