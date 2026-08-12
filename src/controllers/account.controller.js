const accountModel = require("../models/account.model");

const createAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        // Create a new account for the authenticated user
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

module.exports = {
    createAccount,
};