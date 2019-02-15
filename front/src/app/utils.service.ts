import {Injectable} from '@angular/core';
import {Http, Headers, RequestOptions, Response} from '@angular/http';

import {AlbumsResponse} from './model/albums-response';


@Injectable()
export class Utils {

	constructor(){}

	escape= (word: string ) => word.replace('"',"\"")

}