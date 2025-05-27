FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "dev"]