FROM node:22-bookworm-slim

WORKDIR /app

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV EXPO_NO_TELEMETRY=1

COPY package.json package-lock.json ./

RUN npm ci && npm install --no-save @expo/ngrok@^4.1.0

COPY . .

EXPOSE 8081 19000 19001 19002 19006

CMD ["npx", "expo", "start", "--tunnel", "--clear"]
