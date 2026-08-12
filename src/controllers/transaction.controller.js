const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit postgresql session
     * 10. Send email notification
 */

const createTransaction = async (req, res) => {
    
    // Step 1: Validate request
    const { fromAccountId, toAccountId, amount, idempotencyKey } = req.body;

    if (!fromAccountId || !toAccountId || !amount || !idempotencyKey) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const fromUserAccount = await accountModel.findOne({ where: { id: fromAccountId } });
    const toUserAccount = await accountModel.findOne({ where: { id: toAccountId } });

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({ message: "Invalid account IDs" });
    }

    // Step 2: Validate idempotency key
    const existingTransaction = await transactionModel.findOne({ where: { idempotencyKey } });

    if (existingTransaction) {
        return res.status(400).json({ message: "Idempotency key already exists" });
    }

    // Step 3: Check account status
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({ message: "Both accounts must be active" });
    }

    // Step 4: Derive sender balance from ledger
    const senderBalance = await ledgerModel.findOne({ where: { accountId: fromAccountId } });

    if (senderBalance.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
    }

    // Step 5: Create transaction (PENDING)
    const transaction = await transactionModel.create({
        fromAccountId,
        toAccountId,
        amount,
        idempotencyKey,
        status: "PENDING",
    });

    // Step 6: Create DEBIT ledger entry
    await ledgerModel.create({
        accountId: fromAccountId,
        amount: -amount,
        transactionId: transaction.id,
    });

    // Step 7: Create CREDIT ledger entry
    await ledgerModel.create({
        accountId: toAccountId,
        amount,
        transactionId: transaction.id,
    });

    // Step 8: Mark transaction COMPLETED
    await transactionModel.update({ status: "COMPLETED" }, { where: { id: transaction.id } });

    // Step 9: Commit postgresql session
    await transactionModel.sequelize.commitTransaction();

    // Step 10: Send email notification
    await emailService.sendTransactionEmail(fromUserAccount.email, fromUserAccount.name, transaction);

    return res.status(200).json({ message: "Transaction created successfully" });
};

const createInitialFundsTransaction = async (req, res) => {
    try {
        // Initial funds logic here

        return res.status(201).json({
            success: true,
            message: "Initial funds transaction created successfully",
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Error creating initial funds transaction",
        });
    }
};

module.exports = { createTransaction, createInitialFundsTransaction };