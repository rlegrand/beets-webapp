'use strict';

import path from 'path';
import { spawn } from 'child_process';
import yaml from 'js-yaml';
import fs from 'fs';

export class BeetsHelper{

  constructor(){
    this.beetsConfPath= '/app/beets/config/config.yaml';
    this.beetsConf = yaml.safeLoad(fs.readFileSync(this.beetsConfPath, 'utf8'));
    this.rememberDateConf();
  }
  
  beetRequest = (args) => {

    return new Promise( (resolve, reject) => {

        let updatedArgs= ['-c', this.beetsConfPath, ...args];

        console.log( `Beets args: ${ updatedArgs.join(' ')}` );

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


  beetsSongsRequest= (filter) => {

    let delim= '<#>',
      args= ['ls', '-f', `'$path ${delim} $artist ${delim} $album ${delim} $title'`, filter];

    return this.beetRequest(args)
      .then( (data) => {

        return data.map( (elt, idx) => {

          let delimedElt= elt.split(delim)
            .map( (elt, idx) => elt.trim() );

          let res=  {
            path: delimedElt[0].substring( this.getBeetsConfig().directory.length ),
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

  beetsAlbumArists= () => {
    let delim= '<#>';

    let artists= [];

    return this.beetRequest(['ls', '-a', 'added-', '-f', `'$albumartist ${delim} $added'`])
      .then( (data) => {
        return data.map( (elt, idx) => {

          let delimedElt= elt.split(delim)
            .map( (elt, idx) => elt.trim() );

          return {
            name: delimedElt[0],
            addedDate: delimedElt[1]
          }

        })
          .filter( (elt, idx) => {
            const keep= ( artists.indexOf(elt.name) == -1 );
            if (keep){
              artists.push(elt.name);
              return true;
            }
            return false;
          } )
      } );

  }


  beetsArists= () => {

    return this.beetRequest(['ls', '-af', "'$albumartist'"])
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


  beetsAlbums= () => {

    return this.beetRequest(['ls', '-af', "'$album'"])
      .then( (data) => {

        let res= data.sort( (w1, w2) => {
          let w1l= w1.toLowerCase();
          let w2l= w2.toLowerCase();
          if (w1l < w2l) return -1;
          if (w1l > w2l) return 1;
          return 0;
        } );

        return res.map( (elt, idx) =>{ return {name: elt}; } );;
      } );

  }

  getBeetsConfig= () => this.beetsConf

  getLastModificationDate= () => new Promise( (resolve, reject) =>  fs.stat( this.beetsConfPath, (err,resp) => { if (err) reject(err); resolve(resp.mtimt); } ) )
  rememberDateConf= () => this.savedModificationDate= this.getLastModificationDate()
  confChanged= () => Promise.all( [ this.getLastModificationDate(), this.savedModificationDate ] ).then( ([lastModif,savedModif]) => lastModif > savedModif )


}

