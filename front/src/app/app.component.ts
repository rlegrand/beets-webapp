import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';

import {SongsResponse} from './model/songs-response';
import {AlbumsArtistResponse, AlbumsArtist, AlbumsResponse} from './model/albums-response';


import {BeetApi} from './apis.service';
import {Utils} from './utils.service';

@Component({
  selector: 'app-root', 
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit { 

    textRequest: string;
    songsResponse: SongsResponse= {songs:[]};

    //Albums to display
    albums: AlbumsResponse= {data: []};
    albumsList: string[]= [];

    // Albums Artits to display (by date)
    albumsArtistByDate: AlbumsArtist= {data: []};
    albumsArtistByDateList: string[]= [];

    albumsArtistByName: AlbumsArtist= {data: []};
    albumsArtistByNameList: string[]= [];

    constructor(private beetApi: BeetApi, private utils: Utils){}

    ngOnInit(){
        this.getAlbums();
        this.getAlbumsArtists();
    }


    /* utils */
    convertAlbumArtists= (albumArtisResponse: AlbumsArtistResponse) : AlbumsArtist => {

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

        return {
            data: albumArtisResponse.data.map(  ( dataContent:{albumartist: string, addedDate: string} ):{albumartist: string, addedDate: Date} => {
                return {
                    albumartist: dataContent.albumartist,
                    addedDate: getDate(dataContent.addedDate)
                }
            } )
        }
 
    }

    cloneAndSortAlbumArtits= (albumsArtist: AlbumsArtist): AlbumsArtist => {
        return {
            data: albumsArtist.data.map( (val, idx) => val )
            .sort( (a,b) => ('' + a.albumartist).localeCompare(b.albumartist) )
        };
    }
    /* end utils */


    getSongs= () => {

        if (this.textRequest === undefined || this.textRequest.length === 0){
            return;
        }

        this.beetApi.getSongs(this.textRequest)
        .subscribe( (response: Response) => {
            this.songsResponse=  <SongsResponse> response.json();
        } );
    }

    getAlbums= () => {
        this.beetApi.getAlbums()
        .then( (response: AlbumsResponse) => {
            this.albums=  response;
            this.albumsList= this.albums.data.map( (val) => val.album );
        } );
    }

    getAlbumsArtists= () => {
        this.beetApi.getAlbumArtists()
        .then( (response: AlbumsArtistResponse) => {

            this.albumsArtistByDate= this.convertAlbumArtists(response);
            this.albumsArtistByName= this.cloneAndSortAlbumArtits(this.albumsArtistByDate);

            this.albumsArtistByDateList= this.albumsArtistByDate.data.map( (val) => val.albumartist );
            this.albumsArtistByNameList= this.albumsArtistByName.data.map( (val) => val.albumartist );

        } );
    }

    selectAlbumArtist= (artist:string) => {
        this.textRequest= `albumartist:"${this.utils.escape(artist)}"`;
        this.getSongs();
    }

    selectAlbum= (album:string) => {
        this.textRequest= `album:"${this.utils.escape(album)}"`;
        this.getSongs();
    }     
    
}
