'use strict';

import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import { BeetsHelper } from './beets';


let defaultConfigCallback= function(appServer){
    appServer
    .use(bodyParser.json())
    .use(express.static('/app/front/beetswebapp/'));
}

export class StandaloneServer{

    constructor(configServerCallbak){
        this.configServerCallbak= configServerCallbak? configServerCallbak: defaultConfigCallback;
        this.server= this.initServer();
        this.beetsHelper= new BeetsHelper();
        console.log(beetsHelper);
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
        appServer.use(express.static(beetsConf.directory));

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


