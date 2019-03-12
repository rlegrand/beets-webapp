import axios from 'axios';
import { Observable, pipe, from, of, range, interval, iif, zip } from 'rxjs';
import { tap, take, map, count, concat,  delay, defaultIfEmpty, flatMap, filter, first, catchError, subscribe } from 'rxjs/operators';

import { dbHelper } from './db';
import { BeetsHelper } from './beets';

export class ArtistMetadata{

  constructor(){
    this.beetsHelper= new BeetsHelper();
    this.dbHelper= dbHelper;
  }

  
  def storeAlbumArtists= () => {
    
    this.beetsHelper.beetsAlbumArists()
      .then( (albumArtists) => {
        albumArtists.forEach(  (albumartist) => {
        }
      });


  }


}



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



const data= ["The Firm","Marvin Gaye","Johnny Cash","France Gall","Soundtrack","Various Artists","Badelt","GZA/Genius","Bee Gees","Blondie","KRS?One & Marley Marl","KRS?One","IAM","Boogie Down Productions","Ben E. King","Justice","Stevie Wonder","?dith Piaf","Ella Fitzgerald","DEVO","Joe Hisaichi","Ryuichi Sakamoto","Radio Elvis","Vangelis","Pink Floyd","Jim Morrison, music by The Doors","The Doors","The Jimi Hendrix Experience","Jimi Hendrix","Otis Redding","The Beatles","Fun","Miss White & The Drunken Piano","Beck","Chad & Jeremy","Belle and Sebastian","Momo Wandel Soumah","The Dresden Dolls","Holly Golightly","Oasis","De La Soul Featuring Chaka Khan","Cat Power","Aimee Mann","Ocean Colour Scene","Kate Nash","Pulp","Lou Reed","Elliott Smith","Trance Groove","Whitney Houston","Sonic Youth","PJ Harvey","The Stone Roses","The B?52s","Public Enemy","Mecano","Eric B. & Rakim","Mandingo","Manu Dibango","Madonna","The Smiths","Public Image Limited","Paul McCartney & Michael Jackson","Cyndi Lauper","New Order","The Stranglers","The Clash","Rick James","Grandmaster Flash & The Furious Five","Emmylou Harris","Depeche Mode","The Cure","Liliput","Sugarhill Gang","Sex Pistols","Joy Division","The Jacksons","Television","Ramones","Chic","Talking Heads","Michel Polnareff","Julie London","Fela And Afrika 70","Tony Allen","Queen","Bob Dylan","T.J. Stone","LaBelle","Charlie Feathers","Lynyrd Skynyrd","Iggy And The Stooges","Michael Jackson","The Temptations","The Jackson 5","Ofo The Black Company","Michael Jackson / Jackson Five","Flash Cadillac And The Continental Kids","Elton John","T. Rex","Tom Jones","The Who","The Rolling Stones","The Flamin' Groovies","Jethro Tull"]

const ignoredArtists= of('Soundtrack','Various Artists');

const dbHelper= new DbHelper();
dbHelper.init();

const http_get= (url, conf={}) => {
  return from( axios.get(url, conf).then( (response) => response.data ) );
}

const artistNotStored= { name: "ArtistNotStored", message: "Artist not found locally" }

const getFromDB= (artistName) =>
  from(dbHelper.getArtistUrl("nonexist"))
  .pipe( 
      tap( (url) => {
        if (!url) throw artistNotStored ;
      } )
  )

const storeToDb= (artistName, url) =>
  from(dbHelper.addArtistUrl(artistName, url))

const getFromDiscogs= (artistName) => {
	const searchUri=`https://api.discogs.com/database/search?q=${artistName}&?type=artist&?artist=${artistName}`;
	const conf={ headers: {'User-Agent': 'BeetsWebapp', 'Authorization': 'Discogs token=xIFztFffPlHucUCxpNSybLPOmxnpEOBNQCfqWsdi' } }
	return http_get( searchUri, conf )
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

const getFromMsuicbrainz= (artistName) => {

  let idUri= encodeURI(`http://musicbrainz.org/ws/2/artist/?query=artist:${artistName}&fmt=json`);
  const conf={ headers: {'User-Agent': 'BeetsWebapp' } }

  return http_get(idUri, conf)
    .pipe( 
      flatMap( (response) => {
        const artists= response.artists;
        if (!artists || artists.length == 0){
          throw "no artist found";
        }
        const artistId= artists[0].id;
        const dataUri= encodeURI( `http://musicbrainz.org/ws/2/artist/${artistId}?inc=url-rels&fmt=json` );
        return http_get(dataUri, conf);
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

const ignoreArtists= (artistName) => {
  
  return ignoredArtists
    .pipe( 
        count( (iartist) => iartist == artistName ) ,
        map( (count) => count > 0 )
	);

}


const getArtistImage= (artistName) => {
    return ignoreArtists(artistName)
      .pipe(
          flatMap( (shouldIgnore) => 
            iif( () => shouldIgnore, of("/assets/unknown.jpg"), getFromDB(artistName) )
          ),
          catchError(  (err) => {
            if ( err.name == artistNotStored.name ) return of("");
            else throw err;
          }),
          flatMap( (url) => 
            iif( () => url != "", of(url), getFromDiscogs(artistName) )
          ),
          flatMap( (url) => 
            iif( () => url != "", of(url), getFromMsuicbrainz(artistName) )
          ),
          tap( (url) => storeToDb(artistNotStored,url) )
      );
}


const getSlowRequest= (intervalValue) => 
  zip(
    from(data).pipe(take(10)),
    interval(intervalValue)
  ).pipe(
    flatMap( (artistAndIndex) =>
      zip(
        of( artistAndIndex[0] ),
        of( artistAndIndex[1] ),
        getArtistImage( artistAndIndex[0] )
      )
    )
  )



getSlowRequest(2200).pipe( concat( getSlowRequest(100) ) ) 
.subscribe( (artistIndexImage) => {
  console.log( artistIndexImage[0], artistIndexImage[1], artistIndexImage[2] )
}); 






