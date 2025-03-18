import { authRouter } from "./auth.routes";
import { documentRouter } from "./document.routes";
import { roleRouter } from "./role.routes";
import { schoolRouter } from "./schools.routes";
import { studentRouter } from "./student.routes";
import { subscriptionRouter } from "./subscription.routes";
import { userRouter } from "./user.routes";


export const Routes = {
    authRouter,
    userRouter,
    schoolRouter,
    studentRouter,
    subscriptionRouter,
    documentRouter,
    roleRouter,
}