const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.CONNECTION_STRING, {
    dialect: "postgres",
    logging: false, // Optional: disables SQL query logging
});

sequelize.authenticate()
    .then(() => {
        console.log("✅ PostgreSQL Connected Successfully");
    })
    .catch((err) => {
        console.error("❌ Database Connection Failed");
        console.error(err.message);
    });

module.exports = sequelize;