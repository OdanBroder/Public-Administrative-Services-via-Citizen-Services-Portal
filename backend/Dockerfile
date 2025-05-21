FROM node:18.19.0

RUN apt-get update && apt-get install -y \
    libffi-dev \
    python3 \
    python3-dev \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Set ownership to node user (UID 1000)
RUN chown -R node:node /app

# Switch to node user (non-root)
USER node

EXPOSE 3000

CMD ["node", "app.js"]