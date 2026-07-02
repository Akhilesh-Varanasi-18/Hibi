const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'AUTH_TOKEN';
const setToken = (res, userId, userType) => {
    // Create JWT token with consistent expiration
    const token = jwt.sign(
        { id: userId, type: userType }, 
        process.env.JWT_SECRET, 
        { expiresIn: '3h' }
    );

    // Determine if we should use secure settings (fallback for local/HTTP testing)
    const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'stagin';
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: isProd ? 'None' : 'Lax',  
        secure: isProd,                      
        maxAge: 3 * 60 * 60 * 1000,       // 3 hours in milliseconds
    });
    
    return token; // Return token for potential use
};

module.exports = {
    setToken,
    COOKIE_NAME
};
