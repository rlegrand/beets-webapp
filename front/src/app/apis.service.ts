import {Injectable} from '@angular/core';
import {Http, Headers, RequestOptions, Response} from '@angular/http';

import {AlbumsArtistResponse, AlbumsResponse} from './model/albums-response';


@Injectable()
export class BeetApi {

	constructor(private http: Http){}

	getSongs= (request: string) => {

		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post('/api/beets/songs', {beetsfilter:request}, options )
	}

	getAlbumArtists= (): PromiseLike<AlbumsArtistResponse>  => {

		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post('/api/beets/albumartists', {}, options ).toPromise()
				.then( (response: Response) => (<AlbumsArtistResponse> response.json()) );
	}

	getAlbums= (): PromiseLike<AlbumsResponse> => {

		let headers = new Headers({ 'Content-Type': 'application/json' });
		let options = new RequestOptions({ headers: headers });

		return this.http.post('/api/beets/albums', {}, options ).toPromise()
				.then( (response: Response) => (<AlbumsResponse> response.json()) );	
	}



}