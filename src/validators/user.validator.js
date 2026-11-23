
import Joi from "joi";

export const updateUserSchema = Joi.object({
    firstName: Joi.string().min(2).max(30),
    lastName: Joi.string().min(2).max(30),
    email: Joi.string().email().lowercase().trim(),
}).min(1);



export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),

    newPassword: Joi.string()
        .min(8)
        .required()
        .invalid(Joi.ref("currentPassword"))
        .messages({
            "any.invalid": "New password must be different from current password",
        }),
});
