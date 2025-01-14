const { closeDB } = require('../config/db');

module.exports = async () => {
    console.log("Global teardown: Closing database...");
    await closeDB(); // Clean up the database and close the connection
};