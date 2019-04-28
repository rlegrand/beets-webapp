import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';

import { Observable } from 'rxjs';

import {SongsResponse} from './model/songs-response';
import {AlbumArtistsResponse, AlbumArtist, AlbumsResponse} from './model/albums-response';

import {BeetApi} from './services/apis.service';
import {Utils} from './services/utils.service';
import { DisplaySongsHelper } from './services/displaySongsHelper.service';

@Component({
  selector: 'artists', 
  templateUrl: 'artists.component.html',
  styleUrls: ['artists.component.css'],

})
export class ArtistsComponent implements OnInit { 

    // Albums Artits to display (by date)
    albumsArtists: AlbumArtist[]= [];

    constructor(private beetApi: BeetApi, private dsh: DisplaySongsHelper, public utils: Utils){}

    ngOnInit(){
      this.getAlbumsArtists();
    }

    getAlbumsArtists= () => {
        this.beetApi.getAlbumArtists()
        .then( (response: AlbumArtistsResponse) => {
          this.albumsArtists= this.utils.setDateToAlbumArtists(response.data);
          console.log('fy');
        } );
    }

    // field is the beet field request to use (artist/album/albumartist...)
    search= (field: string, name: string) => this.dsh.getAndDisplaySongs( `${field}:${name}` )

    
}

