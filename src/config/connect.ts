
const { default: mongoose } = require('mongoose');
import dotenv from "dotenv";
dotenv.config();

const connect = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGODB_DATABASE_URL);
        console.log("Database connection success")
    } catch (err: any) {
        console.log("connection error", err)
        process.exit(1);
    }
}
module.exports = connect