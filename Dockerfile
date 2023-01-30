FROM buildkite/puppeteer

COPY scrape-swishhouse/package.json ./package.json
#
RUN npm i
#
COPY scrape-swishhouse/main.js main.js

CMD ["node", "main.js"]
