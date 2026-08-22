const accountModel = require("../models/account.model");
const { getAccountBalance } = require("../services/account.service");

const createAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        const newAccount = await accountModel.create({
            userId: userId,
            status: "ACTIVE",
            currency: "INR",
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: newAccount,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Error creating account",
        });
    }
};

const getAllAccounts = async (req, res) => {
    try {
        const userId = req.user.id;

        const accounts = await accountModel.findAll({
            where: {
                userId: userId,
            },
        });

        res.status(200).json({
            success: true,
            data: accounts,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Error fetching accounts",
        });
    }
};


const getBalance = async (req, res) => {
    try {
        const accountId = Number(req.params.accountId);
        const userId = req.user.id;

        if (!Number.isInteger(accountId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID"
            });
        }

        const account = await accountModel.findOne({
            where: {
                account_id: accountId,
                userId: userId
            }
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        const balance = await getAccountBalance(accountId);

        return res.status(200).json({
            success: true,
            message: "Account balance fetched successfully",
            data: {
                accountId: accountId,
                balance: balance
            }
        });

    } catch (error) {
        console.error("Get balance error:", error);

        return res.status(500).json({
            success: false,
            message: "Error fetching account balance"
        });
    }
};


module.exports = {
    createAccount,
    getAllAccounts,
    getBalance,
};