import { authRouter } from "./auth.routes";
import { documentRouter } from "./document.routes";
import { financialSummaryRouter } from "./financialSummary.routes";
import { fundWalletRouter } from "./fund.routes";
import { groupRouter } from "./group.routes";
import { notificationRouter } from "./notifications.routes";
import { payoutRouter } from "./payout.routes";
import { roleRouter } from "./role.routes";
import { schoolRouter } from "./schools.routes";
import { shareRouter } from "./share.routes";
import { storageRouter } from "./storage.routes";
import { studentRouter } from "./student.routes";
import { subscriptionRouter } from "./subscription.routes";
import { teacherRouter } from "./teacher.routes";


export const Routes = {
    authRouter,
    schoolRouter,
    studentRouter,
    subscriptionRouter,
    documentRouter,
    roleRouter,
    teacherRouter,
    storageRouter,
    fundWalletRouter,
    shareRouter,
    groupRouter,
    notificationRouter,
    payoutRouter,
    financialSummaryRouter
}