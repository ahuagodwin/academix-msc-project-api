"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FLW_TRANSFER_API_URL = exports.ACADEMIX_FLW_WEB_HOOK_URL = exports.NO_REPLY_EMAIL = exports.FIREBASE_STORAGE_BUCKET = exports.FIREBASE_SERVICE_ACCOUNT = exports.CLOUDINARY_API_SECRET = exports.CLOUDINARY_API_KEY = exports.CLOUDINARY_CLOUD_NAME = exports.FLW_SECRET_KEY = exports.FLW_PUBLIC_KEY = exports.FLWSECK_KEY = exports.JWT_REFRESH_EXPIRATION = exports.SMTP_MAIL_PASSWORD = exports.SMTP_MAIL_ID = exports.BACKEND_URL_LOCAL = exports.JWT_EXPIRY_KEY = exports.JWT_SECRET_KEY = exports.ARCJET_SECRET_KEY = exports.DB_USERNAME = exports.DB_PASSWORD = exports.DB_URL = exports.FRONTEND_URL_LIVE = exports.FRONTEND_URL_LOCAL = exports.NODE_ENV = exports.PORT = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: `.env.${process?.env?.NODE_ENV || "development"}.local` });
_a = process.env, exports.PORT = _a.PORT, exports.NODE_ENV = _a.NODE_ENV, exports.FRONTEND_URL_LOCAL = _a.FRONTEND_URL_LOCAL, exports.FRONTEND_URL_LIVE = _a.FRONTEND_URL_LIVE, exports.DB_URL = _a.DB_URL, exports.DB_PASSWORD = _a.DB_PASSWORD, exports.DB_USERNAME = _a.DB_USERNAME, exports.ARCJET_SECRET_KEY = _a.ARCJET_SECRET_KEY, exports.JWT_SECRET_KEY = _a.JWT_SECRET_KEY, exports.JWT_EXPIRY_KEY = _a.JWT_EXPIRY_KEY, exports.BACKEND_URL_LOCAL = _a.BACKEND_URL_LOCAL, exports.SMTP_MAIL_ID = _a.SMTP_MAIL_ID, exports.SMTP_MAIL_PASSWORD = _a.SMTP_MAIL_PASSWORD, exports.JWT_REFRESH_EXPIRATION = _a.JWT_REFRESH_EXPIRATION, exports.FLWSECK_KEY = _a.FLWSECK_KEY, exports.FLW_PUBLIC_KEY = _a.FLW_PUBLIC_KEY, exports.FLW_SECRET_KEY = _a.FLW_SECRET_KEY, exports.CLOUDINARY_CLOUD_NAME = _a.CLOUDINARY_CLOUD_NAME, exports.CLOUDINARY_API_KEY = _a.CLOUDINARY_API_KEY, exports.CLOUDINARY_API_SECRET = _a.CLOUDINARY_API_SECRET, exports.FIREBASE_SERVICE_ACCOUNT = _a.FIREBASE_SERVICE_ACCOUNT, exports.FIREBASE_STORAGE_BUCKET = _a.FIREBASE_STORAGE_BUCKET, exports.NO_REPLY_EMAIL = _a.NO_REPLY_EMAIL, exports.ACADEMIX_FLW_WEB_HOOK_URL = _a.ACADEMIX_FLW_WEB_HOOK_URL, exports.FLW_TRANSFER_API_URL = _a.FLW_TRANSFER_API_URL;
if (!exports.PORT ||
    !exports.NODE_ENV ||
    !exports.FRONTEND_URL_LOCAL ||
    !exports.FRONTEND_URL_LIVE ||
    !exports.DB_URL ||
    !exports.DB_PASSWORD ||
    !exports.DB_USERNAME ||
    !exports.ARCJET_SECRET_KEY ||
    !exports.JWT_SECRET_KEY ||
    !exports.JWT_EXPIRY_KEY ||
    !exports.BACKEND_URL_LOCAL ||
    !exports.SMTP_MAIL_ID ||
    !exports.SMTP_MAIL_PASSWORD ||
    !exports.JWT_REFRESH_EXPIRATION ||
    !exports.FLWSECK_KEY ||
    !exports.FLW_PUBLIC_KEY ||
    !exports.FLW_SECRET_KEY ||
    !exports.CLOUDINARY_CLOUD_NAME ||
    !exports.CLOUDINARY_API_KEY ||
    !exports.CLOUDINARY_API_SECRET ||
    !exports.FIREBASE_SERVICE_ACCOUNT ||
    !exports.FIREBASE_STORAGE_BUCKET ||
    !exports.NO_REPLY_EMAIL ||
    !exports.ACADEMIX_FLW_WEB_HOOK_URL ||
    !exports.FLW_TRANSFER_API_URL) {
    throw new Error("Missing environment variables");
}
