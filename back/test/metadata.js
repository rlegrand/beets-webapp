//var assert = require('assert');
//var sinon= require('sinon');
import assert from 'assert';
import sinon from 'sinon';

import { Observable, Subject, pipe, from, of, timer, iif, zip, empty, forkJoin } from 'rxjs';
import {  groupBy, tap, take, takeUntil, map, mergeScan, count, concat, delay, delayWhen,  defaultIfEmpty, distinctUntilChanged, toArray, flatMap, filter, first, catchError, subscribe, mergeMap } from 'rxjs/operators';

import DbHelper from '../src/es6/db.js';
import { EntityMetadata, AlbumMetadata } from '../src/es6/metadata.js';


let artistMetaHelper;

let initStub;
const disableInit= (thetype) => {
    initStub=sinon.stub(thetype.prototype, 'init');
}

const enableInit= () => initStub.restore()


const prepareDiscogsMocks= () => {

    // Disable side effect during instanciation
    disableInit(EntityMetadata);
    
    const am= new AlbumMetadata();
    sinon.stub(am, 'http_get').returns(of(JSON.parse('{"pagination": {"per_page": 50, "pages": 2, "page": 1, "urls": {"last": "https://api.discogs.com/database/search?q=paris%22sous%22les%22bombes&per_page=50&%3Ftype=release&%3Frelease=paris%22sous%22les%22bombes&page=2", "next": "https://api.discogs.com/database/search?q=paris%22sous%22les%22bombes&per_page=50&%3Ftype=release&%3Frelease=paris%22sous%22les%22bombes&page=2"}, "items": 74}, "results": [{"style": ["Boom Bap", "Hardcore Hip-Hop"], "barcode": ["5 099747 843228", "5099747843228", "IFPI L555", "IFPI 945B", "14-478432-10  15  B4", "SACEM SACD SDRM SGDL", "BIEM", "LC 0199", "14-478432-10", "CB 811", "CDC", "*"], "thumb": "https://img.discogs.com/QXPrgPv8XYJTYtRWzcIJkxDy9ho=/fit-in/150x150/filters:strip_icc():format(jpeg):mode_rgb():quality(40)/discogs-images/R-530807-1128184013.jpeg.jpg", "uri": "/Supr%C3%AAme-NTM-Paris-Sous-Les-Bombes/master/164572", "title": "Supr\u00eame NTM - Paris Sous Les Bombes", "country": "Europe", "format": ["CD", "Album"], "user_data": {"in_collection": false, "in_wantlist": false}, "community": {"want": 1449, "have": 3477}, "label": ["Epic", "Epic", "Epic", "Sony Music Entertainment (France) S.A.", "Sony Music Entertainment (France) S.A."], "cover_image": "https://img.discogs.com/CRzBQNMJ9QXJ5Ae0g0D5VpiBJHI=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-530807-1128184013.jpeg.jpg", "catno": "EPC 478432 - 2", "master_url": "https://api.discogs.com/masters/164572", "year": "1995", "genre": ["Hip Hop"], "resource_url": "https://api.discogs.com/masters/164572", "master_id": 164572, "type": "master", "id": 164572}]}')));

    enableInit();
    // am.init();

    return am;
}

const prepareMusicBrainzMocks= () => {

    // Disable side effect during instanciation
    disableInit(EntityMetadata);
    
    const am= new AlbumMetadata();
    sinon.stub(am, 'http_get').callsFake( (...args) => {
        if (args[0].match(/musicbrainz\.org/)) return of(JSON.parse('{"created": "2019-07-25T21:28:59.750Z","count": 2,"offset": 0,"releases": [{"id": "571fb049-c538-4873-bb93-aea3bb8abc61","score": 100,"count": 1,"title": "Paris sous les bombes","status": "Official","text-representation": {"language": "fra","script": "Latn"},"artist-c    redit": [{"name": "Suprême NTM","artist": {"id": "0135e5ec-4ffd-46e5-9c3c-566b3df46a8d","name": "Suprême NTM","sort-name": "Suprême NTM"}}],"release-group": {"id": "3a99d115-ee73-39f6-adac-bae653792190","type-id": "f529b476-6e62-324f-b0aa-1f3e33d313fc","title": "Paris     sous les bombes","primary-type": "Album"},"date": "1996-12-30","country": "FR","release-events": [{"date": "1996-12-30","area": {"id": "08310658-51eb-3801-80de-5a0739207115","name": "France","sort-name": "France","iso-3166-1-codes": ["FR"]}}],"barcode": "509974784328    0","asin": "B0000277MT","label-info": [{"catalog-number": "EPC 478432 8","label": {"id": "8f638ddb-131a-4cc3-b3d4-7ebdac201b55","name": "Epic"}}],"track-count": 19,"media": [{"format": "CD","disc-count": 1,"track-count": 19}]}]}') );
        if (args[0].match(/coverartarchive\.org/)) return of(JSON.parse('{"images":[{"types":["Front"],"front":true,"back":false,"edit":17902421,"image":"http://coverartarchive.org/release/c9353c6e-3149-48a2-a871-284fc40dc0bd/1150627466.jpg","comment":"","approved":true,"thumbnails":{"large":"http://coverartarchive.org/release/c9353c6e-3149-48a2-a871-284fc40dc0bd/1150627466-500.jpg","small":"http://coverartarchive.org/release/c9353c6e-3149-48a2-a871-284fc40dc0bd/1150627466-250.jpg"},"id":"1150627466"},{"types":["Back","Spine"],"front":false,"back":true,"edit":17902424,"image":"http://coverartarchive.org/release/c9353c6e-3149-48a2-a871-284fc40dc0bd/1150630272.jpg","comment":"","approved":true,"thumbnails":{"large":"http://coverartarchive.org/release/c9353c6e-3149-48a2-a871-284fc40dc0bd/1150630272-500.jpg","small":"http://coverartarchive.org/release/c9353c6e-3149-48a2-a871-284fc40dc0bd/1150630272-250.jpg"},"id":"1150630272"}],"release":"http://musicbrainz.org/release/c9353c6e-3149-48a2-a871-284fc40dc0bd"}'));
    } );

    enableInit();
    // am.init();

    return am;
}


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

    describe('AlbumMetadata', () => {

        it('discogsImage', () => {
            const am= prepareDiscogsMocks();
            return am.discOgsImage('toto', 0).toPromise()
            .then( (url) => assert.equal(url, 'https://img.discogs.com/CRzBQNMJ9QXJ5Ae0g0D5VpiBJHI=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-530807-1128184013.jpeg.jpg')  );
        })

        it('musicbrainzImage', () => {
            const am= prepareMusicBrainzMocks();
            return am.musicbrainzImage('toto', 0).toPromise()
            .then( (url) => assert.equal(url, 'http://coverartarchive.org/release/c9353c6e-3149-48a2-a871-284fc40dc0bd/1150627466-250.jpg')  );
        });


    })

});
