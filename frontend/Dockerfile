FROM node:22-alpine

WORKDIR /app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install && \
    chown -R appuser:appgroup /app

# Copy the rest of the application
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Expose the port
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev"]