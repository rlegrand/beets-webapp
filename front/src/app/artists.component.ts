import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';

import { Observable } from 'rxjs';

import {SongsResponse} from './model/songs-response';
import {AlbumArtistsResponse, AlbumArtist, AlbumsResponse} from './model/albums-response';

import {BeetApi} from './apis.service';
import {Utils} from './utils.service';

@Component({
  selector: 'artists', 
  templateUrl: 'artists.component.html'
})
export class ArtistsComponent implements OnInit { 

    // Albums Artits to display (by date)
    albumsArtist: AlbumArtist[]= [];

    constructor(private beetApi: BeetApi, private utils: Utils){}

    ngOnInit(){
        this.getAlbumsArtists();
    }

    getAlbumsArtists= () => {
        this.beetApi.getAlbumArtists()
        .then( (response: AlbumArtistsResponse) => {
            this.albumsArtist= this.utils.setDateToAlbumArtists(response.data);
        } );
    }

    getImage= (artistName:string): Observable<string> => {
      return this.beetApi.getArtistImage(artistName);

    }
    
}

