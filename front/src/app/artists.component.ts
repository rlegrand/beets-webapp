import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';

import { Observable, from, of, iif, zip } from 'rxjs';

import {SongsResponse} from './model/songs-response';
import {ArtistsResponse, Artist, AlbumsResponse} from './model/albums-response';

import {BeetApi} from './services/apis.service';
import {Utils} from './services/utils.service';
import {Cache} from './services/cache.service';
import { DisplaySongsHelper } from './services/displaySongsHelper.service';
import { isEmpty, mergeMap, defaultIfEmpty, map, tap, filter } from 'rxjs/operators';

@Component({
  selector: 'artists', 
  templateUrl: 'artists.component.html',
  styleUrls: ['artists.component.css'],

})
export class ArtistsComponent implements OnInit { 

    // Albums Artits to display (by date)
    artists: Artist[]= [];

    constructor(private beetApi: BeetApi, private cache: Cache,private dsh: DisplaySongsHelper, public utils: Utils){}

    ngOnInit(){
      this.getAlbumsArtists();
    }

    getAlbumsArtists= () => {
 
        of<Artist[]>(this.cache.get('artists'))
        .pipe( 
          filter( (val) => val != undefined && val !== null ),
          defaultIfEmpty([]),
          mergeMap( (res: Artist[]) => 
          iif( 
            () => res.length == 0, 
            zip( of(true), from(this.beetApi.getAlbumArtists()) ),
            zip( of(false), of(res) )
          ) ),
          map( ([notStore,artists]) => {
            if (notStore) this.cache.store('artists', artists);
            return artists;
          } ),
          tap( (res) =>  {
            console.log(`setting artists: ${res}`);
          }),
         ).subscribe( (artists: Artist[]) => this.artists= artists );

    }

    // field is the beet field request to use (artist/album/albumartist...)
    search= (field: string, name: string) => this.dsh.getAndDisplaySongs( `${field}:${name}` )

    
}

