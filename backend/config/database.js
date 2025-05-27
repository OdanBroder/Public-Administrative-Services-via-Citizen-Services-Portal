import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Create Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        dialect: 'mysql',
        pool: {
            max: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
            timestamps: true,
            underscored: true
        }
    }
);

// Test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        return false;
    }
};

// Initialize database
const initializeDatabase = async () => {
    try {
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Failed to connect to database');
        }
        
        // Sync all models
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('✅ Database synchronized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
};

export {
    sequelize as default,
    testConnection,
    initializeDatabase
};