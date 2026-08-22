const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");


/**
 *  user registration
 * 
 * */

const registerUser = async (req, res) => {
    try {
        let { email, password, name } = req.body;

        /**
         *  Check required fields
         * 
         * */
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        /**
         *  Trim values
         * 
         * */
        email = email.trim().toLowerCase();
        name = name.trim();

        /**
         *  Email validation
         * 
         * */
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        /**
         *  Name validation
         * 
         * */
        if (name.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must be at least 2 characters long",
            });
        }

        /**
         *  Password validation
         * 
         * */
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        /**
         *  Check if user already exists
         * 
         * */
        const existingUser = await userModel.findOne({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        /**
         *  Create user
         * 
         * */
        const user = await userModel.create({
            email,
            password,
            name,
        });

        /**
         *  Generate JWT
         * 
         * */
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "24h" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3 * 60 * 60 * 1000, // 3 hours
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            token,
        });

        /**
         *  Send registration email
         * 
         * */
        await emailService.sendRegistrationEmail(user.email, user.name);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });

    }
};

/**
 *  user login
 * 
 * */

const loginUser = async (req, res) => {
    try {
        let { email, password } = req.body;

        /**
         *  Check required fields
         * 
         * */
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        /**
         *  Email validation
         * 
         * */
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        /**
         *  Password validation
         * 
         * */
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        /**
         *  Check if user exists
         * 
         * */
        const user = await userModel.findOne({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        /**
         *  Compare password
         * 
         * */
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid password",
            });
        }

        /**
         *  Generate JWT
         * 
         * */
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "3h" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3 * 60 * 60 * 1000, // 3 hours
        });

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            token,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
};