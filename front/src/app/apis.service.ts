import {Injectable} from '@angular/core';
import {Http, Headers, RequestOptions, Response} from '@angular/http';

import {AlbumArtistsResponse, AlbumsResponse} from './model/albums-response';


@Injectable()
export class BeetApi {

	constructor(private http: Http){}

	getSongs= (request: string) => {

		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post('/api/beets/songs', {beetsfilter:request}, options )
	}

	getAlbumArtists= (): PromiseLike<AlbumArtistsResponse>  => {

		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post('/api/beets/albumartists', {}, options ).toPromise()
				.then( (response: Response) => (<AlbumArtistsResponse> response.json()) );
	}

	getAlbums= (): PromiseLike<AlbumsResponse> => {

		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post('/api/beets/albums', {}, options ).toPromise()
				.then( (response: Response) => (<AlbumsResponse> response.json()) );	
	}

      encodeURI(`http://musicbrainz.org/ws/2/artist/?query=artist:${artist}&fmt=json`)

	getArtistImage= (): PromiseLike<string> => {

		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

        let idUri= encodeURI(`http://musicbrainz.org/ws/2/artist/?query=artist:${artist}&fmt=json`);

        this.http.get('idUri')
        .map( (response: Response): Response => {
          const artists: any[]= ( <any> response.json() ).artists;
          if (!artists || artists.length == 0){
            throw "no artist found";
          }
          const artistId: string= artists[0].id;
          let dataUri= encodeUri(`http://musicbrainz.org/ws/2/artist/${artistId}?inc=url-rels&fmt=json`);
          return this.http.get(dataUri);
        }
        .map( (response:: Response): string => {
          let res= "";
          const filteredRelations= ( <any> response.json() ).relations.filter( (relation: any) => relation.url.match(/wikimedia/) );
          if ( !filteredRelations || filteredRelations.length == 0 ){
            throw "no image found"
          }
          return filteredRelations[0].url;
        }).toPromise()
        .catch( (error: any) => {
          console.error(error);
          return ""
        });
	}

}
