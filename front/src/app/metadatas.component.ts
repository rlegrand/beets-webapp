import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';
import { ActivatedRoute } from "@angular/router";

import { Observable, from, of, iif, zip } from 'rxjs';

import {SongsResponse} from './model/songs-response';
import {MetadataResponse, Metadata} from './model/albums-response';
import { MetadataType, SortMode } from './model/types';

import {BeetApi} from './services/apis.service';
import {Utils} from './services/utils.service';
import {Cache} from './services/cache.service';
import { DisplaySongsHelper } from './services/displaySongsHelper.service';
import { isEmpty, mergeMap, defaultIfEmpty, map, tap, toArray, filter } from 'rxjs/operators';
import { MethodFn } from '@angular/core/src/reflection/types';

@Component({
  selector: 'metadatas', 
  templateUrl: 'metadatas.component.html',
  styleUrls: ['metadatas.component.css'],

})
export class MetadataComponent implements OnInit { 

  // data to display
  metadatas: Metadata[] = [];
  // data type
  metadataType: string;
  // sort mode
  metadataSortMode: SortMode;
  // filter
  metadataFilterValue='';
  // hide/display sort menu
  displaySortMenu: boolean= false;


  constructor(private route: ActivatedRoute, private beetApi: BeetApi, private cache: Cache, private dsh: DisplaySongsHelper, public utils: Utils) { }

  ngOnInit() {
    this.route.data.subscribe( (data) => this.metadataType= data.metadataType )
    this.getMetadatas();
    this.metadataSortMode= SortMode.name;
  }

  getMetadatas = () => {

    const typeToMethod = new Map<string, MethodFn>();
    typeToMethod.set(MetadataType.album, this.beetApi.getAlbums);
    typeToMethod.set(MetadataType.artist, this.beetApi.getArtists);

    const apiMethod = typeToMethod.get(this.metadataType);

    of<Metadata[]>(this.cache.get(this.metadataType))
      .pipe(
        filter((val) => val != undefined && val !== null),
        defaultIfEmpty([]),
        mergeMap((res: Metadata[]) =>
          iif(
            () => res.length == 0,
            zip(of(true), from(apiMethod.call(this.beetApi))),
            zip(of(false), of(res))
          )),
        map(([notStore, metadatas]) => {
          if (notStore) this.cache.store(this.metadataType, metadatas);
          return metadatas;
        }),
        tap((res) => {
          console.log(`setting metadatas: ${res}`);
        }),
      ).subscribe((metadatas: Metadata[]) => this.metadatas = metadatas);

  }

  // field is the beet field request to use (artist/album/albumartist...)
  search = (field: string, name: string) => this.dsh.getAndDisplaySongs(`${field}:${name}`)

  getSortModes= () => [ SortMode.name, SortMode.nameDesc, SortMode.addeDate, SortMode.addeDateDesc ]

  sort= (sortMode: SortMode) => {
    if (sortMode == this.metadataSortMode){
      return;
    }
    switch (sortMode) {
      case SortMode.name:
        this.metadatas= this.utils.sortByName(this.metadatas);
        break;
      case SortMode.nameDesc:
        this.metadatas= this.utils.sortByNameDesc(this.metadatas);
        break;
      case SortMode.addeDate:
        this.metadatas= this.utils.sortByDate(this.metadatas);
        break;
      case SortMode.addeDateDesc:
        this.metadatas= this.utils.sortByDateDesc(this.metadatas);
        break;
      default:
        break;
    }
    this.metadataSortMode= sortMode;
  }

  filtered():Observable<Metadata[]>{
    let fm= from(this.metadatas);
    if ( this.metadataFilterValue && this.metadataFilterValue != ''){
      fm= fm.pipe(
        filter( (val:Metadata) => new RegExp(this.metadataFilterValue, 'i').test(val.name) )
      );
    }

    return fm.pipe(toArray());
  }

  switchSortMenu= () => this.displaySortMenu=!this.displaySortMenu;

}

