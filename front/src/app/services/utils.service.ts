import {Injectable} from '@angular/core';
import {Http, Headers, RequestOptions, Response} from '@angular/http';

import {MetadataResponse, Metadata} from '../model/albums-response';
import { b } from '@angular/core/src/render3';





@Injectable()
export class Utils {

	constructor(){}

  escape= (request: string) => request.replace(/["'#()]/g, '\\$&').replace(/\\\\/g, '\\')

  getFormatedDate= (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

  displayError = (e) => {
    // TODO
    console.error(e);
  }

  sortByName= (metadatas: Metadata[]) => {
    return metadatas.sort(  (a: Metadata, b: Metadata) => { return { 'true': -1, 'false': 1}[ Boolean(a.name < b.name).toString() ]; }  )
  }
  
  sortByNameDesc= (metadatas: Metadata[]) => {
    return metadatas.sort(  (a: Metadata, b: Metadata) => { return { 'true': -1, 'false': 1}[ Boolean(a.name > b.name).toString() ]; }  )
  }
  
  sortByDate= (metadatas: Metadata[]) => {
    return metadatas.sort(  (a: Metadata, b: Metadata) => { return { 'true': -1, 'false': 1}[ Boolean(a.addedDate < b.addedDate).toString() ]; }  )
  }
  
  sortByDateDesc= (metadatas: Metadata[]) => {
    return metadatas.sort(  (a: Metadata, b: Metadata) => { return { 'true': -1, 'false': 1}[ Boolean(a.addedDate > b.addedDate).toString() ]; }  )
  }

}
