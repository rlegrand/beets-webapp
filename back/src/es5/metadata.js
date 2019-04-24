"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ArtistMetadata = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _db = _interopRequireDefault(require("./db"));

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
var quotaExceeded = {
  name: "ArtistNotStored",
  message: "Artist not found locally"
};

var ArtistMetadata = function ArtistMetadata() {
  var _this = this;

  _classCallCheck(this, ArtistMetadata);

  _defineProperty(this, "configureAxios", function () {
    _axios.default.interceptors.request.use(function (config) {
      config.metadata = {
        startTime: new Date()
      };
      return config;
    }, function (error) {
      return Promise.reject(error);
    });

    _axios.default.interceptors.response.use(function (response) {
      response.config.metadata.endTime = new Date();
      response.duration = response.config.metadata.endTime - response.config.metadata.startTime;
      return response;
    }, function (error) {
      error.config.metadata.endTime = new Date();
      error.duration = error.config.metadata.endTime - error.config.metadata.startTime;
      return Promise.reject(error);
    });
  });

  _defineProperty(this, "http_get", function (url) {
    var conf = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var wait = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1000;
    return (0, _rxjs.of)(1).pipe(_this.log("request starting: ".concat(url)), (0, _operators.flatMap)(function (_) {
      return (0, _rxjs.from)(_axios.default.get(url, conf));
    }), _this.log("request complete: ".concat(url)), (0, _operators.map)(function (response) {
      return {
        responseData: response.data,
        wait: Math.max(0, wait - response.duration)
      };
    }), (0, _operators.delayWhen)(function (data) {
      return (0, _rxjs.timer)(data.wait);
    }), (0, _operators.map)(function (data) {
      return data.responseData;
    }));
  });

  _defineProperty(this, "log", function (message) {
    return (0, _operators.tap)(function (_) {
      return console.log(message);
    });
  });

  _defineProperty(this, "getFromDB", function (artistName) {
    return (0, _rxjs.from)(_this.dbHelper.getArtistUrl(artistName)).pipe((0, _operators.tap)(function (url) {
      if (!url) throw artistNotStored;
    }));
  });

  _defineProperty(this, "storeToDb", function (artistName, url) {
    return (0, _rxjs.from)(_this.dbHelper.addArtistUrl(artistName, url));
  });

  _defineProperty(this, "errorImage", function () {
    return (0, _operators.catchError)(function (err) {
      if (err.response && (err.response.status == 503 || err.response.status == 429)) throw quotaExceeded;
      console.error("An unexpected error occured");
      return (0, _rxjs.of)(_this.notFoundUrl);
    });
  });

  _defineProperty(this, "getFromDiscogs", function (artistName) {
    var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
    var searchUri = "https://api.discogs.com/database/search?q=".concat(artistName, "&?type=artist&?artist=").concat(artistName);
    var conf = {
      headers: {
        'User-Agent': 'BeetsWebapp',
        'Authorization': 'Discogs token=xIFztFffPlHucUCxpNSybLPOmxnpEOBNQCfqWsdi'
      }
    };
    return _this.http_get(searchUri, conf, delay).pipe( // restrieving results field
    (0, _operators.flatMap)(function (response) {
      return (0, _rxjs.from)(response.results);
    }), // take first result
    (0, _operators.first)(), // retrieve cover_image of the result
    (0, _operators.map)(function (result) {
      return result.cover_image;
    }), // default url if no result,
    (0, _operators.defaultIfEmpty)(""), // do some logs
    (0, _operators.tap)(function (url) {
      if (url == "") throw "Image not found on discogs for ".concat(artistName);
      console.log("Image found for ".concat(artistName, ": ").concat(url));
    }), _this.errorImage());
  });

  _defineProperty(this, "getFromMsuicbrainz", function (artistName) {
    var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
    var idUri = encodeURI("http://musicbrainz.org/ws/2/artist/?query=artist:".concat(artistName, "&fmt=json"));
    var conf = {
      headers: {
        'User-Agent': 'BeetsWebapp'
      }
    };
    return _this.http_get(idUri, conf, delay).pipe((0, _operators.flatMap)(function (response) {
      var artists = response.artists;

      if (!artists || artists.length == 0) {
        throw "no artist found";
      }

      var artistId = artists[0].id;
      var dataUri = encodeURI("http://musicbrainz.org/ws/2/artist/".concat(artistId, "?inc=url-rels&fmt=json"));
      return _this.http_get(dataUri, conf, delay);
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
      if (url == "") throw "Image not found on musicbrainzfor ".concat(artistName);
      console.log("Image found for ".concat(artistName, ": ").concat(url));
    }), _this.errorImage());
  });

  _defineProperty(this, "ignoreArtists", function (artistName) {
    return _this.ignoredArtists.pipe((0, _operators.count)(function (iartist) {
      return iartist == artistName;
    }), (0, _operators.map)(function (count) {
      return count > 0;
    }));
  });

  _defineProperty(this, "getArtistImage", function (artistName) {
    var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
    return _this.ignoreArtists(artistName).pipe((0, _operators.flatMap)(function (shouldIgnore) {
      return (0, _rxjs.iif)(function () {
        return shouldIgnore;
      }, (0, _rxjs.of)({
        url: _this.notFoundUrl,
        needToStore: false,
        rateExcceded: false
      }), _this.getFromDB(artistName).pipe((0, _operators.map)(function (url) {
        return {
          url: url,
          needToStore: false,
          rateExcceded: false
        };
      })));
    }), (0, _operators.catchError)(function (err) {
      if (err.name == artistNotStored.name) return (0, _rxjs.of)({
        url: undefined,
        needToStore: true,
        rateExcceded: false
      });else throw err;
    }), _this.log("looking fo ".concat(artistName)), (0, _operators.flatMap)(function (data) {
      return (// data comes from DB, keep data as it
        (0, _rxjs.iif)(function () {
          return !data.needToStore;
        }, (0, _rxjs.of)(data), // otherwise get it from music brainz
        _this.getFromDiscogs(artistName, delay).pipe((0, _operators.map)(function (url) {
          return {
            url: url,
            needToStore: true,
            rateExcceded: false
          };
        })))
      );
    }), (0, _operators.flatMap)(function (data) {
      return (// data comes from DB or url retrieved previously, keep data as it
        (0, _rxjs.iif)(function () {
          return !data.needToStore || data.url != _this.notFoundUrl;
        }, (0, _rxjs.of)(data), // otherwise get it from music brainz
        _this.getFromMsuicbrainz(artistName, delay).pipe((0, _operators.map)(function (url) {
          return {
            url: url,
            needToStore: true,
            rateExcceded: false
          };
        })))
      );
    }), (0, _operators.catchError)(function (err) {
      if (err == quotaExceeded) {
        return (0, _rxjs.of)({
          url: undefined,
          needToStore: false,
          rateExcceded: true
        });
      }

      console.log("Untrapped error");
      throw err;
    }), (0, _operators.tap)(function (data) {
      if (data.needToStore) _this.storeToDb(artistName, data.url);
    }), (0, _operators.map)(function (data) {
      return {
        artist: artistName,
        url: data.url,
        apiUsed: data.needToStore,
        rateExcceded: data.rateExcceded
      };
    }));
  });

  _defineProperty(this, "getArtistImageOnly", function (artistName) {
    var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    return _this.getArtistImage(artistName, delay).pipe((0, _operators.map)(function (data) {
      return data.url;
    }));
  });

  _defineProperty(this, "store", function () {
    var unitDelay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000;
    var parallelism = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    var maxartists = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
    var triggEndStream = new _rxjs.Subject();
    var albumArtists = (0, _rxjs.from)(_this.beetsHelper.beetsAlbumArists()).pipe((0, _operators.flatMap)(function (artistsArray) {
      return (0, _rxjs.from)(artistsArray);
    }), (0, _operators.map)(function (artistData) {
      return artistData.name;
    }), (0, _operators.concat)((0, _rxjs.from)(_this.beetsHelper.beetsArists()).pipe((0, _operators.flatMap)(function (artistsArray) {
      return (0, _rxjs.from)(artistsArray);
    }))), (0, _operators.toArray)(), (0, _operators.flatMap)(function (allArtistsArray) {
      return (0, _rxjs.from)(allArtistsArray.sort());
    }), (0, _operators.distinctUntilChanged)(), (0, _operators.filter)(function (artist) {
      return artist.trim().length > 0;
    }), (0, _operators.takeUntil)(triggEndStream), (0, _operators.map)(function (artist, index) {
      return [artist, index];
    }), (0, _operators.tap)(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          artist = _ref2[0],
          index = _ref2[1];

      if (maxartists != -1 && index >= maxartists) {
        triggEndStream.next(0);
        triggEndStream.complete();
      }
    }), (0, _operators.map)(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
          artist = _ref4[0],
          index = _ref4[1];

      return artist;
    }));

    var storeOne = function storeOne(albumArtistsStream) {
      return albumArtistsStream.pipe((0, _operators.mergeScan)(function (acc, current) {
        var delay = acc.rateExcceded ? 2 * unitDelay : unitDelay;
        return _this.getArtistImage(current, delay);
      }, {
        rateExcceded: false
      }, parallelism), (0, _operators.filter)(function (data) {
        return data.rateExcceded;
      }), (0, _operators.map)(function (data) {
        return data.artist;
      }));
    };

    var storeRec = function storeRec(albumArtistsStream) {
      return _rxjs.Observable.create(function (observer) {
        return storeOne(albumArtistsStream).pipe((0, _operators.toArray)()).subscribe(function (failedArtists) {
          if (failedArtists.length > 0) storeRec((0, _rxjs.of)(failedArtists));else observer.complete();
        });
      });
    };

    return storeRec(albumArtists);
  });

  this.beetsHelper = new _beets.BeetsHelper();
  this.dbHelper = _db.default;
  this.ignoredArtists = (0, _rxjs.of)('Soundtrack', 'Various Artists');
  this.notFoundUrl = "/assets/unknown.jpg";
  this.configureAxios();
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