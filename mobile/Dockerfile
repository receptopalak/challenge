# 1. Base Image
FROM node:20-alpine

# 2. Working Directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install Dependencies
# Using 'npm install' as it's standard. If you use 'yarn', change this to 'yarn install'.
RUN npm install

# 5. Copy Application Code
COPY . .

# 6. Expose Expo Ports
# Expo Metro Bundler typically runs on port 8081
EXPOSE 8081

# 7. Start Command
# The command to start the Expo development server.
# -c clears the cache on startup.
CMD ["npm", "start", "--", "-c"] 