#!/bin/bash

# Start the Dan Tranh Music Library Server

echo "Starting Đàn Tranh Music Library Server..."
echo ""

# Change to v3 directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Start the server
node server.js

# If server crashes, wait before closing
if [ $? -ne 0 ]; then
    echo ""
    echo "Server stopped unexpectedly. Press any key to exit..."
    read -n 1
fi