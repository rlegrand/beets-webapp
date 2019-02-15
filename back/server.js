'use strict';

let express = require('express'),
    http = require('http'),
    bodyParser= require('body-parser'),
    path= require('path'),
    fs= require('fs'),
    spawn= require('child_process').spawn,
    yaml= require('js-yaml');


let defaultConfigCallback= function(appServer){
    appServer
    .use(bodyParser.json())
    .use(express.static('/app/front/beetswebapp/'));
}


class StandaloneServer{

    constructor(configServerCallbak){
        this.configServerCallbak= configServerCallbak? configServerCallbak: defaultConfigCallback;
        this.server= this.initServer();
    }


    buildBeetsApi(appServer){

        let that= this;


        let beetRequest = function(args){

            return new Promise(
                function(resolve, reject){

                    let updatedArgs= ['-c', that.getBeetsConfigPath()].concat(args);

                    let beet= spawn('beet', updatedArgs, {shell:true});

                    let res= '';

                    beet.stdout.on('data', (data) => {
                        let dataStr= data.toString();
                        //console.log('data retrieved:');
                        //console.log(dataStr);
                        res+= dataStr;
                    });


                    beet.on('close', (code) => {
                        resolve(
                            res.split('\n')
                            .filter( (elt, idx) => elt && elt.trim().length > 0 )
                        );
                    });

                }
            );

        }


        let beetsSongsRequest= function(filter){

            let delim= '<#>',
                args= ['ls', '-f', `'$path ${delim} $artist ${delim} $album ${delim} $title'`, filter];

            return beetRequest(args)
            .then( (data) => {

                return data.map( (elt, idx) => {

                    let delimedElt= elt.split(delim)
                    .map( (elt, idx) => elt.trim() );

                    let res=  {
                        path: delimedElt[0].substring( that.getBeetsConfig().directory.length ),
                        artist: delimedElt[1],
                        album: delimedElt[2],
                        title: delimedElt[3]
                    }
                    // console.log('data returned:');
                    // console.log(res);
                    return res;
                });

            } );

        }

        // Not used anymore - sort by name example
        /*
        let beetsAlbumArists= function(){

            return beetRequest(['ls', '-af', `'$albumartist'`])
            .then( (data) => {
                return data.sort( (w1, w2) => {
                    let w1l= w1.toLowerCase();
                    let w2l= w2.toLowerCase();
                    if (w1l < w2l) return -1;
                    if (w1l > w2l) return 1;
                    return 0;
                } )
                .filter( (elt, idx, self) => idx == self.indexOf(elt) );
            } );

        }*/

        let beetsAlbumArists= function(){
            let delim= '<#>';

            let artists= [];

            return beetRequest(['ls', '-a', 'added-', '-f', `'$albumartist ${delim} $added'`])
            .then( (data) => {
                return data.map( (elt, idx) => {

                    let delimedElt= elt.split(delim)
                    .map( (elt, idx) => elt.trim() );

                    return {
                        albumartist: delimedElt[0],
                        addedDate: delimedElt[1]
                    }

                })
                .filter( (elt, idx) => {
                    const keep= ( artists.indexOf(elt.albumartist) == -1 );
                    if (keep){
                        artists.push(elt.albumartist);
                        return true;
                    }
                    return false;
                } )
            } );

        }


        let beetsArists= function(){

            return beetRequest(['ls', '-af', "'$albumartist'"])
            .then( (data) => {
                return data.sort( (w1, w2) => {
                    let w1l= w1.toLowerCase();
                    let w2l= w2.toLowerCase();
                    if (w1l < w2l) return -1;
                    if (w1l > w2l) return 1;
                    return 0;
                } )
                .filter( (elt, idx, self) => idx == self.indexOf(elt) );
            } );

        }


        let beetsAlbums= function(){

            return beetRequest(['ls', '-af', "'$album'"])
            .then( (data) => {

                let res= data.sort( (w1, w2) => {
                    let w1l= w1.toLowerCase();
                    let w2l= w2.toLowerCase();
                    if (w1l < w2l) return -1;
                    if (w1l > w2l) return 1;
                    return 0;
                } );

                return res.map( (elt, idx) =>{ return {album: elt}; } );;
            } );

        }


        appServer.post('/api/beets/songs', function(req, res){

            let filter= req.body.beetsfilter;
            console.log(`Using beet filter ${filter}`);

            beetsSongsRequest(filter)
            .then( (songs) => {
                res.send({songs: songs});
            })
            .catch( (err) => {
                console.error(err);
                res.send(err);
            });

        });


        appServer.post('/api/beets/albumartists', function(req, res){

            console.log(`Retrieving all album artists`);

            beetsAlbumArists()
            .then( (albumArtists) => {
                res.send({data: albumArtists});
            })
            .catch( (err) => {
                console.error(err);
                res.send(err);
            });     

        });


        appServer.post('/api/beets/albums', function(req, res){

            console.log(`Retrieving all albums`);

            beetsAlbums()
            .then( (albums) => {
                res.send({data: albums});
            })
            .catch( (err) => {
                console.error(err);
                res.send(err);
            }); 

        });         

            


    }

    getBeetsConfigPath(){
        if (!this.beetsConfPath){
            this.beetsConfPath= '/app/beets/config/config.yaml';
        }
        return this.beetsConfPath;
    }


    getBeetsConfig(){
        if (!this.beetsConf){
            this.beetsConf= yaml.safeLoad(fs.readFileSync(this.getBeetsConfigPath(), 'utf8'));
        }

        return this.beetsConf;
    }



    initServer(){

        let that= this;

        const appServer= express();
        that.configServerCallbak(appServer);

        const beetsConf= that.getBeetsConfig();
        appServer.use(express.static(beetsConf.directory));

        this.buildBeetsApi(appServer);

        return http.createServer(appServer);
    }


    getServer(){
        return this.server;
    }


    run(port){

        let that= this;
        that.server.listen(port, function(){
            console.log(`server listening on ${port}`);
        });
    }

};


new StandaloneServer().run(80);
