
import Note from "../../../db/models/notes.model.js";

// Get All Notes
export const getAllNotes = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const {
            search,
            sort = "newest",
            archived = "false",
            trashed = "false",
        } = req.query;

        if (!["true", "false"].includes(trashed)) {
            return res.status(400).json({
                success: false,
                message: "Invalid trashed parameter",
            });
        }
        if (!["true", "false"].includes(archived)) {
            return res.status(400).json({
                success: false,
                message: "Invalid archived parameter",
            });
        }
        // Validate pagination
        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters",
            });
        }

        // Validate sorting option
        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            recentlyUpdated: { updatedAt: -1 },
            titleAsc: { title: 1 },
            titleDesc: { title: -1 },
        };

        if (!sortOptions[sort]) {
            return res.status(400).json({
                success: false,
                message: "Invalid sorting option",
            });
        }

        const filter = {
            user: req.user._id,
            isArchived: archived === "true",
            deletedAt: trashed === "true"
                ? { $ne: null }
                : null,
        };
        if (trashed === "true" && archived === "true") {
            return res.status(400).json({
                success: false,
                message: "Archived filter cannot be used with trash",
            });
        }
        // Search in title and content
        if (search?.trim()) {
            filter.$or = [
                { title: { $regex: search.trim(), $options: "i" } },
                { content: { $regex: search.trim(), $options: "i" } },
            ];
        }

        const skip = (page - 1) * limit;

        const [notes, totalNotes] = await Promise.all([
            Note.find(filter)
                .sort({
                    isPinned: -1,
                    ...sortOptions[sort],
                })
                .skip(skip)
                .limit(limit),

            Note.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalNotes / limit);

        return res.status(200).json({
            success: true,
            search: search?.trim() || null,
            sort,
            pagination: {
                currentPage: page,
                limit,
                totalNotes,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            results: notes.length,
            data: notes,
        });
    } catch (error) {
        next(error);
    }
};

// Get Single Note
export const getNote = async (req, res, next) => {
    try {
        const { id } = req.params;

        const note = await Note.findOne({
            _id: id,
            user: req.user._id,
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: note,
        });

    } catch (error) {
        next(error);
    }
};

// Create Note

export const createNote = async (req, res, next) => {
    try {
        const { title, content } = req.body;

        const start = performance.now();

        const note = await Note.create({
            title,
            content,
            user: req.user._id,
        });

        const dbTime = performance.now() - start;

        console.log(`Note.create() DB time: ${dbTime.toFixed(2)}ms`);

        return res.status(201).json({
            success: true,
            message: "Note created successfully",
            data: note,
        });

    } catch (error) {
        next(error);
    }
};


// Update Note
export const updateNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        const note = await Note.findOne({
            _id: id,
            user: req.user._id,
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        if (title !== undefined) {
            note.title = title;
        }

        if (content !== undefined) {
            note.content = content;
        }

        await note.save();

        return res.status(200).json({
            success: true,
            message: "Note updated successfully",
            data: note,
        });

    } catch (error) {
        next(error);
    }
};

// Delete Note
export const deleteNote = async (req, res, next) => {
    try {
        const { id } = req.params;

        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        const note = await Note.findOneAndUpdate(
            {
                _id: id,
                user: req.user._id,
                deletedAt: null,
            },
            {
                $set: {
                    deletedAt: new Date(),
                    purgeAt: new Date(Date.now() + sevenDays),
                },
            },
            {
                new: true,
            }
        );

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Note moved to trash. It will be permanently deleted after 7 days.",
            data: note,
        });
    } catch (error) {
        next(error);
    }
};

//Pin Note
export const pinNote = async (req, res, next) => {
    try {
        const { id } = req.params;

        const note = await Note.findOneAndUpdate(
            {
                _id: id,
                user: req.user._id,
            },
            {
                $set: { isPinned: true },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Note pinned successfully",
            data: note,
        });
    } catch (error) {
        next(error);
    }
};

export const unpinNote = async (req, res, next) => {
    try {
        const { id } = req.params;

        const note = await Note.findOneAndUpdate(
            {
                _id: id,
                user: req.user._id,
            },
            {
                $set: { isPinned: false },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Note unpinned successfully",
            data: note,
        });
    } catch (error) {
        next(error);
    }
};

// Archive Note
export const archiveNote = async (req, res, next) => {
    try {
        const { id } = req.params;

        const note = await Note.findOneAndUpdate(
            {
                _id: id,
                user: req.user._id,
                isArchived: false,
            },
            {
                $set: { isArchived: true },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found or already archived",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Note archived successfully",
            data: note,
        });
    } catch (error) {
        next(error);
    }
};

// Restore Note
export const restoreArchivedNote = async (req, res, next) => {
    try {
        const { id } = req.params;

        const note = await Note.findOneAndUpdate(
            {
                _id: id,
                user: req.user._id,
                isArchived: true,
                deletedAt: null,
            },
            {
                $set: { isArchived: false },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found or not archived",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Note restored from archive successfully",
            data: note,
        });
    } catch (error) {
        next(error);
    }
};

export const restoreDeletedNote = async (req, res, next) => {
    try {
        const { id } = req.params;

        const note = await Note.findOneAndUpdate(
            {
                _id: id,
                user: req.user._id,
                deletedAt: { $ne: null },
            },
            {
                $set: {
                    deletedAt: null,
                    purgeAt: null,
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Deleted note not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Note restored from trash successfully",
            data: note,
        });
    } catch (error) {
        next(error);
    }
};

// Permanent Delete Note
export const permanentDeleteNote = async (req, res, next) => {
    try {
        const { id } = req.params;

        const note = await Note.findOneAndDelete({
            _id: id,
            user: req.user._id,
            deletedAt: { $ne: null },
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Deleted note not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Note permanently deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};


export const getNotesStats = async (req, res, next) => {
    try {
        const stats = await Note.aggregate([
            {
                $match: {
                    user: req.user._id,
                },
            },
            {
                $group: {
                    _id: null,

                    totalNotes: {
                        $sum: 1,
                    },

                    activeNotes: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$isArchived", false] },
                                        { $eq: ["$deletedAt", null] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    archivedNotes: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$isArchived", true] },
                                        { $eq: ["$deletedAt", null] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    trashedNotes: {
                        $sum: {
                            $cond: [
                                { $ne: ["$deletedAt", null] },
                                1,
                                0,
                            ],
                        },
                    },

                    pinnedNotes: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$isPinned", true] },
                                        { $eq: ["$deletedAt", null] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalNotes: 1,
                    activeNotes: 1,
                    archivedNotes: 1,
                    trashedNotes: 1,
                    pinnedNotes: 1,
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            data: stats[0] || {
                totalNotes: 0,
                activeNotes: 0,
                archivedNotes: 0,
                trashedNotes: 0,
                pinnedNotes: 0,
            },
        });

    } catch (error) {
        next(error);
    }
};
