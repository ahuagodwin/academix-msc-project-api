"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const routes_1 = require("./routes");
const connect_1 = require("./database/connect");
const middlewares_1 = require("./middlewares");
const app = (0, express_1.default)();
// Middleware setup
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [`${env_1.FRONTEND_URL_LOCAL}`, `${env_1.FRONTEND_URL_LIVE}`, `${env_1.BACKEND_URL_LOCAL}`, `${process.env.BACKEND_URL_LIVE}`,],
    credentials: true,
}));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: "50mb" }));
const server = http_1.default.createServer(app);
app.use("/api/v1/auth", routes_1.Routes.authRouter);
app.use("/api/v1/school", routes_1.Routes.schoolRouter);
app.use("/api/v1/teacher", routes_1.Routes.teacherRouter);
app.use("/api/v1/storage", routes_1.Routes.storageRouter);
app.use("/api/v1/student", routes_1.Routes.studentRouter); // TODO: remember to work on the student controller using the user model
app.use("/api/v1/subscription", routes_1.Routes.subscriptionRouter);
app.use("/api/v1/fund-wallet", routes_1.Routes.fundWalletRouter);
app.use("/api/v1/document", routes_1.Routes.documentRouter);
app.use("/api/v1/role", routes_1.Routes.roleRouter);
app.use("/api/v1/share", routes_1.Routes.shareRouter);
app.use("/api/v1/group", routes_1.Routes.groupRouter);
app.use("/api/v1/notifications", routes_1.Routes.notificationRouter);
app.use("/api/v1/payout", routes_1.Routes.payoutRouter);
app.use("/api/v1/finance", routes_1.Routes.financialSummaryRouter);
// Error handling middleware
app.use(middlewares_1.middlewares.errorHandler);
// Start the server
server.listen(env_1.PORT, async () => {
    await (0, connect_1.connect)();
    console.log(`Server is running on port ${env_1.PORT}`);
});
