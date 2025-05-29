# Set-ExecutionPolicy -ExecutionPolicy Unrestricted
# https://download.visualstudio.microsoft.com/download/pr/1754ea58-11a6-44ab-a262-696e194ce543/3642E3F95D50CC193E4B5A0B0FFBF7FE2C08801517758B4C8AEB7105A091208A/VC_redist.x64.exe
$env:MONGO_URI="localhost:27017"
$env:MILVUS_URI="http://localhost:19530"
$env:MINIO_URI="localhost:9000"

$env:PORT="8081"
$env:USE_SECURE="no"
$env:ENV="pro"
$env:MONGO_USR="user"
$env:MONGO_PASS="pass"
$env:MINIO_ACCESS_KEY="G3Ms1HAFz9Y5bXVInUyg"
$env:MINIO_SECRET_KEY="Ji0MkkQcQiip1apqJKiodnB03pnLL869aXnsqkiY"
$env:WORKSPACE="D:/desarrollo/widesight-core"
$env:FACE_SERVER="http://localhost:8082/"
$env:GOOGLE_APPLICATION_CREDENTIALS="D:/desarrollo/widesight-core/credentials/ejfexperiments-c2ef2a890ca5.json"
$env:TRAIN_SERVER="https://imagiation-7b6hvjg6ia-uc.a.run.app/"

npm run start