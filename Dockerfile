FROM node:9.11.1
WORKDIR /app
COPY yarn.lock .
COPY package.json .
RUN yarn install
COPY dist .
COPY wait-for-it.sh .
CMD node index.js