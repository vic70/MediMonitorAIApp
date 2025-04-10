import User from '../models/user.model.js';

const requireAdmin = async (req, res, next) => {
    try {
        if (!req.auth) {
            return res.status(401).json({
                success: false,
                error: "Login required",
            });
        }

        const user = await User.findById(req.auth._id);

        if (!user || user.role !== 'community_organizer') {
            return res.status(403).json({
                success: false,
                error: "Admin access required",
            });
        }

        next();

    } catch (error) {
        return next(error);
    }
}

export default requireAdmin;

