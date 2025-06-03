#!/bin/bash

# macOS/Linux development script that runs both Angular frontend and Node.js backend

echo "Setting up environment variables..."

export MONGO_URI="localhost:27017"
export MILVUS_URI="http://localhost:19530"
export MINIO_URI="localhost:9000"

export PORT="8081"
export USE_SECURE="no"
export ENV="pro"
export MONGO_USR="user"
export MONGO_PASS="pass"
export MINIO_ACCESS_KEY="G3Ms1HAFz9Y5bXVInUyg"
export MINIO_SECRET_KEY="Ji0MkkQcQiip1apqJKiodnB03pnLL869aXnsqkiY"
export WORKSPACE="/Users/rodalbores/nogales"
export FACE_SERVER="http://localhost:8082/"
export GOOGLE_APPLICATION_CREDENTIALS="/Users/rodalbores/nogales/nogales-videocall/credentials/ejfexperiments-c2ef2a890ca5.json"
export TRAIN_SERVER="https://imagiation-7b6hvjg6ia-uc.a.run.app/"

echo "Starting Angular frontend in background..."
npm run angular_local &
ANGULAR_PID=$!

echo "Waiting a moment for Angular to start..."
sleep 3

echo "Starting Node.js backend..."
npm run start

# If the backend stops, also stop the frontend
echo "Stopping Angular frontend..."
kill $ANGULAR_PID 2>/dev/null 