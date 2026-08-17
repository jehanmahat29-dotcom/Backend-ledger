const User = require("./user.model");
const Account = require("./account.model");
const Transaction = require("./transaction.model");
const Ledger = require("./ledger.model");

/**
* User → Accounts
*/

User.hasMany(Account, {
    foreignKey: "userId",
    sourceKey: "id",
    as: "accounts",
});

Account.belongsTo(User, {
    foreignKey: "userId",
    targetKey: "id",
    as: "user",
});


/** 
* Account → Sent Transactions
*/

Account.hasMany(Transaction, {
    foreignKey: "fromAccountId",
    sourceKey: "account_id",
    as: "sentTransactions",
});

Transaction.belongsTo(Account, {
    foreignKey: "fromAccountId",
    targetKey: "account_id",
    as: "senderAccount",
});


// --------------------------------------------------
// Account → Received Transactions
// --------------------------------------------------

Account.hasMany(Transaction, {
    foreignKey: "toAccountId",
    sourceKey: "account_id",
    as: "receivedTransactions",
});

Transaction.belongsTo(Account, {
    foreignKey: "toAccountId",
    targetKey: "account_id",
    as: "receiverAccount",
});


// --------------------------------------------------
// Account → Ledger
// --------------------------------------------------

Account.hasMany(Ledger, {
    foreignKey: "accountId",
    sourceKey: "account_id",
    as: "ledgerEntries",
});

Ledger.belongsTo(Account, {
    foreignKey: "accountId",
    targetKey: "account_id",
    as: "account",
});


// --------------------------------------------------
// Transaction → Ledger
// --------------------------------------------------

Transaction.hasMany(Ledger, {
    foreignKey: "transactionId",
    sourceKey: "transaction_id",
    as: "ledgerEntries",
});

Ledger.belongsTo(Transaction, {
    foreignKey: "transactionId",
    targetKey: "transaction_id",
    as: "transaction",
});


module.exports = {
    User,
    Account,
    Transaction,
    Ledger,
};