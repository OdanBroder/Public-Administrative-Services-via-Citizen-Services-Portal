FROM node:22-alpine

WORKDIR /app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production=false && \
    chown -R appuser:appgroup /app

# Copy the rest of the application
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Expose the port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "dev"]