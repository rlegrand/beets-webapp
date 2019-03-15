"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ArtistMetadata = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _db = require("./db");

var _beets = require("./beets");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var artistNotStored = {
  name: "ArtistNotStored",
  message: "Artist not found locally"
};

var ArtistMetadata = function ArtistMetadata() {
  var _this = this;

  _classCallCheck(this, ArtistMetadata);

  _defineProperty(this, "http_get", function (url) {
    var conf = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return (0, _rxjs.from)(_axios.default.get(url, conf)).pipe((0, _operators.map)(function (response) {
      return (0, _rxjs.of)(response.data).pipe((0, _operators.delay)(1000));
    }), concatAll());
  });

  _defineProperty(this, "getFromDB", function (artistName) {
    return (0, _rxjs.from)(_this.dbHelper.getArtistUrl("nonexist")).pipe((0, _operators.tap)(function (url) {
      if (!url) throw artistNotStored;
    }));
  });

  _defineProperty(this, "storeToDb", function (artistName, url) {
    return (0, _rxjs.from)(_this.dbHelper.addArtistUrl(artistName, url));
  });

  _defineProperty(this, "getFromDiscogs", function (artistName) {
    var searchUri = "https://api.discogs.com/database/search?q=".concat(artistName, "&?type=artist&?artist=").concat(artistName);
    var conf = {
      headers: {
        'User-Agent': 'BeetsWebapp',
        'Authorization': 'Discogs token=xIFztFffPlHucUCxpNSybLPOmxnpEOBNQCfqWsdi'
      }
    };
    return _this.http_get(searchUri, conf).pipe( // restrieving results field
    (0, _operators.flatMap)(function (response) {
      return (0, _rxjs.from)(response.results);
    }), // take first result
    (0, _operators.first)(), // retrieve cover_image of the result
    (0, _operators.map)(function (result) {
      return result.cover_image;
    }), // default url if no result,
    (0, _operators.defaultIfEmpty)(""), // do some logs
    (0, _operators.tap)(function (url) {
      if (url == "") console.log("Image not found on musicbrainz for ".concat(artistName));
    }), (0, _operators.catchError)(function (error) {
      console.error(error);
      return (0, _rxjs.of)("empty");
    }));
  });

  _defineProperty(this, "getFromMsuicbrainz", function (artistName) {
    var idUri = encodeURI("http://musicbrainz.org/ws/2/artist/?query=artist:".concat(artistName, "&fmt=json"));
    var conf = {
      headers: {
        'User-Agent': 'BeetsWebapp'
      }
    };
    return _this.http_get(idUri, conf).pipe((0, _operators.flatMap)(function (response) {
      var artists = response.artists;

      if (!artists || artists.length == 0) {
        throw "no artist found";
      }

      var artistId = artists[0].id;
      var dataUri = encodeURI("http://musicbrainz.org/ws/2/artist/".concat(artistId, "?inc=url-rels&fmt=json"));
      return _this.http_get(dataUri, conf);
    }), // get stream of relations
    (0, _operators.flatMap)(function (response) {
      return (0, _rxjs.from)(response.relations);
    }), // get stream of resources
    (0, _operators.map)(function (relation) {
      return relation.url.resource;
    }), // retrieve wikimedia urls only
    (0, _operators.filter)(function (urlResource) {
      return urlResource.match(/wikimedia.+File:/);
    }), // retrieve filename from url
    (0, _operators.map)(function (urlResource) {
      return urlResource.match(/wikimedia.+File:(.*)/)[1];
    }), // retrieve url pointing to filename
    (0, _operators.map)(function (fileName) {
      return "https://commons.wikimedia.org/wiki/Special:FilePath/".concat(fileName, "?width=200");
    }), // default value if artist not found
    (0, _operators.defaultIfEmpty)(""), // get the first one in case serveral images found
    (0, _operators.first)(), // do some logs
    (0, _operators.tap)(function (url) {
      if (url == "") console.log("Image not found on musicbrainz for ".concat(artistName));
    }), (0, _operators.catchError)(function (error) {
      console.error(error);
      return (0, _rxjs.of)("empty");
    }));
  });

  _defineProperty(this, "ignoreArtists", function (artistName) {
    return _this.ignoredArtists.pipe((0, _operators.count)(function (iartist) {
      return iartist == artistName;
    }), (0, _operators.map)(function (count) {
      return count > 0;
    }));
  });

  _defineProperty(this, "getArtistImage", function (artistName) {
    return _this.ignoreArtists(artistName).pipe((0, _operators.flatMap)(function (shouldIgnore) {
      return (0, _rxjs.iif)(function () {
        return shouldIgnore;
      }, (0, _rxjs.of)({
        url: "/assets/unknown.jpg",
        needToStore: false
      }), _this.getFromDB(artistName).map(function (url) {
        return {
          url: url,
          needToStore: false
        };
      }));
    }), (0, _operators.catchError)(function (err) {
      if (err.name == artistNotStored.name) return (0, _rxjs.of)({
        url: "",
        needToStore: true
      });else throw err;
    }), (0, _operators.flatMap)(function (data) {
      return (0, _rxjs.iif)(function () {
        return data.url != "";
      }, (0, _rxjs.of)(data), _this.getFromDiscogs(artistName).pipe((0, _operators.map)(function (url) {
        return {
          url: url,
          needToStore: true
        };
      })));
    }), (0, _operators.flatMap)(function (data) {
      return (0, _rxjs.iif)(function () {
        return data.url != "";
      }, (0, _rxjs.of)(data), _this.getFromMsuicbrainz(artistName).pipe((0, _operators.map)(function (url) {
        return {
          url: url,
          needToStore: true
        };
      })));
    }), (0, _operators.tap)(function (data) {
      if (data.needToStore) _this.storeToDb(artistNotStored, url);
    }));
  });

  _defineProperty(this, "store", function () {
    var albumArtists = _this.beetsHelper.beetsAlbumArists();

    return (0, _rxjs.zip)((0, _rxjs.from)(albumArtists), (0, _rxjs.range)(0, albumArtists.length)).pipe((0, _operators.flatMap)(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          artist = _ref2[0],
          index = _ref2[1];

      return (0, _rxjs.zip)((0, _rxjs.of)(artist), getArtistImage(artist), (0, _rxjs.of)(index));
    }), (0, _operators.map)(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 3),
          artist = _ref4[0],
          image = _ref4[1],
          idx = _ref4[2];

      return {
        artist: artist,
        image: image,
        index: idx
      };
    }));
  });

  this.beetsHelper = new _beets.BeetsHelper();
  this.dbHelper = _db.dbHelper;
  this.ignoredArtists = (0, _rxjs.of)('Soundtrack', 'Various Artists');
};
/*
const levenshtein = (a, b) => {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  let tmp, i, j, prev, val, row
  // swap to save some memory O(min(a,b)) instead of O(a)
  if (a.length > b.length) {
    tmp = a
    a = b
    b = tmp
  }

  row = Array(a.length + 1)
  // init the row
  for (i = 0; i <= a.length; i++) {
    row[i] = i
  }

  // fill in the rest
  for (i = 1; i <= b.length; i++) {
    prev = i
    for (j = 1; j <= a.length; j++) {
      if (b[i-1] === a[j-1]) {
        val = row[j-1] // match
      } else {
        val = Math.min(row[j-1] + 1, // substitution
              Math.min(prev + 1,     // insertion
                       row[j] + 1))  // deletion
      }
      row[j - 1] = prev
      prev = val
    }
    row[a.length] = prev
  }
  return row[a.length]
}

*/


exports.ArtistMetadata = ArtistMetadata;