1. Development Mode:

Command: docker-compose --profile dev up -d --build

Description: Starts the application in development mode, running the db (MySQL), backend (Node.js/Express), and frontend (React/Vite) services.

Services Started: db, backend, frontend (Vite dev server on port 5173).
  
Use Case: For local development with live reloading of backend and frontend code.

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Database: mysql -h 127.0.0.1 -u appuser -p (password from backend/.env)

2. Production Mode:
Command: docker-compose --profile prod up -d --build
Description: Starts the application in production mode, running the db (MySQL), backend (Node.js/Express), and frontend-prod (Nginx serving static files) services.
Services Started: db, backend, frontend-prod (Nginx on port 80).
Use Case: For deploying the application in a production-like environment with optimized static file serving.
Access:
- Frontend: http://localhost (port 80)
- Backend: http://localhost:3000
- Database: mysql -h 127.0.0.1 -u appuser -p (password from backend/.env)

3. Verify Database:

Commands:
- docker-compose down -v
- docker-compose --profile [dev|prod] up -d --build

Description:
- 'down -v' stops and removes all containers and deletes the mysql-data volume, resetting the database.
 - 'up -d --build' rebuilds and starts the services, re-applying backend/database/init.sql to initialize the database.

Use Case: To reset the database (e.g., after modifying init.sql) and ensure a fresh schema in development or production mode.
Note: Use cautiously in production, as it deletes all database data.