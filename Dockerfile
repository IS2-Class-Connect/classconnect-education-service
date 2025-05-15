# Use the official Node.js image as the base image
FROM node:23-alpine

RUN apk add --no-cache openssl

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the application
RUN npm run build

RUN npx prisma generate

RUN npm install prom-client

# Expose the port the application runs on
EXPOSE 3008

# Define the command to run the application
CMD ["npm", "run", "start:prod"]