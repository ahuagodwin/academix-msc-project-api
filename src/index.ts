
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import cors from 'cors';
import cookiesParser from 'cookie-parser';
import compression from 'compression';
import dotEnv from "dotenv"
import morgan from 'morgan'
import { errorHandler, notFound } from './middlewares/errorHandler';
const { authRouters, facultyRouters, departmentRouters, managementRouters } = require('./routes')
const connect = require("./config/connect")
import helmet from 'helmet';


connect()

dotEnv.config();
const app = express();
const port = process.env.PORT || 8080

// Middleware setup
app.use(helmet());
app.use(cors({
    origin: [ `${process.env.FRONTEND_URL_LOCAL}`, `${process.env.FRONTEND_URL_LIVE}`, `${process.env.BACKEND_URL_LOCAL}`, `${process.env.BACKEND_URL_LIVE}`, ],
    credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookiesParser());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));


const server = http.createServer(app)

// Routes
app.use('/api/v1', authRouters);
app.use('/api/v1', facultyRouters);
app.use('/api/v1', departmentRouters);
app.use('/api/v1',  managementRouters);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})