import assert from 'assert';
import sinon from 'sinon';

import { Observable, Subject, pipe, from, of, timer, iif, zip, empty, forkJoin } from 'rxjs';
import {  groupBy, tap, take, takeUntil, map, mergeScan, count, concat, delay, delayWhen,  defaultIfEmpty, distinctUntilChanged, toArray, flatMap, filter, first, catchError, subscribe, mergeMap } from 'rxjs/operators';

import { Cache } from '../src/es6/cache';

let calledByObs;// sinon fake
let theCache;// cache object
const coldObservable= Observable.create( (observer) => {
    setTimeout( () => {
        calledByObs();
        observer.next(1);
        observer.complete();
    } , 10 );
}  );


describe( "Cache", function(){

    beforeEach(function() {
        calledByObs = sinon.fake();
        theCache= new Cache();
    });

    it("Retrieving correct value from stored observable", () => {

        theCache.set('key', coldObservable);
        const obs= theCache.get('key');

        return obs.toPromise().then( (val) => assert.equal(val, 1) );
    });

    it("Check cold observable values are cached", () => {

        theCache.set('key', coldObservable);
        const obs= theCache.get('key');

        return Promise.all( [obs.toPromise(), obs.toPromise()]  ).then( ([v1,v2]) => {
            assert.equal(v1,1);
            assert.equal(v2,1);
            assert.equal(calledByObs.callCount,1);
        } );

    });
    
    it("Check update", () => {

        theCache.set('key', coldObservable);
        const p1= theCache.get('key').toPromise(); //observable should be created
        theCache.update();
        const p2= theCache.get('key').toPromise(); //observable should be created again (replay broken)
        const p3= theCache.get('key').toPromise(); //observable should not be created again

        return Promise.all( [p1,p2,p3]  ).then( ([v1,v2,v3]) => {
            assert.equal(v1,1);
            assert.equal(v2,1);
            assert.equal(v3,1);
            assert.equal(calledByObs.callCount,2);
        } );

    });

});

