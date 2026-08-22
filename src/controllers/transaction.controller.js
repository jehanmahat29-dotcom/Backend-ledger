const sequelize = require("../config/db");
const { Op } = require("sequelize");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const userModel = require("../models/user.model");

const {
    getAccountBalance,
} = require("../services/account.service");

const emailService = require("../services/email.service");


/**
 * Create a money transfer between two accounts.
 *
 * Flow:
 *
 * 1. Validate request
 * 2. Check idempotency key
 * 3. Start DB transaction
 * 4. Lock sender and receiver accounts
 * 5. Validate account status
 * 6. Calculate sender balance
 * 7. Validate balance
 * 8. Create PENDING transaction
 * 9. Create DEBIT ledger
 * 10. Create CREDIT ledger
 * 11. Mark transaction COMPLETED
 * 12. Commit
 * 13. Send email
 */
const createTransaction = async (req, res) => {
    const {
        fromAccountId,
        toAccountId,
        amount,
        idempotencyKey,
    } = req.body;

    /**
     * Validate request
     */

    if (
        fromAccountId === undefined ||
        toAccountId === undefined ||
        amount === undefined ||
        !idempotencyKey
    ) {
        return res.status(400).json({
            success: false,
            message:
                "fromAccountId, toAccountId, amount and idempotencyKey are required",
        });
    }

    const senderId = Number(fromAccountId);
    const receiverId = Number(toAccountId);
    const transferAmount = Number(amount);

    if (
        !Number.isInteger(senderId) ||
        !Number.isInteger(receiverId)
    ) {
        return res.status(400).json({
            success: false,
            message: "Account IDs must be valid integers",
        });
    }

    if (senderId === receiverId) {
        return res.status(400).json({
            success: false,
            message: "Sender and receiver accounts must be different",
        });
    }

    if (
        !Number.isFinite(transferAmount) ||
        transferAmount <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Amount must be greater than 0",
        });
    }

    // Avoid more than 2 decimal places.
    if (
        Math.round(transferAmount * 100) / 100 !==
        transferAmount
    ) {
        return res.status(400).json({
            success: false,
            message: "Amount can have maximum 2 decimal places",
        });
    }

    /**
     * Check idempotency key
     */

    const existingTransaction = await transactionModel.findOne({
        where: {
            idempotencyKey,
        },
    });

    if (existingTransaction) {
        return res.status(
            existingTransaction.status === "COMPLETED"
                ? 200
                : 409
        ).json({
            success:
                existingTransaction.status === "COMPLETED",

            message:
                existingTransaction.status === "COMPLETED"
                    ? "Transaction already completed"
                    : `Transaction is ${existingTransaction.status.toLowerCase()}`,

            transaction: existingTransaction,
        });
    }

    let transactionRecord;

    try {
        /**
         * Start DB transaction
         */

        transactionRecord =
            await sequelize.transaction(
                async (dbTransaction) => {

                    /**
                     * Lock sender and receiver accounts
                     */
                    const accounts = await accountModel.findAll({
                        where: {
                            account_id: {
                                [Op.in]: [
                                    senderId,
                                    receiverId,
                                ],
                            },
                        },

                        order: [
                            ["account_id", "ASC"],
                        ],

                        lock:
                            dbTransaction.LOCK.UPDATE,

                        transaction: dbTransaction,
                    });

                    const fromAccount = accounts.find((account) => account.account_id === senderId);

                    const toAccount = accounts.find((account) => account.account_id === receiverId);

                    if (!fromAccount || !toAccount) {
                        const error = new Error(
                            "Invalid account IDs"
                        );

                        error.statusCode = 404;

                        throw error;
                    }

                    /**
                     * Validate account status
                     */

                    if (
                        fromAccount.status !== "ACTIVE" ||
                        toAccount.status !== "ACTIVE"
                    ) {
                        const error = new Error(
                            "Both accounts must be ACTIVE"
                        );

                        error.statusCode = 400;

                        throw error;
                    }

                    /**
                     * Validate currency
                     */

                    if (
                        fromAccount.currency !==
                        toAccount.currency
                    ) {
                        const error = new Error(
                            "Currency mismatch between accounts"
                        );

                        error.statusCode = 400;

                        throw error;
                    }

                    /**
                     * Validate balance
                     */

                    const senderBalance = await getAccountBalance(senderId, dbTransaction);

                    if (
                        senderBalance <
                        transferAmount
                    ) {
                        const error = new Error(
                            "Insufficient balance"
                        );

                        error.statusCode = 400;

                        throw error;
                    }

                    /**
                     * Create transaction
                     */
                    const newTransaction = await transactionModel.create(
                        {
                            fromAccountId:
                                senderId,

                            toAccountId:
                                receiverId,

                            amount:
                                transferAmount,

                            idempotencyKey,

                            status: "PENDING",
                        },
                        {
                            transaction: dbTransaction,
                        }
                    );


                    /**
                     * Create DEBIT ledger
                     */
                    await ledgerModel.create(
                        {
                            accountId: fromAccount.account_id,
                            amount: transferAmount,
                            transactionId: newTransaction.transaction_id,
                            type: "DEBIT",
                        },
                        {
                            transaction: dbTransaction,
                        }
                    );

                    /**
                     * Create CREDIT ledger
                     */
                    await ledgerModel.create(
                        {
                            accountId: toAccount.account_id,
                            amount: transferAmount,
                            transactionId: newTransaction.transaction_id,
                            type: "CREDIT",
                        },
                        {
                            transaction: dbTransaction,
                        }
                    );

                    /**
                     * Update transaction status
                     */

                    await newTransaction.update(
                        {
                            status: "COMPLETED",
                        },
                        {
                            transaction:
                                dbTransaction,
                        }
                    );

                    return newTransaction;
                }
            );

        /**
         * Send transaction emails
         */

        /**
         * SENDER
         */
        try {
            const senderAccount = await accountModel.findByPk(
                transactionRecord.fromAccountId
            );

            if (!senderAccount) {
                console.log("Sender account not found");
            } else {
                const senderUser = await userModel.findByPk(
                    senderAccount.userId
                );

                console.log("========== DEBITED ==========");
                console.log("Account ID:", senderAccount.account_id);
                console.log("User ID:", senderAccount.userId);
                console.log("User Email:", senderUser?.email);
                console.log("User Name:", senderUser?.name);

                // if (senderUser?.email) {
                //     const result = await emailService.amountDebited(
                //         senderUser.email,
                //         senderUser.name,
                //         transactionRecord
                //     );

                //     console.log("Debit email result:", result);
                // }
            }
        } catch (emailError) {
            console.error("SENDER EMAIL FAILED");
            console.error(emailError);
        }


        /**
         * RECEIVER
         */

        try {
            const receiverAccount = await accountModel.findByPk(
                transactionRecord.toAccountId
            );

            if (!receiverAccount) {
                console.log("Receiver account not found");
            } else {
                const receiverUser = await userModel.findByPk(
                    receiverAccount.userId
                );

                console.log("========== CREDITED ==========");
                console.log("Account ID:", receiverAccount.account_id);
                console.log("User ID:", receiverAccount.userId);
                console.log("User Email:", receiverUser?.email);
                console.log("User Name:", receiverUser?.name);

                // if (receiverUser?.email) {
                //     const result = await emailService.amountCredited(
                //         receiverUser.email,
                //         receiverUser.name,
                //         transactionRecord
                //     );

                //     console.log("Credit email result:", result);
                // }
            }
        } catch (emailError) {
            console.error("RECEIVER EMAIL FAILED");
            console.error(emailError);
        }

        return res.status(200).json({
            success: true,

            message: "Transaction completed successfully",

            transaction: transactionRecord,
        });

    } catch (error) {
        /* 
        *Unique idempotency constraint race.
        *
        */
        if (
            error.name ===
            "SequelizeUniqueConstraintError"
        ) {
            const existing = await transactionModel.findOne({
                    where: {
                        idempotencyKey,
                    },
                });

            if (existing) {
                return res.status(200).json({
                    success:
                        existing.status ===
                        "COMPLETED",

                    message:
                        "Transaction already processed",

                    transaction: existing,
                });
            }
        }

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.statusCode
                    ? error.message
                    : "Transaction failed",

            ...(process.env.NODE_ENV !==
                "production" && {
                error: error.message,
            }),
        });
    }
};


/**
 * Create initial funds for an account.
 *
 * This requires a system account.
 *
 * The system account must belong to a user where:
 *
 * systemuser = true
 */
const createInitialFundsTransaction = async (req, res) => {
    const {
        accountId,
        amount,
        idempotencyKey,
    } = req.body;

    /*
     * Validate request
     */

    if (
        accountId === undefined ||
        amount === undefined ||
        !idempotencyKey
    ) {
        return res.status(400).json({
            success: false,
            message:
                "accountId, amount and idempotencyKey are required",
        });
    }

    const targetAccountId = Number(accountId);
    const initialAmount = Number(amount);

    if (!Number.isInteger(targetAccountId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid accountId",
        });
    }

    if (
        !Number.isFinite(initialAmount) ||
        initialAmount <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Amount must be greater than 0",
        });
    }

    try {
        const newTransaction = await sequelize.transaction(
            async (dbTransaction) => {


                /* 
                * 2. Check idempotency INSIDE transaction
                *
                */

                const existingTransaction = await transactionModel.findOne({
                        where: {
                            idempotencyKey,
                        },
                        transaction: dbTransaction,
                        lock: dbTransaction.LOCK.UPDATE,
                    });

                if (existingTransaction) {
                    return {
                        existing: true,
                        transaction: existingTransaction,
                    };
                }

                /*
                * 3. Find system user
                *
                */

                const systemUser = await userModel.findOne({
                        where: {
                            systemUser: true,
                        },
                        transaction: dbTransaction,
                        lock: dbTransaction.LOCK.UPDATE,
                    });

                if (!systemUser) {
                    const error = new Error(
                        "System user does not exist"
                    );

                    error.statusCode = 500;
                    throw error;
                }

                /* 
                * 4. Find system account
                *
                */

                const systemAccount = await accountModel.findOne({
                        where: {
                            userId: systemUser.id,
                        },
                        transaction: dbTransaction,
                        lock: dbTransaction.LOCK.UPDATE,
                    });

                if (!systemAccount) {
                    const error = new Error(
                        "System account does not exist"
                    );

                    error.statusCode = 500;
                    throw error;
                }

                /* 
                * 5. Find target account
                *
                */

                const targetAccount = await accountModel.findByPk(
                        targetAccountId,
                        {
                            transaction: dbTransaction,
                            lock: dbTransaction.LOCK.UPDATE,
                        }
                    );

                if (!targetAccount) {
                    const error = new Error(
                        "Target account does not exist"
                    );

                    error.statusCode = 404;
                    throw error;
                }

                /*
                * 6. Validate target 
                *
                */

                if (targetAccount.status !== "ACTIVE") {
                    const error = new Error(
                        "Target account is not active"
                    );

                    error.statusCode = 400;
                    throw error;
                }

                if (
                    systemAccount.currency !==
                    targetAccount.currency
                ) {
                    const error = new Error(
                        "Currency mismatch"
                    );

                    error.statusCode = 400;
                    throw error;
                }

                /* 
                * 7. Prevent system → system
                *
                */

                if (
                    systemAccount.account_id ===
                    targetAccount.account_id
                ) {
                    const error = new Error(
                        "System account cannot receive initial funds"
                    );

                    error.statusCode = 400;
                    throw error;
                }

                /*
                * 8. Create transaction
                *
                */

                const transaction = await transactionModel.create({
                    fromAccountId: null,
                    toAccountId: null,
                    amount: initialAmount,
                    idempotencyKey,
                    status: "PENDING",
                    type: "INITIAL_FUND",
                },
                    {
                        transaction: dbTransaction,
                    }
                );

                /*
                * 9. Debit system account
                *
                */

                await ledgerModel.create(
                    {
                        accountId:
                            systemAccount.account_id,

                        amount:
                            initialAmount,

                        transactionId:
                            transaction.transaction_id,

                        type: "DEBIT",
                    },
                    {
                        transaction: dbTransaction,
                    }
                );

                /*
                * 10. Credit target account
                *
                */

                await ledgerModel.create(
                    {
                        accountId:
                            targetAccount.account_id,

                        amount:
                            initialAmount,

                        transactionId:
                            transaction.transaction_id,

                        type: "CREDIT",
                    },
                    {
                        transaction: dbTransaction,
                    }
                );

                /*
                * 11. Complete transaction
                *
                */

                await transaction.update(
                    {
                        status: "COMPLETED",
                    },
                    {
                        transaction: dbTransaction,
                    }
                );

                return {
                    existing: false,
                    transaction,
                };
            }
        );

        /*
        * Existing idempotent request
        *
        */

        if (newTransaction.existing) {
            return res.status(200).json({
                success:
                    newTransaction.transaction.status ===
                    "COMPLETED",

                message:
                    "Initial funds transaction already exists",

                transaction:
                    newTransaction.transaction,
            });
        }

        /*
        * New transaction
        *
        */

        return res.status(201).json({
            success: true,

            message:
                "Initial funds added successfully",

            transaction:
                newTransaction.transaction,
        });

    } catch (error) {

        console.error(
            "Initial funds error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,

            message:
                error.statusCode
                    ? error.message
                    : "Failed to create initial funds transaction",
        });
    }
};


module.exports = {
    createTransaction,
    createInitialFundsTransaction,
};