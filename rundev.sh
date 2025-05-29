#!/bin/sh

cd /tmp/app

/usr/sbin/sshd -D &
recPID2=$!
echo $recPID2

# Update any new library
# npm install

ng completion

# Run angular and continue
npm run angular &

# Run nodejs and wait for it to see the logs
npm run start