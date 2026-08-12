const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Ledger = sequelize.define(
    "Ledger",
    {
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
            type: DataTypes.DECIMAL(10, 2),
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
            type: DataTypes.ENUM("DEBIT", "CREDIT"),
            allowNull: false,
        },
    },
    {
        tableName: "ledgers",
        timestamps: true,
    }
);

module.exports = Ledger;