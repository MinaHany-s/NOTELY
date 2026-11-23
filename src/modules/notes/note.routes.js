
import { Router } from "express";

import * as NC from "./note.controller.js";
import authMiddleware from "../../middlewares/auth.js";
import validationMiddleware from "../../middlewares/validation.js";

import {
    createNoteSchema,
    updateNoteSchema,
    noteIdSchema,
} from "../../validators/note.validator.js";

const noteRouter = Router();

// Get All Notes
noteRouter.get(
    "/",
    authMiddleware,
    NC.getAllNotes
);
// Get Notes stats

noteRouter.get(
    "/stats",
    authMiddleware,
    NC.getNotesStats
);

// Get Single Note
noteRouter.get(
    "/:id",
    authMiddleware,
    validationMiddleware(noteIdSchema, "params"),
    NC.getNote
);

// Create Note
noteRouter.post(
    "/",
    authMiddleware,
    validationMiddleware(createNoteSchema),
    NC.createNote
);

// Update Note
noteRouter.patch(
    "/:id",
    authMiddleware,
    validationMiddleware(noteIdSchema, "params"),
    validationMiddleware(updateNoteSchema),
    NC.updateNote
);

// Delete Note
noteRouter.delete(
    "/:id",
    authMiddleware,
    validationMiddleware(noteIdSchema, "params"),
    NC.deleteNote
);

// Pin Note
noteRouter.patch(
    "/:id/pin",
    authMiddleware,
    validationMiddleware(noteIdSchema, "params"),
    NC.pinNote
);

// Unpin Note
noteRouter.patch(
    "/:id/unpin",
    authMiddleware,
    validationMiddleware(noteIdSchema, "params"),
    NC.unpinNote
);

// Archive Note
noteRouter.patch(
    "/:id/archive",
    authMiddleware,
    validationMiddleware(noteIdSchema, "params"),
    NC.archiveNote
);

// Restore from Archive
noteRouter.patch(
    "/:id/restore",
    authMiddleware,
    validationMiddleware(noteIdSchema, "params"),
    NC.restoreArchivedNote
);

// Restore from Trash
noteRouter.patch(
    "/:id/restore-trash",
    authMiddleware,
    validationMiddleware(noteIdSchema, "params"),
    NC.restoreDeletedNote
);
// Permanent Delete Note
noteRouter.delete(
    "/:id/permanent",
    authMiddleware,
    validationMiddleware(noteIdSchema, "params"),
    NC.permanentDeleteNote
);

export default noteRouter;
