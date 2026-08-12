const { literal } = require("sequelize");
const ledgerModel = require("../models/ledger.model");

const getAccountBalance = async (accountId) => {
    const result = await ledgerModel.findOne({
        where: {
            account_id: accountId,
        },

        attributes: [
            [
                literal(`
                    COALESCE(
                        SUM(
                            CASE
                                WHEN type = 'CREDIT' THEN amount
                                WHEN type = 'DEBIT' THEN -amount
                                ELSE 0
                            END
                        ),
                        0
                    )
                `),
                "balance",
            ],
        ],

        raw: true,
    });

    return Number(result.balance);
};

module.exports = {
    getAccountBalance,
};