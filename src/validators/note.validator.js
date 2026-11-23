
import Joi from "joi";

// Create Note
export const createNoteSchema = Joi.object({
    title: Joi.string()
        .min(2)
        .max(100)
        .required(),

    content: Joi.string()
        .min(1)
        .max(10000)
        .required(),
});

// Update Note
export const updateNoteSchema = Joi.object({
    title: Joi.string()
        .min(2)
        .max(100),

    content: Joi.string()
        .min(1)
        .max(10000),
}).min(1);

// Validate Note ID
export const noteIdSchema = Joi.object({
    id: Joi.string()
        .hex()
        .length(24)
        .required(),
});
