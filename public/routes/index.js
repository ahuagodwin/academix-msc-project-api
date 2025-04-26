"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Routes = void 0;
const analytics_routes_1 = require("./analytics.routes");
const auth_routes_1 = require("./auth.routes");
const document_routes_1 = require("./document.routes");
const financialSummary_routes_1 = require("./financialSummary.routes");
const fund_routes_1 = require("./fund.routes");
const group_routes_1 = require("./group.routes");
const notifications_routes_1 = require("./notifications.routes");
const payout_routes_1 = require("./payout.routes");
const role_routes_1 = require("./role.routes");
const schools_routes_1 = require("./schools.routes");
const share_routes_1 = require("./share.routes");
const storage_routes_1 = require("./storage.routes");
const student_routes_1 = require("./student.routes");
const subscription_routes_1 = require("./subscription.routes");
const teacher_routes_1 = require("./teacher.routes");
const transactions_routes_1 = require("./transactions.routes");
const user_routes_1 = require("./user.routes");
const wallet_routes_1 = require("./wallet.routes");
exports.Routes = {
    authRouter: auth_routes_1.authRouter,
    schoolRouter: schools_routes_1.schoolRouter,
    studentRouter: student_routes_1.studentRouter,
    subscriptionRouter: subscription_routes_1.subscriptionRouter,
    documentRouter: document_routes_1.documentRouter,
    roleRouter: role_routes_1.roleRouter,
    teacherRouter: teacher_routes_1.teacherRouter,
    storageRouter: storage_routes_1.storageRouter,
    fundWalletRouter: fund_routes_1.fundWalletRouter,
    shareRouter: share_routes_1.shareRouter,
    groupRouter: group_routes_1.groupRouter,
    notificationRouter: notifications_routes_1.notificationRouter,
    payoutRouter: payout_routes_1.payoutRouter,
    financialSummaryRouter: financialSummary_routes_1.financialSummaryRouter,
    userRouter: user_routes_1.userRouter,
    transactionRouter: transactions_routes_1.transactionRouter,
    walletRouter: wallet_routes_1.walletRouter,
    analyticsRouter: analytics_routes_1.analyticsRouter
};
