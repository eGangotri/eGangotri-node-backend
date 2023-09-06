# Use an official Node.js runtime as a parent image
FROM node:18.16.0

RUN apt-get clean && apt-get update

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install

RUN yarn add tsc 
# Copy the rest of your application code to the working directory
COPY . .
COPY .env .env
COPY .dockerignore .dockerignore

# Build your TypeScript code
RUN yarn run build

# Expose a port (if your app listens on a specific port)
EXPOSE 80

# Define the command to start your application
CMD ["node", "dist/index.js"]
