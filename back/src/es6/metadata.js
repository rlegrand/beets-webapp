import axios from 'axios';
import { Observable, Subject, pipe, from, of, timer, iif, zip, empty } from 'rxjs';
import {  tap, take, takeUntil, map, mergeScan, count, concat, delay, delayWhen,  defaultIfEmpty, distinctUntilChanged, toArray, flatMap, filter, first, catchError, subscribe, mergeMap } from 'rxjs/operators';

import DbHelper from './db';
import { BeetsHelper } from './beets';
import utils from './utils';
const logger= utils.getLogger();


const entityNotStored= { name: "EntityNotStored", message: "Artist not found locally" };
const quotaExceeded= { name: "QuotaExceeded", message: "Quota Exceeded" };


export class EntityMetadata{

  constructor(){

    // abstract
    if ( new.target  == EntityMetadata ){
      throw new TypeError("Abstract instance can't be instanciated");
    }

   
  }

  init() {

    // methods to implement
    const methodsToImpl= ['getIgnoredEntities', 'getFromDB', 'storeToDb', 'discOgsImage','musicbrainzImage'];
    methodsToImpl.forEach( (m) => {
      if (this[m] === undefined) {
        throw new TypeError(`Method ${m} should be implemented`);
      }
    } );

    this.beetsHelper= BeetsHelper.getInstance();
    this.dbHelper= DbHelper.get();
    this.ignoredEntities=  this.getIgnoredEntities();
    this.notFoundUrl= this.getNotFoundUri();
    this.configureAxios();

    return this;
  } 

  configureAxios = () => {

    axios.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: new Date() }
        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => {
        response.config.metadata.endTime = new Date()
        response.duration = response.config.metadata.endTime - response.config.metadata.startTime
        return response;
      }, (error) => {
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

  log= (message) => tap( (_) => logger.info(message)  )


  // default image when image not found
  errorImage= () => 
    catchError( ( err ) => {
      if (err.response && (err.response.status == 503 || err.response.status == 429 )) throw quotaExceeded;
      logger.error(err);
      logger.error( `An unexpected error occured, relpacing by notFound url` );
      return of(this.notFoundUrl);
    } )

  // Some images can safely be ignored
  ignoreFromDiscogs= ()  => {

    const contains= (image) =>  
      from([/spacer.gif$/])
        .pipe(
          count((ignoredImage) => image.match(ignoredImage)),
          map((nbImgs) => (nbImgs > 0)),
        )
    
    return [
      flatMap( (image) => zip( of(image), contains(image) ) ),
      flatMap(([image,ignoreImage]) => iif(() => ignoreImage, of(this.notFoundUrl), of(image)))
    ];

  }

  //search artist image on discogsz
  getFromDiscogs= (entity, delay= 1000) => 
    this.discOgsImage(entity, delay)
    .pipe(
        // replace current image by empty if it's part of images to ignore
        ...this.ignoreFromDiscogs(),
        this.errorImage()
    );


  //search artist image on musicbrainz
  getFromMsuicbrainz= (artistName, delay= 1000) => 
    this.musicbrainzImage()
    .pipe(
        this.errorImage()
    );
  
  // Ignore some artists values which doesn't make sense
  ignoreEntities= (entityName) =>
    this.ignoredEntities
      .pipe( 
        count( (ientity) => ientity.trim() == entityName.trim() ) ,
        map( (count) => count > 0 )
      );

  // Search image on db, and if not found on discogs and musicbrainz
  getImage= (entityName,delay= 1000, useDbOnly=false) => {
      const entitiesFromDb= this.ignoreEntities(entityName)
      .pipe(
        flatMap( (shouldIgnore) => 
          iif( () => shouldIgnore, 
            of({url: this.notFoundUrl, needToStore:false, rateExcceded: false}), 
            this.getFromDB(entityName)
            .pipe(
              utils.onDevRx(this, tap, (url) => logger.debug(`Url retrieved: ${url}`)),
              map( (url) => ({url:url,needToStore:false, rateExcceded: false}) ) ) )
        ),
        catchError(  (err) => {
          logger.error(`Entity not found ${entityName}`);
          if ( err.name == entityNotStored.name ) return of({url:undefined, needToStore:true, rateExcceded: false});
          else throw err;
        }));
        
        // Dont search image with APIs
        if (useDbOnly){
          return entitiesFromDb;
        }
        
        return entitiesFromDb.pipe(
        //this.log(`looking for ${artistName}`),
        flatMap( (data) => 
          // data comes from DB, keep data as it
          iif( () => !data.needToStore, 
            of(data), 
            // otherwise get it from music brainz
            this.getFromDiscogs(entityName, delay)
            .pipe( 
              map( (url) => ( {url:url, needToStore: true, rateExcceded: false } )  )))
        ),
        flatMap( (data) => 
          // data comes from DB or url retrieved previously, keep data as it
          iif( () => !data.needToStore || ( data.url != this.notFoundUrl) , 
            of(data), 
            // otherwise get it from music brainz
            this.getFromMsuicbrainz(entityName, delay)
            .pipe( 
              map( (url) => ({url: url, needToStore: true, rateExcceded: false})  )))
        ),
        catchError( (err) => {
          if (err == quotaExceeded){
            logger.error('quota exceeded detected');
            return of( { url: undefined, needToStore: false, rateExcceded: true} );
          }
          logger.error(`Untrapped error:`);
          logger.error(err);
          throw err;
        } ), 
        tap( (data) => { if (data.needToStore)  this.storeToDb(entityName,data.url); } ),
        map( (data) => ( { name: entityName, url: data.url, apiUsed: data.needToStore, rateExcceded: data.rateExcceded } ) ),
        utils.onDevRx( this, tap, (res) => logger.debug(`getImage: ${JSON.stringify(res)}`))
      );
  }


  // "Public like" methods

  // Get a single image url
  getImageOnly= (entityName,delay=0) =>
    this.getImage(entityName, delay, true)
    .pipe( 
      map( (data) => data.url ),
      tap( (url) => logger.debug(`Img for ${entityName}: ${url}` ) )
    )

  // Get artists from beets, search their images and store them
  store= (unitDelay= 1000, parallelism= 1, maxentities= -1) => {
	
    const triggEndStream = new Subject();

    const allentities= this.getAllEntities()
      .pipe( 
        mergeMap( (entities) => from(entities)),
        map( (entity) => entity.name ),
        takeUntil( triggEndStream ),
        map( (entity,index) => [entity,index] ),
        tap( ([entity,index]) => { 
          if ( (maxentities != -1) &&  (index  >= maxentities) ){
            triggEndStream.next(0);
            triggEndStream.complete();
          }
        }),
        map( ([entity,index]) => entity )
      );
   
    let nbEntities= 0;
    const storeOne= (entitiesStream) => { 
      return entitiesStream.pipe(
        tap( (_) => nbEntities++ ),
        mergeScan( (acc,current) => {
          const delay= acc.rateExcceded ? 2 * unitDelay : unitDelay;
          return this.getImage(current, delay);
        }, { rateExcceded: false}, parallelism),
        filter( (data) => data.rateExcceded ),
        map( (data) => data.name ) 
      );
    }
      

    const storeRec= (entitiesStream) =>       
      Observable.create( (observer) => 
        storeOne( entitiesStream )
          .pipe( toArray() )
          .subscribe( (failedEntities) => {
            const previousNbEntities= nbEntities;
            const remainingNbEntities= failedEntities.length;
            nbEntities= 0;
            logger.info( `Summary iteration: 
            -> total entities tried: ${previousNbEntities} 
            -> remaining entities: ${remainingNbEntities} 
            `);
            if ( remainingNbEntities == 0 ) observer.complete();
            else storeRec( of(1).pipe( delay(10000), mergeMap( (_) => from(failedEntities) ) ) )
            .subscribe( 
              (_) => undefined, //next
              (_) => undefined, //err
              () => observer.complete()
            );
          })
      );

    return storeRec( allentities );
  }


}



export class ArtistMetadata extends EntityMetadata{

  constructor(){
    super();
    this.init();
  }

  // START ABSTRACT METHODS

  getIgnoredEntities= () => of('', 'Soundtrack','Various Artists'); 
  getNotFoundUri= () => "/assets/unknown.jpg";

  // get image url from db
  getFromDB= (entity) =>
    from(this.dbHelper.getArtistUrl(entity))
      .pipe( 
        tap( (url) => {
          if (!url) throw entityNotStored ;
        } )
      )

  // add image url to db
  storeToDb= (entity, url) =>
    from(this.dbHelper.addArtistUrl(entity, url))

  discOgsImage= (artistName, delay= 1000) => {
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
        tap( (url) => logger.info(`Image found for ${artistName}: ${url}`) )
      );

  }

  musicbrainzImage= (artistName, delay) => {
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
        } )
      );

  }
 
  getAllEntities= () => from( this.beetsHelper.beetsMixedArtists() )

  // END ABSTRACT METHODS

}


export class AlbumMetadata extends EntityMetadata{

  constructor(){
    super();
    this.init();
  }

  // START ABSTRACT METHODS

  getIgnoredEntities= () => of('');
  getNotFoundUri= () => "/assets/unknown.jpg";

  // get image url from db
  getFromDB= (entity) =>
    from(this.dbHelper.getAlbumUrl(entity))
      .pipe( 
        tap( (url) => {
          if (!url) throw entityNotStored ;
        } )
      )

  // add image url to db
  storeToDb= (albumName, url) =>
    from(this.dbHelper.addAlbumUrl(albumName, url))

  discOgsImage= (albumName, delay= 1000) => {
    const searchUri=`https://api.discogs.com/database/search?q=${albumName}&?type=release&?release=${albumName}`;
    const conf={ headers: {'User-Agent': 'BeetsWebapp', 'Authorization': 'Discogs token=xIFztFffPlHucUCxpNSybLPOmxnpEOBNQCfqWsdi' } }
    return this.http_get( searchUri, conf, delay )
      .pipe(
        // restrieving results field
        flatMap( (response) => from(response.results) ),
        // default url if no result,
        defaultIfEmpty( "" ),
        // do some logs
        tap( (result) => {
          if ( result == "" ) throw `Image not found on discogs for ${albumName}` ;
        } ),        
        // take first result
        first(),
        // retrieve cover_image of the result
        map( (result) => result.cover_image ),
        tap( (url) => logger.info(`Image found for ${albumName}: ${url}`) )
      );

  }

  musicbrainzImage= (albumName, delay) => {
    let idUri= encodeURI(`http://musicbrainz.org/ws/2/release/?query=name:${albumName}&fmt=json`);
    const conf={ headers: {'User-Agent': 'BeetsWebapp' } }

    return this.http_get(idUri, conf, delay)
      .pipe( 
        flatMap( (response) => {
          const releases= response.releases;
          if (!releases || releases.length == 0){
            throw "no album found";
          }
          const albumId= releases[0].id;
          const dataUri= encodeURI( `http://coverartarchive.org/release/${albumId}` );
          return this.http_get(dataUri, conf, delay);
        } ),
        // get stream of relations
        flatMap( (response) => from(response.images) ),
        // front images only
        filter( (imagedata) => imagedata.front ),
        // get image field
        map( (imagedata) => imagedata.thumbnails.small ),
        // default value if artist not found
        defaultIfEmpty( "" ),
        // get the first one in case serveral images found
        first(),
        tap( (url) => {
          if ( url == "" ) throw `Image not found on musicbrainzfor ${artistName}` ;
        } )
      );

  }
 
  getAllEntities= () => from( this.beetsHelper.beetsAlbums() )

  // END ABSTRACT METHODS



}
