
import User from "../../../db/models/users.model.js";
import Session from "../../../db/models/session.model.js";
import mongoose from "mongoose";
import Note from "../../../db/models/notes.model.js";

// Get Current User
export const me = (req, res) => {
    return res.status(200).json({
        success: true,
        data: req.user,
    });
};

// Update User Profile
export const update = async (req, res, next) => {
    try {
        const { firstName, lastName, email } = req.body;

        if (firstName !== undefined) {
            req.user.firstName = firstName;
        }

        if (lastName !== undefined) {
            req.user.lastName = lastName;
        }

        if (email !== undefined) {
            req.user.email = email;
        }

        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: {
                id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
            },
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already exists",
            });
        }

        next(error);
    }
};

// Change Password
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Revoke all active sessions
        await Session.updateMany(
            {
                user: user._id,
                revokedAt: null,
            },
            {
                $set: {
                    revokedAt: new Date(),
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: "Password changed successfully. Please login again.",
        });

    } catch (error) {
        next(error);
    }
};

// Delete Account
export const deleteAccount = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        const userId = req.user._id;

        await session.withTransaction(async () => {
            // Delete all user's notes
            await Note.deleteMany(
                { user: userId },
                { session }
            );

            // Delete all user's sessions
            await Session.deleteMany(
                { user: userId },
                { session }
            );

            // Delete user account
            await User.deleteOne(
                { _id: userId },
                { session }
            );
        });

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });

    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
};



// Admin: Get All Users
export const getAllUsers = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit) || 10)
        );

        const skip = (page - 1) * limit;

        const search = req.query.search?.trim();

        // Build Search Filter
        const filter = {};

        if (search) {
            const escapedSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { firstName: { $regex: escapedSearch, $options: "i" } },
                { lastName: { $regex: escapedSearch, $options: "i" } },
                { email: { $regex: escapedSearch, $options: "i" } },
            ];
        }

        // Get Users and Total Count
        const [users, totalUsers] = await Promise.all([
            User.find(filter)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                users,
                totalUsers,
                page,
                limit,
                totalPages: Math.ceil(totalUsers / limit),
            },
        });

    } catch (error) {
        next(error);
    }
};


// Admin: Get User By ID
export const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        // Pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);

        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit) || 10)
        );

        const skip = (page - 1) * limit;

        // Get user first
        const user = await User.findById(id)
            .select("-password")
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Get notes with pagination
        const [notes, totalNotes] = await Promise.all([
            Note.find({ user: id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Note.countDocuments({ user: id }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                user,
                notes: {
                    items: notes,
                    totalNotes,
                    page,
                    limit,
                    totalPages: Math.ceil(totalNotes / limit),
                },
            },
        });

    } catch (error) {
        next(error);
    }
};

// Admin: Delete User
export const adminDeleteUser = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own admin account",
            });
        }

        const targetUser = await User.findById(id).session(session);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (targetUser.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Cannot delete another admin account",
            });
        }

        await session.withTransaction(async () => {
            await Note.deleteMany(
                { user: targetUser._id },
                { session }
            );

            await Session.deleteMany(
                { user: targetUser._id },
                { session }
            );

            await User.deleteOne(
                { _id: targetUser._id },
                { session }
            );
        });

        return res.status(200).json({
            success: true,
            message: "User and all related data deleted successfully",
        });

    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
};


// Admin: Update User Role
export const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role. Allowed roles: user, admin",
            });
        }

        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own role",
            });
        }

        const targetUser = await User.findById(id);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (targetUser.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Cannot change another admin's role",
            });
        }

        targetUser.role = role;
        await targetUser.save();

        return res.status(200).json({
            success: true,
            message: "User role updated successfully",
            data: {
                id: targetUser._id,
                email: targetUser.email,
                role: targetUser.role,
            },
        });

    } catch (error) {
        next(error);
    }
};

// Toggle User Role (Main Admin Only)
export const toggleUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Only the main admin can change roles
        if (req.user.email !== "admin@notely.com") {
            return res.status(403).json({
                success: false,
                message: "Only the main admin can change user roles",
            });
        }

        // Validate ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        // Find target user
        const targetUser = await User.findById(id);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Prevent changing your own role
        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own role",
            });
        }

        // Toggle role
        targetUser.role = targetUser.role === "admin" ? "user" : "admin";

        await targetUser.save();

        return res.status(200).json({
            success: true,
            message: `User role changed to ${targetUser.role} successfully`,
            data: {
                id: targetUser._id,
                email: targetUser.email,
                role: targetUser.role,
            },
        });
    } catch (error) {
        next(error);
    }
};
// Admin Dashboard Statistics
export const getAdminStats = async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalAdmins,
            totalNotes,
            activeNotes,
            archivedNotes,
            trashedNotes,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "admin" }),
            Note.countDocuments(),
            Note.countDocuments({
                deletedAt: null,
                isArchived: false,
            }),
            Note.countDocuments({
                deletedAt: null,
                isArchived: true,
            }),
            Note.countDocuments({
                deletedAt: { $ne: null },
            }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    admins: totalAdmins,
                },
                notes: {
                    total: totalNotes,
                    active: activeNotes,
                    archived: archivedNotes,
                    trashed: trashedNotes,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};