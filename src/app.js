const express = require("express");
const sequelize = require("./config/db");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const accountRoutes = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);

// Server Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Ledger Backend Running..."
    });
});

// Database Test
app.get("/db", async (req, res) => {
    try {
        const result = await sequelize.query("SELECT NOW()");

        res.status(200).json({
            success: true,
            database_time: result[0][0].now
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }
});

module.exports = app;