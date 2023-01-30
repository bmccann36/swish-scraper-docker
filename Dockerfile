
# see https://github.com/puppeteer/puppeteer/blob/main/docker/Dockerfile
FROM ghcr.io/puppeteer/puppeteer:latest

COPY package*.json ./

RUN npm ci

COPY main.js ./

CMD ["node", "main.js"]
