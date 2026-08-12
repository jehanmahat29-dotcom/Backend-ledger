const bcrypt = require("bcrypt");

const beforeCreate = async (user) => {
    user.password = await bcrypt.hash(user.password, 10);
};

const beforeUpdate = async (user) => {
    if (user.changed("password")) {
        user.password = await bcrypt.hash(user.password, 10);
    }

    if (user.changed("systemUser")) {
        throw new Error("systemUser cannot be modified");
    }
};

module.exports = {
    beforeCreate,
    beforeUpdate,
};