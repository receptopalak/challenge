# 1. Base Image
# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# 2. Working Directory
# Set the working directory in the container
WORKDIR /app

# 3. Copy package files
# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# 4. Install Dependencies
# Install project dependencies
RUN npm install

# 5. Copy Application Code
# Copy the rest of the application's source code
COPY . .

# 6. Expose Port
# Expose the port the app runs on (Vite's default is 5173)
EXPOSE 5173

# 7. Start Command
# Command to run the application in development mode
# Host and port are configured in vite.config.ts
CMD ["npm", "run", "dev"] 