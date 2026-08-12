const express = require("express");

const { authMiddleware } = require("../middlewares/auth.middleware");
const accountController = require("../controllers/account.controller");

const router = express.Router();


/* POST /accounts - Create a new account */
router.post( "/", authMiddleware, accountController.createAccount );


/* GET /accounts/:accountId/balance - Get account balance */
router.get( "/:accountId/balance", authMiddleware, accountController.getBalance );


module.exports = router;