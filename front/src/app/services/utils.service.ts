import {Injectable} from '@angular/core';
import {Http, Headers, RequestOptions, Response} from '@angular/http';

import {ArtistsResponse, Artist, AlbumsResponse} from '../model/albums-response';





@Injectable()
export class Utils {

	constructor(){}

	escape= (word: string ) => word.replace('"',"\"")

  getFormatedDate= (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

  cloneAndSortAlbumArtits = (albumsArtist: Artist[]): Artist[] => {
    return albumsArtist.sort((a, b) => ('' + a.name).localeCompare(b.name));
  }

  displayError= (e) => {
    // TODO
    console.error(e);
  }

}
