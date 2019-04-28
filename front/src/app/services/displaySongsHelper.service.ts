import {Injectable} from '@angular/core';

import { pipe, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AlbumArtistsResponse, AlbumsResponse } from '../model/albums-response';
import { BeetApi } from './apis.service';
import { Utils } from './utils.service';
import { SongsResponse, Song } from '../model/songs-response';
import { Router } from '@angular/router';
import { MainRoutes } from '../model/types';


@Injectable()
export class DisplaySongsHelper {

  songs: Song[];

  textRequest: Subject<string>= new Subject();

  constructor( private router: Router, private api: BeetApi, private utils: Utils){}

  getAndDisplaySongs= (request: string ) => {
    this.textRequest.next(request);
    this.api.getSongs(request)
    .subscribe( 
      ( resp: SongsResponse ) => {
        this.songs= resp.songs;
        this.router.navigate( [MainRoutes.ongoing] );
      },
      ( err: any ) => { this.utils.displayError(err) },  
      );
  }
  


}

