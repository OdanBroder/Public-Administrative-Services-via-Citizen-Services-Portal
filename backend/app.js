// backend/app.js
import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";

import config from './config/config.js';
import { initializeDatabase } from './config/database.js';

import medicalCoverageRoutes from './routes/medicalCoverageRoutes.js';
import serviceHealthRoutes from './routes/serviceHealthRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import citizenRoutes from './routes/citizen.js'
import authRoutes from './routes/auth.js';
import User from './models/User.js';
import { createAdminUser } from './models/User.js';
import consoleRoute from './routes/console.js';
import Role from './models/Role.js';
import birthRegistrationRoutes from './routes/birthApplicationRoutes.js';
import servicesRoutes from './routes/serviceRoute.js';
import adminRoutes from './routes/adminRoutes.js';
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
app.use('/api/applications', applicationRoutes);
app.use('/api/birth-registration', birthRegistrationRoutes);
app.use('/api/services',  servicesRoutes)
app.use('/api/admin', adminRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: config.nodeEnv === 'development' ? err.message : undefined
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