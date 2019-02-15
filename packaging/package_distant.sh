#!  /bin/bash

set -x
set -e

IMAGE=$1
[ -z "$IMAGE"] && ( echo "Image param missing" && exit -1 )

echo "Push image on dockerhub"

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
docker push $IMAGE:latest

