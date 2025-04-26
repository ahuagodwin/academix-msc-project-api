
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import cors from 'cors';
import cookiesParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan'
import helmet from 'helmet';
import { BACKEND_URL_LIVE, BACKEND_URL_LOCAL, FRONTEND_URL_LIVE, FRONTEND_URL_LOCAL, METHODS, PORT } from './config/env';
import { Routes } from './routes';
import { connect } from './database/connect';
import { middlewares } from './middlewares';
import path from 'path';

const app = express();

// Middleware setup
app.use(helmet());
app.use(cors({
    origin: [ `${FRONTEND_URL_LOCAL}`, `${FRONTEND_URL_LIVE}`, `${BACKEND_URL_LOCAL}`, `${BACKEND_URL_LIVE}`, ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: METHODS?.split(','),
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookiesParser());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.json({ limit: "50mb" }));
app.use('public/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app)

app.use("/api/v1/auth", Routes.authRouter);
app.use("/api/v1/school", Routes.schoolRouter);
app.use("/api/v1/teacher", Routes.teacherRouter); //TODO: remember to work on the teacher controller using the user model on V2 SPRINT
app.use("/api/v1/storage", Routes.storageRouter);
app.use("/api/v1/student", Routes.studentRouter); // TODO: remember to work on the student controller using the user model on V2 SPRINT
app.use("/api/v1/subscription", Routes.subscriptionRouter);
app.use("/api/v1/fund-wallet", Routes.fundWalletRouter);
app.use("/api/v1/document", Routes.documentRouter);
app.use("/api/v1/role", Routes.roleRouter);
app.use("/api/v1/share", Routes.shareRouter);
app.use("/api/v1/group", Routes.groupRouter);
app.use("/api/v1/notifications", Routes.notificationRouter);
app.use("/api/v1/payout", Routes.payoutRouter);
app.use("/api/v1/finance", Routes.financialSummaryRouter)
app.use("/api/v1/user", Routes.userRouter);
app.use("/api/v1/transactions", Routes.transactionRouter);
app.use("/api/v1/wallet", Routes.walletRouter);
app.use("/api/v1/analytics", Routes.analyticsRouter)


// Error handling middleware
app.use(middlewares.errorHandler);


// Start the server
server.listen(PORT, async () => {
    await connect()
    console.log(`Server is running on port ${PORT}`);
})