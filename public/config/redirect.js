"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedirectUrl = void 0;
const env_1 = require("./env");
const getRedirectUrl = () => {
    if (env_1.NODE_ENV === 'production') {
        if (env_1.DEPLOYMENT_PLATFORM_NETLIFY === 'NETLIFY') {
            return env_1.FUNDING_VERIFY_URL_LIVE_NETLIFY;
        }
        if (env_1.DEPLOYMENT_PLATFORM_VERCEL === 'VERCEL') {
            return env_1.FUNDING_VERIFY_URL_LIVE_VERCEL;
        }
    }
    return env_1.FUNDING_VERIFY_URL_LIVE_VERCEL || env_1.FUNDING_VERIFY_URL_LOCAL;
};
exports.getRedirectUrl = getRedirectUrl;
