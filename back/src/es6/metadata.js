import axios from 'axios';
import { Observable, Subject, pipe, from, of, timer, iif, zip } from 'rxjs';
import {  tap, take, takeUntil, map, mergeScan, count, concat, delay, delayWhen,  defaultIfEmpty, distinctUntilChanged, toArray, flatMap, filter, first, catchError, subscribe } from 'rxjs/operators';

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
        this.log(`request starting: ${url}`),
        flatMap( (_) => from(axios.get(url, conf) ) ),
        this.log(`request complete: ${url}`),
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
      if (err.response && (err.response.status == 503 || err.response.status == 429 )) throw quotaExceeded;
      console.error( `An unexpected error occured` );
      return of(this.notFoundUrl);
    } )

  //search artist image on discogsz
  getFromDiscogs= (artistName, delay= 1000) => {
    const searchUri=`https://api.discogs.com/database/search?q=${artistName}&?type=artist&?artist=${artistName}`;
    const conf={ headers: {'User-Agent': 'BeetsWebapp', 'Authorization': 'Discogs token=xIFztFffPlHucUCxpNSybLPOmxnpEOBNQCfqWsdi' } }
    return this.http_get( searchUri, conf, delay )
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
        tap( (url) => {
          if ( url == "" ) throw `Image not found on discogs for ${artistName}` ;
          console.log (`Image found for ${artistName}: ${url}`);
        } ),
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
          console.log (`Image found for ${artistName}: ${url}`);
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
        this.log(`looking fo ${artistName}`),
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
            return of( { url: undefined, needToStore: false, rateExcceded: true} );
          }
          console.log(`Untrapped error`);
          throw err;
        } ), 
        tap( (data) => { if (data.needToStore)  this.storeToDb(artistName,data.url); } ),
        map( (data) => ( { artist: artistName, url: data.url, apiUsed: data.needToStore, rateExcceded: data.rateExcceded } ) )
      )


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
          console.log (`Image found for ${artistName}: ${url}`);
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
        this.log(`looking fo ${artistName}`),
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
            return of( { url: undefined, needToStore: false, rateExcceded: true} );
          }
          console.log(`Untrapped error`);
          throw err;
        } ), 
        tap( (data) => { if (data.needToStore)  this.storeToDb(artistName,data.url); } ),
        map( (data) => ( { artist: artistName, url: data.url, apiUsed: data.needToStore, rateExcceded: data.rateExcceded } ) )
      )


  // "Public like" methods

  // Get a single image url
  getArtistImageOnly= (artistName,delay=0) =>
    this.getArtistImage(artistName, delay)
    .pipe( map( (data) => data.url ) )

  // Get artists from beets, search their images and store them
  store= (unitDelay= 1000, parallelism= 1, maxartists= -1) => {
	
    const triggEndStream = new Subject();
