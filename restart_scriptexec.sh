#!/usr/bin/env bash
set -e

if [ -z "$1" ];
then echo "You forgot to set server address"; exit;
fi

SERVER_ADDRESS=$1
MY_HOST=$(ifconfig | awk '/inet addr/{print substr($2,6)}' | grep 10.0 | awk 'NR==1{print $1}')

echo "Unregistering script executor..."
curl -H Content-Type:application/json -d '{"dockerHost":"'$MY_HOST'"}' -X DELETE http://$SERVER_ADDRESS/scriptexec/nodejs

echo "Stopping docker containers..."
docker ps -a -q | xargs --no-run-if-empty docker kill
echo "Removing docker containers..."
docker ps -a -q | xargs --no-run-if-empty docker rm

echo "Redownloading image..."
docker images -q | xargs --no-run-if-empty docker rmi
docker pull scadge/alpine-nodejs

echo "Flushing iptables..."
iptables -F
iptables -A FORWARD -d 10.0.0.0/8 -j ACCEPT

echo "Registering script executor..."
curl -H Content-Type:application/json -d '{"dockerHost":"'$MY_HOST'"}' -X POST http://$SERVER_ADDRESS/scriptexec/nodejs