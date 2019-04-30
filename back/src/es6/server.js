'use strict';

import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import { BeetsHelper } from './beets';
import dbHelper from './db';
import { ArtistMetadata } from './metadata';



let defaultConfigCallback= function(appServer){
    appServer
    .use(bodyParser.json())
    .use(express.static('/app/front/beetswebapp/'));
}

export class StandaloneServer{

    constructor(configServerCallbak){
        this.configServerCallbak= configServerCallbak? configServerCallbak: defaultConfigCallback;
        this.beetsHelper= new BeetsHelper();
        this.server= this.initServer();
        this.artistMetaHelper= new ArtistMetadata();
    }


    buildBeetsApi= (appServer) => {

      appServer.post('/api/beets/songs', (req, res) => {

            let filter= req.body.beetsfilter;
            console.log(`Using beet filter ${filter}`);

            this.beetsHelper.beetsSongsRequest(filter)
            .then( (songs) => {
                res.send({songs: songs});
            })
            .catch( (err) => {
                console.error(err);
                res.send(err);
            });

        });


        appServer.post('/api/beets/albumartists', (req, res) => {

          console.log(`Retrieving all album artists`);
          
            this.beetsHelper.beetsAlbumArists()
            .then( (albumsArtists) => {
              return Promise.all( albumsArtists.map( (aa) =>
                this.artistMetaHelper.getArtistImageOnly(aa.name).toPromise()
                .then( (url) => {
                  aa.url= url;
                  aa.field= 'albumartist';
                  return aa;
                })
              ) );
            })
            .then( (albumArtists) => {
                res.send({data: albumArtists});
            })
            .catch( (err) => {
                console.error(err);
                res.send(err);
            });     

        });


        appServer.post('/api/beets/albums', (req, res) => {

            console.log(`Retrieving all albums`);

            this.beetsHelper.beetsAlbums()
            .then( (albums) => {
                res.send({data: albums});
            })
            .catch( (err) => {
                console.error(err);
                res.send(err);
            }); 

        });

        

    }

    initServer= () => {

        const appServer= express();
        this.configServerCallbak(appServer);

        const beetsConf= this.beetsHelper.getBeetsConfig();
        const logError= (err, req, res, next) => {
          console.error('error received');
          console.error(err.stack);
          next(err);
        }

        appServer
        .use(express.static(beetsConf.directory))
        .use(logErrors);

        this.buildBeetsApi(appServer);

        return http.createServer(appServer);
    }


    getServer= () => {
        return this.server;
    }


    run= (port) => {
        this.server.listen(port, function(){
            console.log(`server listening on ${port}`);
        });
    }

};


