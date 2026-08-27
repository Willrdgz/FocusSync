FROM node:22-bookworm-slim

WORKDIR /app

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 8081 19000 19001 19002 19006

CMD ["npm", "run", "start", "--", "--host", "tunnel"]
