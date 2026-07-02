const allowPublicRoutes = (publicRoutes = []) => {
    return (req, res, next) => {
        if (publicRoutes.includes(req.path)) {
            console.log("Public route accessed:", req.path);
            return next();
        }
        return require('./verifyUser')(req, res, next);
    };
};

module.exports = allowPublicRoutes;