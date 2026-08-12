const bcrypt = require("bcrypt");

const comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

module.exports = {
    comparePassword,
};