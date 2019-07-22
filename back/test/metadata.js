//var assert = require('assert');
//var sinon= require('sinon');
import assert from 'assert';
import sinon from 'sinon';

import { Observable, Subject, pipe, from, of, timer, iif, zip, empty, forkJoin } from 'rxjs';
import {  groupBy, tap, take, takeUntil, map, mergeScan, count, concat, delay, delayWhen,  defaultIfEmpty, distinctUntilChanged, toArray, flatMap, filter, first, catchError, subscribe, mergeMap } from 'rxjs/operators';

// import { ArtistMetadata } from '../src/es6/metadata.js';


let artistMetaHelper;


describe( "Metadata", function(){

    beforeEach(function() {
        // beets helper
    });

    describe("testRx", () => {
        it("Is empty stream causing error", () => {
            
            const testStream= from(['b','a','c','b','d','b'])
            .pipe(
                groupBy( (e) => e),
                map( (group) => group.pipe(toArray()).toPromise() ),
                toArray()
            ).toPromise();
            
            return testStream.then( (res) => {
                forkJoin(res).subscribe( (arr) => console.log(arr) );
                //assert.equal(res.length, 1);
                //assert.equal(res[0], "tata");
            } );
        });
    });

});
