# Use an official Node.js runtime as a parent image
FROM node:18

RUN apt-get clean && apt-get update

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
COPY yarn.lock ./

RUN yarn install
RUN yarn global add typescript

# Install dependencies

# Copy the rest of your application code to the working directory
COPY . .
COPY .env .env

# Build your TypeScript code
RUN yarn run build
# Expose a port (if your app listens on a specific port)
EXPOSE 80

# Define the command to start your application
CMD ["node", "dist/index.js"]
