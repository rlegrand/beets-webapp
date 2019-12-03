import {Injectable, OnInit} from '@angular/core';

import { pipe, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { MetadataResponse } from '../model/albums-response';
import { BeetApi } from './apis.service';
import { Utils } from './utils.service';
import { SongsResponse, Song } from '../model/songs-response';
import { Router } from '@angular/router';
import { MainRoutes } from '../model/types';


@Injectable()
export class DisplaySongsHelper implements OnInit{

  static REQ_KEY='lastTextRequest' ;

  songs: Song[];
  songsLoadedOrLoading: boolean= false;

  textRequest: Subject<string>= new Subject();

  constructor( private router: Router, private api: BeetApi, private utils: Utils){}

  ngOnInit(){ }

  // send an event to display request in input
  // set request into local storage
  shareTextRequest= (request: string) => {
    this.textRequest.next(request);
    localStorage.setItem(DisplaySongsHelper.REQ_KEY, request);
  }

  loadSongs= (request: string) => {
    this.songsLoadedOrLoading= true;
    return this.api.getSongs(request)
    .pipe(
      tap((response: SongsResponse) => this.songs = response.songs)
    );
  }

  loadFromLastRequest= () => {
    const lastRequest = localStorage.getItem(DisplaySongsHelper.REQ_KEY);
    if (lastRequest !== null){
      this.loadSongs(lastRequest)
      .subscribe( () => {} );
    }
  }


  getAndDisplaySongs= (request: string ) => {
    const req= this.utils.escape(request);
    this.shareTextRequest(req)
    this.loadSongs(req)
      .subscribe(
        (resp: SongsResponse) => this.router.navigate([MainRoutes.ongoing]),
        (err: any) => this.utils.displayError(err)
      );
  }



}

