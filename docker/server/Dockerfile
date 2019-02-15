FROM node:8.11.3-jessie

MAINTAINER legrand.regis@gmail.com

ENV dockerfile_parent_path /docker/server/

# --- add beets conf

RUN mkdir -p /app/front /app/back /app/beets/directory /app/beets/lib /app/beets/config

WORKDIR /app/beets
COPY ${dockerfile_parent_path}/to_add/config.yaml ./config/
COPY ${dockerfile_parent_path}/to_add/beets-library.blb ./lib/

# --- install beets

RUN  apt-get update && \
apt-get install -y python3-dev python3-pip && \
pip3 install beets

# -- retrieve front/back devs

WORKDIR /app
COPY back/ back/
COPY front/dist/ front/

WORKDIR back/

CMD ["node","server"]

