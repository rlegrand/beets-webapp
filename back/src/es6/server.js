'use strict';

import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import { BeetsHelper } from './beets';
import dbHelper from './db';
import utils from './utils';
import { ArtistMetadata, AlbumMetadata } from './metadata';

import { zip, from, of } from 'rxjs';
import { identity, map, mergeMap, take, tap, toArray, concatAll } from 'rxjs/operators';

const logger= utils.getLogger();


let defaultConfigCallback= function(appServer){
    appServer
    .use(bodyParser.json())
    .use(express.static('/app/front/beetswebapp/'));
}

export class StandaloneServer{

    constructor(configServerCallbak){
        this.configServerCallbak= configServerCallbak? configServerCallbak: defaultConfigCallback;
        this.beetsHelper= BeetsHelper.getInstance();
        this.server= this.initServer();
        this.artistMetaHelper= new ArtistMetadata();
        this.albumMetaHelper= new AlbumMetadata();
    }


    buildBeetsApi= (appServer) => {

      appServer.post('/api/beets/songs', (req, res, next) => {

            let filter= req.body.beetsfilter;
            logger.debug(`Using beet filter ${filter}`);

            this.beetsHelper.beetsSongsRequest(filter)
            .then( (songs) => {
                res.send({songs: songs});
            })
            .catch( next );

        });



        appServer.post('/api/beets/artists', (req, res, next) => {

          logger.info(`Retrieving all artists and albumartists`);

          const artistsObs= from( this.beetsHelper.beetsMixedArtists() )
          .pipe(
              mergeMap((artists) => from(artists)),
              utils.onDevRx( this, take, 10 ),
              utils.onDevRx( this, tap, (artist) => logger.debug(`Treating artist ${artist.name}`) ),
              mergeMap((artist) => zip( of(artist), this.artistMetaHelper.getImageOnly(artist.name))),
              map( ([artist,url]) => {
                  artist.url= url; 
                  return artist;
                } ),
              toArray()
          ).toPromise()
          .then((artists) => {
            res.send({ data: artists });
          })
          .catch( next );

        });


        appServer.post('/api/beets/albums', (req, res, next) => {

          logger.info(`Retrieving all albums`);

          const artistsObs= from( this.beetsHelper.beetsAlbums() )
          .pipe(
              mergeMap((albums) => from(albums)),
              utils.onDevRx( this, take, 10 ),
              utils.onDevRx( this, tap, (album) => logger.debug(`Treating album ${album.name}`) ),
              mergeMap((album) => zip( of(album), this.albumMetaHelper.getImageOnly(album.name))),
              map( ([album,url]) => {
                  album.url= url; 
                  return album;
                } ),
              toArray()
          ).toPromise()
          .then((albums) => {
            res.send({ data: albums });
          })
          .catch( next );

        });

        

    }

  initServer = () => {

    const appServer = express();
    this.configServerCallbak(appServer);

    const beetsConf = this.beetsHelper.getBeetsConfig();

    const logError = (err, req, res, next) => {
      logger.error('middleware detected error');
      logger.error(err.stack);
      res.status(500).send({});
      next(err);
    }
    
    this.buildBeetsApi(appServer);

    appServer
      .use(express.static(beetsConf.directory))
      .use(logError);

    return http.createServer(appServer);
  }


  getServer = () => {
    return this.server;
  }


  run = (port) => {
    this.server.listen(port, function () {
      logger.info(`server listening on ${port}`);
    });
  }

};


