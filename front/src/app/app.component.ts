import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';

import {SongsResponse} from './model/songs-response';
import {BeetApi} from './apis.service';
import {Utils} from './utils.service';

@Component({
  selector: 'app-root', 
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit { 

    textRequest: string;
    songsResponse: SongsResponse= {songs:[]};

  constructor(private beetApi: BeetApi, private utils: Utils){}

    ngOnInit(){ }

    getSongs= () => {

        if (this.textRequest === undefined || this.textRequest.length === 0){
            return;
        }

        this.beetApi.getSongs(this.textRequest)
        .subscribe( (response: Response) => {
          this.songsResponse=  <SongsResponse> response.json();
        } );
    }

    
}
