#!/bin/sh  -- 

export PORT=8081
export USE_SECURE=no
export ENV=pro

export GOOGLE_APPLICATION_CREDENTIALS=/home/ejfdelgado/desarrollo/nogales-videocall/credentials/local-volt-431316-m2-4fe954a04994.json

export POSTGRES_HOST=35.238.9.118
export POSTGRES_PORT=5432
export POSTGRES_DB=nogales
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=pinpollo

export NODE_SERVER_PATH=/
export SEND_GRID_VARIABLE=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
export EMAIL_SENDER=ejdelgado@nogalespsychological.com

export BUCKET_PUBLIC=stg-nogales-public
export BUCKET_PRIVATE=stg-nogales-private

export AUTH_PROVIDER=microsoft
export MICROSOFT_CLIENT_ID=4c1062f0-7409-4597-9eac-21b87ac6005e
export MICROSOFT_TENANT=e03b8fb1-7e35-4dab-ae1e-aa681402dbf2
export AUTH_GROUP_ID_MAP=eyI0NTg3NDMzMi03Y2Y1LTQwNDctYmE1Ny0yZWNkOTE4M2I3ZmMiOiJhcHBzX3ZpZGVvY2FsbF9hZG1pbiIsIjczYmNiOTI5LTBjYTYtNGI1Mi05ZWRkLTRhYzM5ZTZkNmU5ZSI6ImFwcHNfdmlkZW9jYWxsX3Byb3ZpZGVyIiwiNGJiNzM5YjUtNzE0Ni00ZDU2LWI0N2QtMjU1ZGYzZjllMWIyIjoiYXBwc19kZXYifQ==
export HEY_MARKET_API_KEY="sk_JePPZhFNDA";
export HEY_MARKET_SENDER_ID="143681";
export HEY_MARKET_INBOX_ID="46850";
export HEY_MARKET_END_POINT="https://api.heymarket.com";

node ./node_modules/@ejfdelgado/ejflab-common/src/changePath.js

npm run start

