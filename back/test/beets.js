//var assert = require('assert');
//var sinon= require('sinon');
import assert from 'assert';
import sinon from 'sinon';

import fs from 'fs';
import yaml from 'js-yaml';

import { BeetsHelper } from '../src/es6/beets.js';
import myutils from '../src/es6/utils.js';


let beetsHelper;

const mockBeetsHelper= () => {
    // disable fs/yaml
    fs.readFileSync = sinon.fake();
    yaml.safeLoad = sinon.fake.returns("fake");

    // Disable side effect during instanciation
    const initFake=sinon.stub(BeetsHelper.prototype, 'init');

    // Instanciate beets helper safely
    beetsHelper = new BeetsHelper();

    // fake useless array methods (properties)
    beetsHelper.rememberDateConf= sinon.spy();
    beetsHelper.getLastModificationDate= sinon.spy();
    beetsHelper.confChanged= sinon.spy();

    // Invoke constructor like method
    initFake.restore();
    beetsHelper.init();
}


describe( "Beets", function(){

    beforeEach(function() {
        // beets helper
        mockBeetsHelper();
    });

    describe("parseDelimString", () => {
        it("Check parsing works correctly", () => {
            const fnArgs = [ ["A1<#>B1<#>C1","A1<#>B2<#>C2","A3<#>B3<#>C3"], "<#>", ['f1','f2','f3'], 'f1'];
            const wantedResult = [
                {f1: 'A1', f2: 'B1', f3: 'C1'},
                {f1: 'A3', f2: 'B3', f3: 'C3'}
            ];

            return beetsHelper.parseDelimString(...fnArgs).then( (res) => {
                assert.deepEqual(res, wantedResult);
              }  );
        });
    });

    describe("beetsSongRequest", () => {
        it("Check computed songs are correctly mapped and sort", () => {
            const songsRequestResponse= [ 
                "/media/data/multimedia/music/imported/113/Les princes de la ville/08 Jackpotes 2000.mp3<#>113<#>Les princes de la ville<#>Jackpotes 2000",
                "/media/data/multimedia/music/imported/113/Les princes de la ville/11 Tonton du bled.mp3<#>113<#>Les princes de la ville<#>Tonton du bled"
            ];
            const wantedResult = [
                { path: '/media/data/multimedia/music/imported/113/Les princes de la ville/08 Jackpotes 2000.mp3', artist: '113', album: 'Les princes de la ville', title: 'Jackpotes 2000' },
                { path: '/media/data/multimedia/music/imported/113/Les princes de la ville/11 Tonton du bled.mp3', artist: '113', album: 'Les princes de la ville', title: 'Tonton du bled' }
            ];

            sinon.stub(beetsHelper, 'beetRequest').resolves(songsRequestResponse);
            
            return beetsHelper.beetsSongsRequest().then( (res) => {
                assert.deepEqual(res, wantedResult);
              }  );
        });
    });

    describe("beetsArtists", () => {
        it("Check computed artists are correct: sorted", () => {
            const artistsRequestResponse = [
                "The Firm<#>2017-01-06 23:05:39<#>artist", 
                "The Firm<#>2017-01-06 23:05:38<#>artist",
                "other<#>2017-01-07 23:05:38<#>artist"
             ];

            const wantedResult = [
                { name: 'The Firm', addedDate: myutils.getDate('2017-01-06 23:05:39'), fields: ['artist'], mainField: 'artist' },
                { name: 'other', addedDate: myutils.getDate('2017-01-07 23:05:38'), fields: ['artist'], mainField: 'artist' }
            ];

            sinon.stub(beetsHelper, 'beetRequest').resolves(artistsRequestResponse);
            
            return beetsHelper.beetsArtists().then( (res) => {
                assert.deepEqual(res, wantedResult);
              }  );
        });
    });

    describe("beetsAlbumArtists", () => {

        it("Check computed artists are correct: sorted", () => {
            const albumArtistsRequestResponse = ["The Firm<#>2017-01-06 23:05:38<#>albumartist", "Marvin Gaye<#>2016-12-30 15:54:13<#>albumartist"];
            const wantedResult = [
                { name: 'The Firm', addedDate: myutils.getDate('2017-01-06 23:05:38'), fields: ['albumartist'], mainField: 'albumartist'  },
                { name: 'Marvin Gaye', addedDate: myutils.getDate('2016-12-30 15:54:13'), fields: ['albumartist'], mainField: 'albumartist' }
            ];

            sinon.stub(beetsHelper, 'beetRequest').resolves(albumArtistsRequestResponse);

            return beetsHelper.beetsAlbumArtists().then( (res) => {
                assert.deepEqual(res, wantedResult);
              }  );
        });

    });

    describe( "beetsMixedArtists", function(){

        it("duplicate artists: are present only once but with multiple fields", function(){
            const beetsArtistsResponse = [{ name: 'The Firm', addedDate: myutils.getDate('2017-01-06 23:05:39'), fields: ['artist'] }];
            const beetsAlbumArtistsResponse = [{ name: 'The Firm', addedDate: myutils.getDate('2017-01-06 23:05:38'), fields: ['albumartist'] }];
            // concatenation must contain only one element
            // we don't care the addedDate source
            // we need the fields array to contain 'album' and 'albumartist'
            const wantedResult= [ {name: 'The Firm', fields:['artist', 'albumartist'], mainField: 'artist' } ];

            sinon.stub(beetsHelper, 'beetsArtists').resolves(beetsArtistsResponse);
            sinon.stub(beetsHelper, 'beetsAlbumArtists').resolves(beetsAlbumArtistsResponse);

            return beetsHelper.beetsMixedArtists().then( (res) => {
                assert.equal(res.length, wantedResult.length);
                assert.equal(res[0].name, wantedResult[0].name);
                assert.equal(res[0].fields.length, wantedResult[0].fields.length);
                assert(res[0].fields.indexOf('artist') >= 0 );
                assert(res[0].fields.indexOf('albumartist') >= 0 );
            } );

    

        });

    
    });
    
    describe("beetsAlbums", () => {

        it("Check computed albums are correct: sorted", () => {
            const albumRequestResponse = ['The Wall - Disc 1<#>2016-10-07 22:09:24<#>album', 'Animals<#>2016-10-07 22:06:59<#>album'];
            const wantedResult = [
                { name: 'Animals', addedDate: myutils.getDate('2016-10-07 22:06:59'), fields: ['album'], mainField: 'album' },
                { name: 'The Wall - Disc 1', addedDate: myutils.getDate('2016-10-07 22:09:24'), fields:['album'], mainField: 'album' }
            ];

            sinon.stub(beetsHelper, 'beetRequest').resolves(albumRequestResponse);

            return beetsHelper.beetsAlbums().then((res) => {
                assert.deepEqual(res, wantedResult);
            });
        });
    });




});