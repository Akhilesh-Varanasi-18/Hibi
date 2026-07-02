const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const algorithm = 'aes-256-cbc';
// Use a 32-byte hex string for ENCRYPTION_KEY env variable
const keyHex = process.env.ENCRYPTION_KEY;
if (!keyHex || keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY env variable must be set to a 32-byte hex string (64 hex chars)');
}
const key = Buffer.from(keyHex, 'hex');

const encryptThis = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
};

const decryptThis = (encryptedData, iv) => {
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};


module.exports = { encryptThis, decryptThis };