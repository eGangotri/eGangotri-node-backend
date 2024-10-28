# Use an official Node.js runtime as a parent image
FROM node:20.12.0

# Install pnpm and TypeScript globally
RUN npm install -g pnpm@latest typescript

# Set the working directory inside the container
WORKDIR /app

# Copy package.json, package-lock.json, and pnpm-lock.yaml to the working directory
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of your application code to the working directory
COPY .env .env
COPY . .

# Build your TypeScript code
RUN pnpm run build

# Expose a port (if your app listens on a specific port)
EXPOSE 80

# Define the command to start your application
CMD ["node", "dist/index.js"]
