#!/bin/bash

# macOS/Linux equivalent of rundev.ps1

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

npm run start 