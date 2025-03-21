import Joi from "joi";

const emailRegex = /^[^\s@+]+(?:\+[^0-9]*|)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const loginSchema = Joi.object({
    email: Joi.string()
      .min(6)
      .max(60)
      .required()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "ng"] } })
      .pattern(emailRegex)
      .messages({
          "string.pattern.base": `email with plus sign is not allowed`,
        }),
      password: Joi.string().pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")).required().messages({
          "string.pattern.base":
            "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character.",
        }),
    // role: Joi.string().alphanum().message("Role is required").required(),
  });

