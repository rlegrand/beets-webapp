#!  /bin/bash

set -x
set -e

IMAGE=$1
[ -z "$IMAGE" ] && ( echo "Image param missing" && exit -1 )

echo "Tag image"
#TAG=rlegrand/${IMAGE}:latest
TAG=${IMAGE}:latest
docker tag ${IMAGE} ${TAG}

echo "Push image on dockerhub"

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
docker push ${TAG}

