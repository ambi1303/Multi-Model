# Use a Node.js base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (default for React development server)
EXPOSE 3000

# Command to start the React development server
CMD ["npm", "start"] 