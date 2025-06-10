FROM node:22-alpine

WORKDIR /app

RUN addgroup -g 113 tss || true 
RUN adduser -u 106 -G tss -S tss

RUN apk update && \
    apk add --upgrade --no-cache \
        tpm2-tools \
        tpm2-abrmd \
        tpm2-tss \
        tpm2-tss-tctildr \
        tpm2-tss-tcti-device tpm2-tss-engine tpm2-tss-engine \
        dbus \
        sudo \
        shadow \
        util-linux && \
    rm -rf /var/cache/apk/* 

# Handle tpm users
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/uploads
RUN chown appuser:appgroup /app/uploads
RUN chmod 757 /app/uploads
RUN usermod -aG tss appuser
COPY --chown=appuser:appuser docker-entrypoint.sh /app
RUN chmod o+x /app/docker-entrypoint.sh

# Create a temporary directory for the TPM service
RUN mkdir -p /tmp/tpm-service && \
chown -R appuser:appgroup /tmp/tpm-service && \
chmod 750 /tmp/tpm-service
# Copy package files
COPY package*.json ./

RUN mkdir -p /app/working && chown -R appuser:appgroup /app/working && chmod 750 /app/working

# Install dependencies
RUN npm install --production=false && \
    npm install -g nodemon
    
RUN mkdir /app/data 
RUN chown -R appuser:appgroup /app/data
RUN chmod 750 /app/data
# Copy the rest of the application
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser
# Expose the port
EXPOSE 5000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
# Start the application
CMD ["npm", "run", "dev"]
