const { literal } = require("sequelize");
const ledgerModel = require("../models/ledger.model");

const getAccountBalance = async (
    accountId,
    transaction = null
) => {
    const options = {
        where: {
            accountId,
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
    };

    if (transaction) {
        options.transaction = transaction;
    }

    const result = await ledgerModel.findOne(options);

    return Number(result?.balance || 0);
};

module.exports = {
    getAccountBalance,
};