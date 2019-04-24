import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';

import { Observable } from 'rxjs';

import {SongsResponse} from './model/songs-response';
import {AlbumArtistsResponse, AlbumArtist, AlbumsResponse} from './model/albums-response';

import {BeetApi} from './apis.service';
import {Utils} from './utils.service';

@Component({
  selector: 'artists', 
  templateUrl: 'artists.component.html',
  styleUrls: ['artists.component.css'],

})
export class ArtistsComponent implements OnInit { 

    // Albums Artits to display (by date)
    albumsArtists: AlbumArtist[]= [];

    constructor(private beetApi: BeetApi, private utils: Utils){}

    ngOnInit(){
      this.getAlbumsArtists();
      // this.getImage("The Firm").subscribe( (imageUri: string) => console.log(imageUri) ;
    }

    getAlbumsArtists= () => {
        this.beetApi.getAlbumArtists()
        .then( (response: AlbumArtistsResponse) => {
          this.albumsArtists= this.utils.setDateToAlbumArtists(response.data);
          console.log('fy');
        } );
    }

    
}

