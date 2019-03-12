import {Injectable} from '@angular/core';
import { HttpClient, HttpHeaders }  from '@angular/common/http';

import { Observable, pipe, from } from 'rxjs';
import { map, flatMap, filter, first, catchError } from 'rxjs/operators';

import {AlbumArtistsResponse, AlbumsResponse} from './model/albums-response';


@Injectable()
export class BeetApi {

  private httpOptions= {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    }


  constructor(private http: HttpClient){}

  getSongs= (request: string) => {

		return this.http.post('/api/beets/songs', {beetsfilter:request}, this.httpOptions )
	}

	getAlbumArtists= (): PromiseLike<AlbumArtistsResponse>  => {

      return this.http.post<AlbumArtistsResponse>('/api/beets/albumartists', {}, this.httpOptions )
      .pipe( map( (albumArtistsResponse: AlbumArtistsResponse) : AlbumArtistsResponse => {
        albumArtistsResponse.data= albumArtistsResponse.data.filter( (artist:any, index: number) => index == 0 );
        return albumArtistsResponse;
      } ) )
      .toPromise()
	}

	getAlbums= (): PromiseLike<AlbumsResponse> => {

		return this.http.post<AlbumsResponse>('/api/beets/albums', {}, this.httpOptions ).toPromise();
	}

	getArtistImage= (artistName): Observable<string> => {

        let idUri= encodeURI(`http://musicbrainz.org/ws/2/artist/?query=artist:${artistName}&fmt=json`);

        return this.http.get(idUri)
        .pipe( flatMap( (response: any): Observable<any> => {
          const artists: any[]= response.artists;
          if (!artists || artists.length == 0){
            throw "no artist found";
          }
          const artistId: string= artists[0].id;
          let dataUri= encodeURI(`http://musicbrainz.org/ws/2/artist/${artistId}?inc=url-rels&fmt=json`);
          return this.http.get<any>(dataUri);
        } ))
        .pipe( map( (response: any): string => {
          const filteredRelations= response.relations.filter( (relation: any) => relation.url.resource.match(/wikimedia|wikidata/) );
          if ( !filteredRelations || filteredRelations.length == 0 ){
            throw "no image found";
          }
          return <string> filteredRelations[0].url.resource;
        }))
        .pipe( catchError( (error: any) => {
          console.error(error);
          return ""
        }));

        
	}

}
