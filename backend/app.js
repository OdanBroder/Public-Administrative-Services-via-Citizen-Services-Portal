// backend/app.js
import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import config from './config/config.js';
import { initializeDatabase } from './config/database.js';
import medicalCoverageRoutes from './routes/medicalCoverageRoutes.js';
import serviceHealthRoutes from './routes/serviceHealthRoutes.js';
import citizenRoutes from './routes/citizen.js'
import authRoutes from './routes/auth.js';
import { createAdminUser } from './models/User.js';
import consoleRoute from './routes/console.js';
import Role from './models/Role.js';
import birthRegistrationRoutes from './routes/birthApplicationRoutes.js';
import servicesRoutes from './routes/serviceRoute.js';
import policeRoutes from './routes/policeRoutes.js';
import bcaRoutes from './routes/bcaRoutes.js';
import qrRoute from "./routes/qrVerifyRoutes.js";
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/medical-coverage', medicalCoverageRoutes);
app.use('/api/service-health', serviceHealthRoutes);
app.use('/api/admin', consoleRoute);
app.use('/api/birth-registration', birthRegistrationRoutes);
app.use('/api/services',  servicesRoutes)
app.use('/api/police', policeRoutes);
app.use('/api/bca', bcaRoutes);
app.use('/api/qr', qrRoute);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const errorInfo = {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        stack: err && err.stack ? err.stack : undefined,
        message: err && err.message ? err.message : undefined,
        error: err
    };
    console.log('Error Info:', errorInfo);
    res.status(500).json({
        error: 'Something went wrong!',
        message: config.nodeEnv === 'development' ? err.message : err.message
    });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Initialize database
        await initializeDatabase();
        await createAdminUser();
        console.log(Role.associations);
        // Start server
        const port = config.port;
        app.listen(port, () => {
            console.log(`✅ Server is running on port ${port}`);
            console.log(`✅ Environment: ${config.nodeEnv}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

startServer();

export default app;