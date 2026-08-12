const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const accountController = require("../controllers/account.controller");

const router = express.Router();

/*POST /accounts - Create a new account */
router.post("/", authMiddleware, accountController.createAccount);






module.exports = router;