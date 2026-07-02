const { getISTDateAndTime } = require("./timeFunction");

// Simple API logger utility
const logger = {
    logApiRequest: (req, res, next) => {
        const timestamp = getISTDateAndTime().toISOString();
        const method = req.method;
        const path = req.originalUrl || req.url;
        const ip = req.ip || req.connection.remoteAddress;
        const formattedTime = timestamp.split("T")[1].split(".")[0];
        const formattedDate = timestamp.split("T")[0];
        let name = req.username;
        if (path != '/api/login/login-user') {
            console.log(`[${formattedDate} ${formattedTime}] ${method} ${path} - ${name}`);
        }
        next();
    },
    debug: (msg) => {
        const timestamp = getISTDateAndTime().toISOString().split("T")[1].split(".")[0];
        console.log(`[DEBUG ${timestamp}] ${msg}`);
    },
    info: (msg) => {
        const timestamp = getISTDateAndTime().toISOString().split("T")[1].split(".")[0];
        console.log(`[INFO ${timestamp}] ${msg}`);
    },
    error: (msg) => {
        const timestamp = getISTDateAndTime().toISOString().split("T")[1].split(".")[0];
        console.error(`[ERROR ${timestamp}] ${msg}`);
    }
};

module.exports = logger;
