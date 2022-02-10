FROM mhart/alpine-node:16

WORKDIR /usr/src/app

COPY package.json .

RUN yarn --prod

COPY . .

CMD ["yarn", "start"]
