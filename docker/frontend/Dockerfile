FROM node:22-alpine
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
EXPOSE 4200
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200"]
