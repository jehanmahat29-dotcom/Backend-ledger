const beforeUpdate = () => {
    throw new Error(
        "Account cannot be modified"
    );
};

const beforeDestroy = () => {
    throw new Error(
        "Account cannot be deleted"
    );
};

module.exports = {
    beforeUpdate,
    beforeDestroy,
};