# Use an official Node.js runtime as a parent image
FROM node:20.12.0

RUN apt-get clean && apt-get update

# Install and setup pnpm
RUN npm install -g pnpm
ENV PNPM_HOME=/root/.local/share/pnpm
RUN mkdir -p $PNPM_HOME
ENV PATH="$PNPM_HOME:$PATH"

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies including TypeScript
RUN pnpm install
RUN pnpm add typescript -D
#COPY pnpm.lock ./

# Install dependencies

# Copy the rest of your application code to the working directory
COPY . .
COPY .env .env

# Build your TypeScript code
RUN pnpm run build
# Expose a port (if your app listens on a specific port)
EXPOSE 80

# Define the command to start your application
CMD ["node", "dist/index.js"]
