#!/bin/bash

PID=$(pgrep ngrok)
while [ -z "$PID" ]; do
    echo 'starting ngrok'
    ngrok http 4000 --log=stdout > ngrok.log &
    sleep 1
    PID=$(pgrep ngrok)
done
echo "running ${PID}"

URL=$(grep 'url=' ngrok.log | cut -d '=' -f8)
while [ -z "$URL" ]; do
    echo 'fetching external url'
    sleep 1
    URL=$(grep 'url=' ngrok.log | cut -d '=' -f8)
done
echo "url ${URL}"

echo 'adding to .env file'
sed -i~ '/.*WEBHOOK.*/d' .env
echo "WEBHOOK_DOMAIN=${URL}" >> .env
echo '--- ENV ---'
cat .env
echo '--- ENV ---'