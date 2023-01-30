FROM buildkite/puppeteer

COPY package.json ./package.json

RUN npm i

COPY main.js main.js

CMD ["node", "main.js"]
