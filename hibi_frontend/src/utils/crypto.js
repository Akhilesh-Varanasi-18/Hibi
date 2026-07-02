import CryptoJS from "crypto-js";

const SECRET_KEY = "my-secret-key"; 

// Encrypt string
export function encryptData(text) {
  try {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
}

// Decrypt string
// Alternative decrypt function
export function decryptData(cipherText) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    
    // Alternative method to get the plaintext
    const decrypted = CryptoJS.enc.Utf8.stringify(bytes);
    
    if (!decrypted) {
      console.error("Decryption failed - empty result");
      return null;
    }
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}