# Summary

Minimal webapp to serve your [beets](http://beets.io/) library.
The webapp will evolve from time to time, actually it allows to make your own beet requests, and give you access to some predefined lists such as "albums, artists, last added albums".

# Use it

## Prepare

    mkdir -p ~/bwa/ && cd ~/bwa
    curl -o docker-compose.yml  https://raw.githubusercontent.com/rlegrand/beets-webapp/master/docker/docker-compose.prod.yml

Edit the following in **docker-compose.yml** (read comments):
* replace ${ARCH} by "x86" or "arm" depending on your machine architecture
* \<path to beets yaml config\>
* \<path to beets library file\>
* \<path to the beets music folder\>

## Start

Go to the app folder
    cd ~/bwa
    
On first use only, Generate metadata and wait this complete ( Artists/Albums images urls are retrieved from discogs/muscbrainz)

    ACTION=genmetadata docker-compose up

To start the server

    docker-compose up -d

To stop the server

    docker-compose down

# Developpers

## Build images

Run [packaging/build.sh](./packaging/build.sh) to build everything needed:

    ./packaging/build.sh --help
    age: ./packaging/build.sh [--localdeploy] [--distantdeploy] [--arm] [--x86]

       By default, both x86 and arm images are build, no deploy is done

--distantdeploy will deploy the image on github and is adapted for CI building
--localdeploy will generate a package that you can then retrieve on an other machine, untar, and run

## Development

First build images locally:

    # x86
    ./packaging/build.sh -x86
    # arm
    ./packaging/build.sh -arm

Then run the app:
    
    # x86
    ./rundev.sh
    # arm
    ARCH=arm ./rundev.sh
    # rundev can use args to specify the action, the default action is *server*, available actions are: server,genmetadata
    ./rundev.sh genmetadata

And go to [http://localhost](http://localhost)

## Screenshots

![alt text](https://rlegrand.github.io/beets-webapp/images/screenshot1.png)
