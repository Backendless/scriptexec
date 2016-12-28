#!/usr/bin/env bash
set -e

if [ -z "$1" ];
then echo "You forgot to set server address"; exit;
fi

if [ -z "$2" ];
then echo "You forgot to set scriptexec address"; exit;
fi

SERVER_ADDRESS=$1
#MY_HOST=$(ifconfig | awk '/inet addr/{print substr($2,6)}' | grep 10.0 | awk 'NR==1{print $1}')
MY_HOST=$2

echo "Unregistering script executor..."
curl -H Content-Type:application/json -d '{"dockerHost":"'$MY_HOST'"}' -X DELETE http://$SERVER_ADDRESS/scriptexec/nodejs

echo "Stopping docker containers..."
docker ps -a -q | xargs --no-run-if-empty docker stop
echo "Removing docker containers..."
docker ps -a -q | xargs --no-run-if-empty docker rm

echo "Redownloading image..."
docker images -q | xargs --no-run-if-empty docker rmi
docker pull backendless/alpine-nodejs:1.0

echo "Flushing iptables..."
iptables -F
iptables -A FORWARD -d 10.0.0.0/8 -j ACCEPT
iptables -A FORWARD -d 172.0.0.0/8 -j ACCEPT
iptables -A FORWARD -d 149.56.79.124 -j ACCEPT
iptables -A FORWARD -d 167.114.222.170 -j ACCEPT
iptables -A FORWARD -d 149.56.79.127 -j ACCEPT
iptables -A FORWARD -d 167.114.166.192 -j ACCEPT

echo "Registering script executor..."
curl -H Content-Type:application/json -d '{"dockerHost":"'$MY_HOST'"}' -X POST http://$SERVER_ADDRESS/scriptexec/nodejs
