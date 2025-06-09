import { Sequelize } from 'sequelize';
import config from './config.js';
// Create Sequelize instance with retry logic
const createSequelizeInstance = () => {
    return new Sequelize(
        config.database.name,
        config.database.user,
        config.database.password,
        {
            host: config.database.host,
            port: config.database.port,
            dialect: 'mysql',
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            logging: config.nodeEnv === 'development' ? console.log : false,
            define: {
                timestamps: true,
                underscored: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci',
            },
            retry: {
                max: 5,
                match: [
                    /SequelizeConnectionError/,
                    /SequelizeConnectionRefusedError/,
                    /SequelizeHostNotFoundError/,
                    /SequelizeHostNotReachableError/,
                    /SequelizeInvalidConnectionError/,
                    /SequelizeConnectionTimedOutError/,
                    /TimeoutError/
                ]
            }
        }
    );
};

let sequelize = createSequelizeInstance();

// Test database connection with retry logic
const testConnection = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await sequelize.authenticate();
            console.log('✅ Database connection has been established successfully.');
            return true;
        } catch (error) {
            console.error(`❌ Attempt ${i + 1}/${retries}: Unable to connect to the database:`, error.message);
            if (i < retries - 1) {
                console.log(`Waiting ${delay/1000} seconds before retrying...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    return false;
};

// Initialize database with retry logic
const initializeDatabase = async () => {
    try {
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Failed to connect to database after multiple attempts');
        }
        
        // Sync all models
        await sequelize.sync({ 
            alter: config.nodeEnv === 'development',
            logging: config.nodeEnv === 'development' ? console.log : false
        });
        console.log('✅ Database synchronized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
};

// Handle database disconnection
const handleDisconnect = async () => {
    try {
        await sequelize.close();
        console.log('Database connection closed.');
    } catch (error) {
        console.error('Error closing database connection:', error);
    }
};

// Handle process termination
process.on('SIGINT', async () => {
    await handleDisconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await handleDisconnect();
    process.exit(0);
});

export {
    sequelize as default,
    testConnection,
    initializeDatabase,
    handleDisconnect
};