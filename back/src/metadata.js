import axios from 'axios';
import { Observable, pipe, from, of, range, interval, iif, zip } from 'rxjs';
import { tap, take, map, count, concat,  delay, defaultIfEmpty, flatMap, filter, first, catchError, subscribe } from 'rxjs/operators';

import { dbHelper } from './db';
import { BeetsHelper } from './beets';


const artistNotStored= { name: "ArtistNotStored", message: "Artist not found locally" }

export class ArtistMetadata{


  constructor(){
    this.beetsHelper= new BeetsHelper();
    this.dbHelper= dbHelper;
    this.ignoredArtists= of('Soundtrack','Various Artists');
  }

  http_get= (url, conf={}) => 
    from( axios.get(url, conf) )
      .pipe(
        map( (response) => of(response.data).pipe( delay(1000) ) ),
        concatAll()
      )

  getFromDB= (artistName) =>
    from(this.dbHelper.getArtistUrl("nonexist"))
      .pipe( 
        tap( (url) => {
          if (!url) throw artistNotStored ;
        } )
      )

  storeToDb= (artistName, url) =>
    from(this.dbHelper.addArtistUrl(artistName, url))

  getFromDiscogs= (artistName) => {
    const searchUri=`https://api.discogs.com/database/search?q=${artistName}&?type=artist&?artist=${artistName}`;
    const conf={ headers: {'User-Agent': 'BeetsWebapp', 'Authorization': 'Discogs token=xIFztFffPlHucUCxpNSybLPOmxnpEOBNQCfqWsdi' } }
    return this.http_get( searchUri, conf )
      .pipe(
        // restrieving results field
        flatMap( (response) => from(response.results) ),
        // take first result
        first(),
        // retrieve cover_image of the result
        map( (result) => result.cover_image ),
        // default url if no result,
        defaultIfEmpty( "" ),
        // do some logs
        tap( (url) => { if ( url == "" ) console.log(`Image not found on musicbrainz for ${artistName}`) } ),
        catchError( (error) => {
          console.error(error);
          return of("empty");
        })
      );
  }

  getFromMsuicbrainz= (artistName) => {

    let idUri= encodeURI(`http://musicbrainz.org/ws/2/artist/?query=artist:${artistName}&fmt=json`);
    const conf={ headers: {'User-Agent': 'BeetsWebapp' } }

    return this.http_get(idUri, conf)
      .pipe( 
        flatMap( (response) => {
          const artists= response.artists;
          if (!artists || artists.length == 0){
            throw "no artist found";
          }
          const artistId= artists[0].id;
          const dataUri= encodeURI( `http://musicbrainz.org/ws/2/artist/${artistId}?inc=url-rels&fmt=json` );
          return this.http_get(dataUri, conf);
        } ),
        // get stream of relations
        flatMap( (response) => from(response.relations) ),
        // get stream of resources
        map( ( relation ) => relation.url.resource ),
        // retrieve wikimedia urls only
        filter( (urlResource) => urlResource.match(/wikimedia.+File:/ ) ),
        // retrieve filename from url
        map( (urlResource) => urlResource.match(/wikimedia.+File:(.*)/)[1] ),
        // retrieve url pointing to filename
        map( (fileName) => `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}?width=200` ),
        // default value if artist not found
        defaultIfEmpty( "" ),
        // get the first one in case serveral images found
        first(),
        // do some logs
        tap( (url) => { if ( url == "" ) console.log(`Image not found on musicbrainz for ${artistName}`) } ),
        catchError( (error) => {
          console.error(error);
          return of("empty");
        }));

  }
  
  ignoreArtists= (artistName) =>
    this.ignoredArtists
      .pipe( 
        count( (iartist) => iartist == artistName ) ,
        map( (count) => count > 0 )
      );

  getArtistImage= (artistName) => 
    this.ignoreArtists(artistName)
      .pipe(
        flatMap( (shouldIgnore) => 
          iif( () => shouldIgnore, 
            of({url:"/assets/unknown.jpg",needToStore:false}), 
            this.getFromDB(artistName).map( (url) => ({url:url,needToStore:false}) ) )
        ),
        catchError(  (err) => {
          if ( err.name == artistNotStored.name ) return of({url:"",needToStore:true});
          else throw err;
        }),
        flatMap( (data) => 
          iif( () => data.url != "", 
            of(data), 
            this.getFromDiscogs(artistName)
            .pipe( map( (url) => ( {url:url, needToStore: true} )  ) ))
        ),
        flatMap( (data) => 
          iif( () => data.url != "", 
            of(data), 
            this.getFromMsuicbrainz(artistName)
            .pipe( map( (url) => ({url: url, needToStore: true})  ) ))
        ),
        tap( (data) => { if (data.needToStore)  this.storeToDb(artistNotStored,url); } )
      )


  store= () => {
    const albumArtists= this.beetsHelper.beetsAlbumArists();
    return zip(
      from(albumArtists),
      range(0, albumArtists.length)
    ).pipe(
      flatMap( ([artist,index]) =>
        zip(
          of( artist ),
          getArtistImage( artist ),
          of( index )
        )
      ),
      map( ([artist,image,idx]) => ({artist:artist,image:image,index:idx}) )
    )
  }

}


/*
const levenshtein = (a, b) => {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  let tmp, i, j, prev, val, row
  // swap to save some memory O(min(a,b)) instead of O(a)
  if (a.length > b.length) {
    tmp = a
    a = b
    b = tmp
  }

  row = Array(a.length + 1)
  // init the row
  for (i = 0; i <= a.length; i++) {
    row[i] = i
  }

  // fill in the rest
  for (i = 1; i <= b.length; i++) {
    prev = i
    for (j = 1; j <= a.length; j++) {
      if (b[i-1] === a[j-1]) {
        val = row[j-1] // match
      } else {
        val = Math.min(row[j-1] + 1, // substitution
              Math.min(prev + 1,     // insertion
                       row[j] + 1))  // deletion
      }
      row[j - 1] = prev
      prev = val
    }
    row[a.length] = prev
  }
  return row[a.length]
}

*/


