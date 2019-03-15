# Summary

Minimal webapp to serve your [beets](http://beets.io/) library.
The webapp will evolve from time to time, actually it allows to make your own beet requests, and give you access to some predefined lists such as "albums, artists, last added albums".

# Use it

## Usage
On arm architectures:

    docker run --rm -p 80:80 -v </path/to/beetsconf>:/app/beets/config/config.yaml -v </path/to/lib>:</path/to/lib> -v </path/to/directory>:</path/to/directory> rlegrand/beets-webapp-arm [action]
    
On x86 architectures

    docker run --rm -p 80:80 -v </path/to/beetsconf>:/app/beets/config/config.yaml -v </path/to/lib>:</path/to/lib> -v </path/to/directory>:</path/to/directory> rlegrand/beets-webapp-x86 [action]

Where:
* </path/to/beetsconf>
  * is the beets yaml config file ( installed here by default ~/.config/beets/config.yaml t)
* </path/to/lib> is the path to the beets library file
  * by default, it's on the same place than your config file and named library.db
  * otherwise you modified it in your conf, so retrieve it by running "grep library /your/beets/config.yml"
* </path/to/directory>
  * The path to the beets directory which contains your music
  * by default, it's $HOME/Music
  * otherwise you modified it in your conf, so retrieve it by running "grep directory /your/beets/config.yml"
* [action]
  * is not mandatory and by default maps to *server*
  * Other possible values are: genmetadata

## Start

Create an allias which fits your needs

    alias bwa=docker run --rm -p 80:80 -v </path/to/beetsconf>:/app/beets/config/config.yaml -v </path/to/lib>:</path/to/lib> -v </path/to/directory>:</path/to/directory> rlegrand/beets-webapp-x86

Generate metadata: Artists/Albums images will be retrieved in the webapp, but is a slow operation, so it's suggested to do it once before launching the server the first time

    bwa genmetadata

Then you're good to go, launch the server

    bwa

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

