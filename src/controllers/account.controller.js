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
        const accountId = req.params.accountId;

        const balance = await getAccountBalance(accountId);

        res.status(200).json({
            success: true,
            data: {
                balance: balance,
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Error fetching account balance",
        });
    }
};


module.exports = {
    createAccount,
    getAllAccounts,
    getBalance,
};