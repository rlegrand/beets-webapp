import {Injectable} from '@angular/core';

@Injectable()
export class Cache{
  cache: Map<String, any>= new Map<string, any>();
  
  store= (key: string, value: any) => this.cache.set(key, value);

  get= (key: string): any => this.cache.get(key);

}