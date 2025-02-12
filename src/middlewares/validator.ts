import Joi from "joi";

const emailRegex = /^[^\s@+]+(?:\+[^0-9]*|)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


export const signUpSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({ minDomainSegments: 2, tlds: { allow: ["com"] } })
    .pattern(emailRegex)
    .messages({
        "string.pattern.base": `email with plus sign is not allowed`,
      }),
      password: Joi.string().pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")).required().messages({
        "string.pattern.base":
          "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character.",
      }),         
  firstName: Joi.string().alphanum().min(3).max(30).required(),
  lastName: Joi.string().alphanum().min(3).max(30).required(),
  mobile: Joi.string().pattern(new RegExp("^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-s./0-9]*$")).required(),
  facultyName:  Joi.string().min(3).max(30).required(),
  departmentName:  Joi.string().min(3).max(30).required(),
});



export const loginSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({ minDomainSegments: 2, tlds: { allow: ["com"] } })
    .pattern(emailRegex)
    .messages({
        "string.pattern.base": `email with plus sign is not allowed`,
      }),
    password: Joi.string().pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")).required().messages({
        "string.pattern.base":
          "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character.",
      })
});