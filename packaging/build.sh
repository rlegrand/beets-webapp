#!  /bin/bash

set -x
set -e


function call_error(){
  printf "Usage: $0 [--localdeploy] [--distantdeploy] [--arm] [--x86]\n\
    \n\
   By default, both x86 and arm are build, no deploy is done \n"
  exit -1
}

function display_status(){
  host || true
  whoami
  pwd
  ls -al .
}

function update_rights(){
  # updating front rights
  docker-compose -f  docker/docker-compose.exec.yml run --user='root' --entrypoint chown node -R node:node .
  # updating back rights
  docker-compose -f  docker/docker-compose.exec.yml run --user='root' -w /home/node/app/back --entrypoint chown node -R node:node .
}


DEPLOY_SCRIPT=""
ARCH=""
while [[ $# -gt 0 ]]; do
  
  key="$1"
  shift

  case $key in
    -l|--localdeploy)
      DEPLOY_SCRIPT="package_local.sh";;
    -d|--distantdeploy)
      DEPLOY_SCRIPT="package_distant.sh";;
    --arm)
      ARCH="arm";;
    --x86)
      ARCH="x86";;
    *)
      call_error;;
  esac

done

SCRIPT_PATH=$(cd `dirname $0` && pwd)
cd ${SCRIPT_PATH}/..
update_rights
display_status
./npm-front install
./npm-back install
./npm-back run build 
./ng build --prod

# prepare any arch building
docker run --rm --privileged multiarch/qemu-user-static:register --reset

# build
function build(){
  TARGET_ARCH=$2
  cd ${SCRIPT_PATH}/..
  DOCKERFILE=docker/server/Dockerfile
  sed "s/FROM.*$/$1/" ${DOCKERFILE} > ${DOCKERFILE}.bis && mv ${DOCKERFILE}{.bis,}
  ARCH="-${TARGET_ARCH}" docker-compose -f docker/docker-compose.yml build
}

# Ruin deployment if needed
function deploy(){
  IMAGE=$(grep "image:" docker/docker-compose.yml|sed 's/ *image: //'|sed 's/\$.*$//')-$1
  cd ${SCRIPT_PATH}
  [ ! -z "$DEPLOY_SCRIPT" ] && eval "./$DEPLOY_SCRIPT $IMAGE"
}

# Check building specific arch or both
( [ "$ARCH" = "arm" ] || [ -z "$ARCH" ] ) && build "FROM hypriot\/rpi-node" "arm" && deploy "arm"
( [ "$ARCH" = "x86" ] || [ -z "$ARCH" ] ) && build "FROM node:8-jessie" "x86" && deploy "x86"


# Run deployment
