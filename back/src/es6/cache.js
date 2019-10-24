import { publishReplay, refCount } from 'rxjs/operators';

import utils from './utils';
const logger= utils.getLogger();

export class Cache{

    constructor(){
        this.cache= new Map();
    }

    cacheObs= (obs) => obs.pipe( publishReplay() , refCount() )

    set= (key, obsValue) => {
        this.cache.set( key, {initialObs: obsValue, sharedObs: this.cacheObs(obsValue) } );
    }

    has= (key) => this.cache.has(key)
    
    get= (key) => {
        const parentRes= this.cache.get(key);
        if (parentRes) return parentRes.sharedObs;
        return undefined;
    }

    resetKey= (key) => {
        logger.debug(`Resetting key  ${key}`);
        const storedValue= this.cache.get(key);
        const obsValue= storedValue.initialObs;
        storedValue.sharedObs= this.cacheObs(obsValue); 
    }

    update= () => this.cache.forEach( (value, key) => this.resetKey(key) )

}