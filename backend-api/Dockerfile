FROM node:22-alpine

WORKDIR /app

# Cài đặt curl cho healthcheck và build tools cho native packages (như bcrypt)
RUN apk add --no-cache curl python3 make g++

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
