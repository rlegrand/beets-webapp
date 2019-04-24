import {Injectable} from '@angular/core';
import {Http, Headers, RequestOptions, Response} from '@angular/http';

import {AlbumArtistsResponse, AlbumArtistRaw, AlbumArtist, AlbumsResponse} from './model/albums-response';


@Injectable()
export class Utils {

	constructor(){}

	escape= (word: string ) => word.replace('"',"\"")
  
  setDateToAlbumArtists= (albumArtists: AlbumArtistRaw[]) : AlbumArtist[] => {

    const getDate= (date: string): Date => {
      const regex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
      const dateArray = regex.exec(date); 
      return new Date(
        parseInt(dateArray[0]),
        parseInt(dateArray[1]), // Careful, month starts at 0!
        parseInt(dateArray[2]),
        parseInt(dateArray[3]),
        parseInt(dateArray[4]),
        parseInt(dateArray[5])
      );

    }

    return albumArtists.map(  ( albumArtist:AlbumArtistRaw ):AlbumArtist => (
      {
        name: albumArtist.name,
        addedDate:getDate(albumArtist.addedDate),
        url: albumArtist.url
      }
    ) )
  }

  cloneAndSortAlbumArtits = (albumsArtist: AlbumArtist[]): AlbumArtist[] => {
    return albumsArtist.sort((a, b) => ('' + a.name).localeCompare(b.name));
  }

}
