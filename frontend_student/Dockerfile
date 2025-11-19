# --- Stage 1: Build ---
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
# Copy .env first (before COPY . . because .env is in .dockerignore)
COPY .env* ./
COPY . .
RUN npm run build

# --- Stage 2: Serve static ---
FROM node:20 AS runner
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]