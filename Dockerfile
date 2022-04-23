FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./

COPY . .

RUN npm install

EXPOSE 80

ENV DEV_ENV prod


CMD [ "npm", "run", "start" ]
