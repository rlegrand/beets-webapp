'use strict';

import path from 'path';
import { spawn } from 'child_process';
import yaml from 'js-yaml';
import fs from 'fs';
import { from, zip } from 'rxjs';
import { map, tap, toArray, toPromise, mergeMap, groupBy, reduce, filter, first } from 'rxjs/operators';

import myutils from './utils.js';

export class BeetsHelper{

  constructor(){
    this.init.bind(this);
    this.init();
  }

  // Init convention
  // classic function so it can be mocked
  init(){
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

  // Map the array of elements strings provided to an array of unique elements objects
  // parseDelimString(["a#b#c"],["a#b#d"] '#', ['first','second','third'], 'first') -> [{first:'a', second:'b', third:'c'}]
  parseDelimString= (toParse, delim, mapFields, unicityField) => 
    from( toParse )
    .pipe(
      mergeMap( (singleElt) => 
        from(singleElt.split(delim))
        .pipe(
          map( (subElt) => subElt.trim() ),
          reduce( (acc,current,index) => { acc[ (mapFields[index]) ] = current; return acc; },  {}  )
        )
      ),
      groupBy( (singleElt) => singleElt[unicityField] ),
      mergeMap( (group) =>  group.pipe( first() ) ),
      toArray()
    ).toPromise()

  // Map the array of songs strings provided to an array of unique songs objects
  parseSongsString = (songsString, delim) => this.parseDelimString(songsString, delim,['path','artist','album','title'], 'path' );

 
  // Map the array of artists strings provided to an array of unique artists objects
  getArtistsFromString = (artistsString, delim, mainField) =>  
    from( this.parseDelimString(artistsString, delim, ['name','addedDate','fields'], 'name' ) )
    .pipe( 
      mergeMap( (artistsArray) => from(artistsArray)  ),
      map( (artist) =>  { 
        artist.fields=[artist.fields]; 
        artist.mainField= mainField; 
        artist.addedDate= myutils.getDate(artist.addedDate);
        return artist; } ), 
      toArray() )
    .toPromise();
    
  beetsSongsRequest= (filter) => {
    let delim= '<#>';

    return this.beetRequest(['ls', '-f', `'$path${delim}$artist${delim}$album${delim}$title'`, filter])
      .then( (songs) => this.parseSongsString(songs,delim) );
  }


  beetsAlbumArtists= () => {
    let delim= '<#>';

    return this.beetRequest(['ls', '-a', 'added-', '-f', `'$albumartist${delim}$added${delim}albumartist'`])
      .then( (albumartist) => this.getArtistsFromString(albumartist,delim, 'albumartist') );
  }


  beetsArtists= () => {
    let delim= '<#>';

    return this.beetRequest(['ls', 'added-', "-f", `'$artist${delim}$added${delim}artist'`])
      .then( (artist) => this.getArtistsFromString(artist,delim, 'artist') );
  }

  beetsMixedArtists= () => {

    return zip( from( this.beetsAlbumArtists() ), from( this.beetsArtists() ) ) 
    .pipe( 
      mergeMap( ([albumsArtists, artists]) => albumsArtists.concat(artists) ),
      groupBy( artist => artist.name ),
      mergeMap( (group) => 
        group
        .pipe(
          reduce((accumulated, current) => { current.fields= [...accumulated.fields, ...current.fields]; return current;  }, {fields:[]} )
        )
      ),
      toArray(),
      map( (arr) => arr.sort( (a1,a2) => ( {true: -1, false: 1}[a1.name < a2.name] ) ) )
      )
      .toPromise();
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

