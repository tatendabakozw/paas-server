# Use a Node.js base image
FROM node:21

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json files to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript files
RUN npm run build

# Expose the port your app will run on
EXPOSE 5500

# Define the command to start the app
CMD ["npm", "run", "dev"]