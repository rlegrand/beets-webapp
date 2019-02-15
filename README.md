# Summary

Minimal webapp to serve your [beets](http://beets.io/) library.
The webapp will evolve from time to time, actually it allows to make your own beet requests, and give you access to some predefined lists such as "albums, artists, last added albums".

# Use it

On arm architectures:
    docker run --rm -p 80:80 -v </path/to/beetsconf>:/app/beets/config/config.yaml -v </path/to/lib>:</path/to/lib> -v </path/to/directory>:</path/to/directory> beets-webapp-arm
On x86 architectures
    docker run --rm -p 80:80 -v </path/to/beetsconf>:/app/beets/config/config.yaml -v </path/to/lib>:</path/to/lib> -v </path/to/directory>:</path/to/directory> beets-webapp-x86

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

# Developpers

## Build image

Run (packaging/build.sh) to build the image
    ./packaging/build.sh --help
    age: ./packaging/build.sh [--localdeploy] [--distantdeploy] [--arm] [--x86]

       By default, both x86 and arm are build, no deploy is done   

--distantdeploy will deploy the image on github and is adapted for CI building
--localdeploy will generate a package that you can then retrieve on an other machine, untar, and run

## Development

	docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml build
    ./rundev.sh

Launch your [browser](http://localhost:80)

