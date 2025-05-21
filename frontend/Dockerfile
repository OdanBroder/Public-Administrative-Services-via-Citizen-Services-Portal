FROM node:18

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Set ownership to node user (UID 1000)
RUN chown -R node:node /app

# Switch to node user (non-root)
USER node

EXPOSE 5173

CMD ["npm", "run", "dev"]