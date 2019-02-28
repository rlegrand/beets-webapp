import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';

import { AlbumsResponse,Album } from './model/albums-response';


import {BeetApi} from './apis.service';

@Component({
  selector: 'albums', 
  templateUrl: 'albums.component.html'
})
export class AlbumsComponent implements OnInit { 


    //Albums to display
    albums: Album[]= [];

    constructor(private beetApi: BeetApi ){}

    ngOnInit(){
        this.getAlbums();
    }

    getAlbums= () => {
        this.beetApi.getAlbums()
        .then( (response: AlbumsResponse) => {
            this.albums=  response.data;
        } );
    }
   
}

