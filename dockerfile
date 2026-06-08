# Stage 1: Build the frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app
COPY ./frontend /app
RUN npm install
RUN npm run build

# Stage 2: Run the backend server
FROM node:20-alpine
WORKDIR /app

# Copy backend source and install dependencies
COPY ./backend /app
RUN npm install

# Copy built frontend assets into the public folder served by Express
COPY --from=frontend-builder /app/dist ./public

# Expose the port and start the server
EXPOSE 3000
CMD ["node", "server.js"]
