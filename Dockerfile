
# Use the official Node.js image as the base image
FROM node:23-alpine

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Prisma CLI globally
RUN npm install -g prisma

# Copy the rest of the application code to the working directory
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3002

# Define the command to run the application
CMD ["sh", "entrypoint.sh"]
