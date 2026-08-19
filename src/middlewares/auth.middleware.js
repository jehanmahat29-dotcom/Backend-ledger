const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        const token =
            req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access: No token provided",
            });
        }

        // Verify token
        const decoded = jwt.verify( token, process.env.JWT_SECRET );

        // Find user using Sequelize
        const user = await userModel.findOne({
            where: {
                id: decoded.userId,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access: User not found",
            });
        }

        // Attach user to request
        req.user = user;

        next();

    } catch (error) {
        console.error(error);

        return res.status(401).json({
            success: false,
            message: "Unauthorized access: Invalid token",
        });
    }
};

const authSystemUserMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    }

    if (req.user.systemUser !== true) {
        return res.status(403).json({
            success: false,
            message: "System user access required",
        });
    }

    next();
};


module.exports = {
    authMiddleware,
    authSystemUserMiddleware
};