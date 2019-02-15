#!  /bin/bash

set -x
set -e

IMAGE=$1
[ -z "$IMAGE"] && ( echo "Image param missing" && exit -1 )

echo "Prepare local package beets-webapp.tar"
echo "Then untar it on the target it and run prepare.sh"

rm -rf beets-webapp && mkdir beets-webapp
sed 's/^.*IMG_PATTERN/    - image: $IMAGE/' docker-compose.prod.yml > beets-webapp/docker-compose.yml
cp prepare.sh beets-webapp && chmod +x beets-webapp/prepare.sh
docker save --output beets-webapp/beets-webapp-image.tar $IMAGE:latest

tar cvf beets-webapp.tar beets-webapp

