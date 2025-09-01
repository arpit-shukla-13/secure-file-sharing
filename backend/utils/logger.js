const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', 'log.txt');

/**
 * log.txt file mein ek message likhta hai.
 * @param {string} message - Log karne ke liye message.
 */
const logAction = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;

    try {
        fs.appendFileSync(logFilePath, logMessage, 'utf8');
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
};

module.exports = { logAction };
