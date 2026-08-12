const { Router } = require("express");

const { authMiddleware, authSystemUserMiddleware } = require("../middlewares/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

const transactionRoutes = Router();


/**
 * POST /api/transactions/
 * Create a new transaction
 */
transactionRoutes.post( "/", authMiddleware, transactionController.createTransaction );


/**
 * POST /api/transactions/system/initial-funds
 * Create initial funds transaction from system user
 */
transactionRoutes.post( "/system/initial-funds",
                        authMiddleware, authSystemUserMiddleware,
                            transactionController.createInitialFundsTransaction );


module.exports = transactionRoutes;