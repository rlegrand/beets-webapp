import axios from 'axios';
import { Observable, Subject, pipe, from, of, timer, iif, zip, empty } from 'rxjs';
import {  tap, take, takeUntil, map, mergeScan, count, concat, delay, delayWhen,  defaultIfEmpty, distinctUntilChanged, toArray, flatMap, filter, first, catchError, subscribe, mergeMap } from 'rxjs/operators';

import dbHelper from './db';
import { BeetsHelper } from './beets';





const artistNotStored= { name: "ArtistNotStored", message: "Artist not found locally" }
const quotaExceeded= { name: "ArtistNotStored", message: "Artist not found locally" }

export class ArtistMetadata{


  constructor(){
    this.beetsHelper= new BeetsHelper();
    this.dbHelper= dbHelper;
    this.ignoredArtists= of('Soundtrack','Various Artists');
    this.notFoundUrl="/assets/unknown.jpg";
	this.configureAxios();
  }

  configureAxios= () => {

	axios.interceptors.request.use(
		(config) => {
		  config.metadata = { startTime: new Date()}
		  return config;
		}, 
		(error) => Promise.reject(error)
		);

	axios.interceptors.response.use(
		(response) => {
		  response.config.metadata.endTime = new Date()
			response.duration = response.config.metadata.endTime - response.config.metadata.startTime
			return response;
		},(error) => {
		  error.config.metadata.endTime = new Date();
		  error.duration = error.config.metadata.endTime - error.config.metadata.startTime;
		  return Promise.reject(error);
		}
	);
  }

  // http get
  http_get= (url, conf={}, wait= 1000) => 
    of(1)
      .pipe(
        //this.log(`request starting: ${url}`),
        flatMap( (_) => from(axios.get(url, conf) ) ),
        //this.log(`request complete: ${url}`),
        map( (response) => ({responseData: response.data, wait:Math.max(0, wait - response.duration) }) ),
        delayWhen( (data) => timer( data.wait ) ),
        map( (data) => data.responseData )
      )

  log= (message) => tap( (_) => console.log(message)  )

  // get image url from db
  getFromDB= (artistName) =>
    from(this.dbHelper.getArtistUrl(artistName))
      .pipe( 
        tap( (url) => {
          if (!url) throw artistNotStored ;
        } )
      )

  // add image url to db
  storeToDb= (artistName, url) =>
    from(this.dbHelper.addArtistUrl(artistName, url))

  // default image when image not found
  errorImage= () => 
    catchError( ( err ) => {
      //console.error( err );
      if (err.response && (err.response.status == 503 || err.response.status == 429 )) throw quotaExceeded;
      console.error( `An unexpected error occured, relpacing by notFound url` );
      return of(this.notFoundUrl);
    } )

  // Some images can safely be ignored
  ignoreFromDiscogs= ()  => {

    const contains= (image) =>  
      from([/spacer.gif$/])
        .pipe(
          count((ignoredImage) => image.match(ignoredImage)),
          map((nbImgs) => (nbImgs > 0)),
          //tap( (doesContain)  => console.log(`ignore ${image} ? ${doesContain}`) )
        )
    
    return [
      //tap( (image) => console.log(`should check ${image}`) ),
      flatMap( (image) => zip( of(image), contains(image) ) ),
      flatMap(([image,ignoreImage]) => iif(() => ignoreImage, empty(), of(image)))
    ];

  }

  //search artist image on discogsz
  getFromDiscogs= (artistName, delay= 1000) => {
    const searchUri=`https://api.discogs.com/database/search?q=${artistName}&?type=artist&?artist=${artistName}`;
    const conf={ headers: {'User-Agent': 'BeetsWebapp', 'Authorization': 'Discogs token=xIFztFffPlHucUCxpNSybLPOmxnpEOBNQCfqWsdi' } }
    return this.http_get( searchUri, conf, delay )
      .pipe(
        // restrieving results field
        flatMap( (response) => from(response.results) ),
        // default url if no result,
        defaultIfEmpty( "" ),
        // do some logs
        tap( (result) => {
          if ( result == "" ) throw `Image not found on discogs for ${artistName}` ;
        } ),        
        // take first result
        first(),
        // retrieve cover_image of the result
        map( (result) => result.cover_image ),
        tap( (url) => console.log (`Image found for ${artistName}: ${url}`) ),
        // replace current image by empty if it's part of images to ignore
        ...this.ignoreFromDiscogs(),
        this.errorImage()
      );
  }

  //search artist image on musicbrainz
  getFromMsuicbrainz= (artistName, delay= 1000) => {

    let idUri= encodeURI(`http://musicbrainz.org/ws/2/artist/?query=artist:${artistName}&fmt=json`);
    const conf={ headers: {'User-Agent': 'BeetsWebapp' } }

    return this.http_get(idUri, conf, delay)
      .pipe( 
        flatMap( (response) => {
          const artists= response.artists;
          if (!artists || artists.length == 0){
            throw "no artist found";
          }
          const artistId= artists[0].id;
          const dataUri= encodeURI( `http://musicbrainz.org/ws/2/artist/${artistId}?inc=url-rels&fmt=json` );
          return this.http_get(dataUri, conf, delay);
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
        tap( (url) => {
          if ( url == "" ) throw `Image not found on musicbrainzfor ${artistName}` ;
          //console.log (`Image found for ${artistName}: ${url}`);
        } ),
        this.errorImage()
      );

  }
  
  // Ignore some artists values which doesn't make sense
  ignoreArtists= (artistName) =>
    this.ignoredArtists
      .pipe( 
        count( (iartist) => iartist == artistName ) ,
        map( (count) => count > 0 )
      );

  // Search image on db, and if not found on discogs and musicbrainz
  getArtistImage= (artistName,delay= 1000) => 
    this.ignoreArtists(artistName)
      .pipe(
        flatMap( (shouldIgnore) => 
          iif( () => shouldIgnore, 
            of({url: this.notFoundUrl, needToStore:false, rateExcceded: false}), 
            this.getFromDB(artistName).pipe( map( (url) => ({url:url,needToStore:false, rateExcceded: false}) ) ) )
        ),
        catchError(  (err) => {
          if ( err.name == artistNotStored.name ) return of({url:undefined, needToStore:true, rateExcceded: false});
          else throw err;
        }),
        //this.log(`looking for ${artistName}`),
        flatMap( (data) => 
          // data comes from DB, keep data as it
          iif( () => !data.needToStore, 
            of(data), 
            // otherwise get it from music brainz
            this.getFromDiscogs(artistName, delay)
            .pipe( map( (url) => ( {url:url, needToStore: true, rateExcceded: false } )  ) ))
        ),
        flatMap( (data) => 
          // data comes from DB or url retrieved previously, keep data as it
          iif( () => !data.needToStore || ( data.url != this.notFoundUrl) , 
            of(data), 
            // otherwise get it from music brainz
            this.getFromMsuicbrainz(artistName, delay)
            .pipe( map( (url) => ({url: url, needToStore: true, rateExcceded: false})  ) ))
        ),
        catchError( (err) => {
          if (err == quotaExceeded){
            console.log('quota exceeded detected');
            return of( { url: undefined, needToStore: false, rateExcceded: true} );
          }
          console.log(`Untrapped error`);
          console.log(err);
          throw err;
        } ), 
        tap( (data) => { if (data.needToStore)  this.storeToDb(artistName,data.url); } ),
        map( (data) => ( { artist: artistName, url: data.url, apiUsed: data.needToStore, rateExcceded: data.rateExcceded } ) )
      )


  // "Public like" methods

  // Get a single image url
  getArtistImageOnly= (artistName,delay=0) =>
    this.getArtistImage(artistName, delay)
    .pipe( 
      map( (data) => data.url ),
      tap( (url) => console.log(`Img for ${artistName}: ${url}` ) )
    )

  // Get artists from beets, search their images and store them
  store= (unitDelay= 1000, parallelism= 1, maxartists= -1) => {
	
    const triggEndStream = new Subject();

    const allartists= from( this.beetsHelper.beetsMixedArtists() )
      .pipe( 
        mergeMap( (artists) => from(artists)),
        map( (artist) => artist.name ),
        takeUntil( triggEndStream ),
        map( (artist,index) => [artist,index] ),
        tap( ([artist,index]) => { 
          if ( (maxartists != -1) &&  (index  >= maxartists) ){
            triggEndStream.next(0);
            triggEndStream.complete();
          }
        }),
        map( ([artist,index]) => artist )
      );
      
      /*  
      .pipe( 
        flatMap( (artistsArray) => from(artistsArray) ),
        map( (artistData) => artistData.name  ),
        concat( 
          from( this.beetsHelper.beetsArtists() )
          .pipe( flatMap( (artistsArray) => from(artistsArray) ) ) 
          .pipe( map( (artistsData) => artistData.name ) ) 
        ),
        toArray(),
        flatMap( (allArtistsArray) => from(allArtistsArray.sort()) ),
        distinctUntilChanged(),
        filter( (artist) => artist.trim().length > 0 ),
        takeUntil( triggEndStream ),
        map( (artist,index) => [artist,index] ),
        tap( ([artist,index]) => { 
          if ( (maxartists != -1) &&  (index  >= maxartists) ){
            triggEndStream.next(0);
            triggEndStream.complete();
          }
        }),
        map( ([artist,index]) => artist )
      );*/
    
    let nbArtists= 0;
    const storeOne= (artistsStream) => { 
      return artistsStream.pipe(
        tap( (_) => nbArtists++ ),
        mergeScan( (acc,current) => {
          const delay= acc.rateExcceded ? 2 * unitDelay : unitDelay;
          return this.getArtistImage(current, delay);
        }, { rateExcceded: false}, parallelism),
        filter( (data) => data.rateExcceded ),
        map( (data) => data.artist ) 
      );
    }
      

    const storeRec= (artistsStream) =>       
      Observable.create( (observer) => 
        storeOne( artistsStream )
          .pipe( toArray() )
          .subscribe( (failedArtists) => {
            const previousNbArtists= nbArtists;
            const remainingNbArtists= failedArtists.length;
            nbArtists= 0;
            console.log( `Summary iteration: 
            -> total artist tried: ${previousNbArtists} 
            -> remaining artists: ${remainingNbArtists} 
            `);
            if ( remainingNbArtists == 0 ) observer.complete();
            else storeRec( of(1).pipe( delay(10000), mergeMap( (_) => from(failedArtists) ) ) )
            .subscribe( 
              (_) => undefined, //next
              (_) => undefined, //err
              () => observer.complete()
            );
          })
      );

    return storeRec( allartists );
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


