import {Injectable} from '@angular/core';
import {Http, Headers, RequestOptions, Response} from '@angular/http';

import {MetadataResponse, Metadata} from '../model/albums-response';





@Injectable()
export class Utils {

	constructor(){}

	escape= (word: string ) => word.replace('"',"\"")

  getFormatedDate= (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

  displayError = (e) => {
    // TODO
    console.error(e);
  }

}
