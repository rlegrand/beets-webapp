import {Injectable} from '@angular/core';
import { HttpClient, HttpHeaders }  from '@angular/common/http';

import { Observable, pipe, from } from 'rxjs';
import { map, flatMap, filter, first, catchError, tap, toArray } from 'rxjs/operators';

import {MetadataResponse, MetadataRaw, Metadata} from '../model/albums-response';
import { SongsResponse } from '../model/songs-response';


@Injectable()
export class BeetApi {

  private httpOptions= {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    }


  constructor(private http: HttpClient){}

  getSongs= (request: string) => {

		return this.http.post<SongsResponse>('/api/beets/songs', {beetsfilter:request}, this.httpOptions )
  }

	getMetadata= (url: string): PromiseLike<Metadata[]>  => {

      return this.http.post<MetadataResponse>(url, {}, this.httpOptions ) 
      .pipe( 
        flatMap( (response:MetadataResponse): Observable<MetadataRaw> => from(response.data) ),
        map( (albumartist:MetadataRaw):Metadata => { 
          const faa= <any> albumartist;
          faa.addedDate= new Date(albumartist.addedDate); 
          return <Metadata> faa;  
        } ),
        toArray()
       )
      .toPromise()
	}

	getArtists= () => this.getMetadata('/api/beets/artists')
	getAlbums= () => this.getMetadata('/api/beets/albums')

}
