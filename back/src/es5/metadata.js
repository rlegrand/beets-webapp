"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.__GetDependency__ = exports.__get__ = _get__;
exports.__set__ = exports.__Rewire__ = _set__;
exports.__ResetDependency__ = _reset__;
exports.default = exports.__RewireAPI__ = exports.AlbumMetadata = exports.ArtistMetadata = exports.EntityMetadata = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _db = _interopRequireDefault(require("./db"));

var _beets = require("./beets");

var _utils = _interopRequireDefault(require("./utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var logger = _get__("utils").getLogger();

var entityNotStored = {
  name: "EntityNotStored",
  message: "Artist not found locally"
};
var quotaExceeded = {
  name: "QuotaExceeded",
  message: "Quota Exceeded"
};

var EntityMetadata =
/*#__PURE__*/
function () {
  function EntityMetadata() {
    var _this = this;

    _classCallCheck(this, EntityMetadata);

    _defineProperty(this, "configureAxios", function () {
      _get__("axios").interceptors.request.use(function (config) {
        config.metadata = {
          startTime: new Date()
        };
        return config;
      }, function (error) {
        return Promise.reject(error);
      });

      _get__("axios").interceptors.response.use(function (response) {
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
      return _get__("of")(1).pipe( //this.log(`request starting: ${url}`),
      _get__("flatMap")(function (_) {
        return _get__("from")(_get__("axios").get(url, conf));
      }), //this.log(`request complete: ${url}`),
      _get__("map")(function (response) {
        return {
          responseData: response.data,
          wait: Math.max(0, wait - response.duration)
        };
      }), _get__("delayWhen")(function (data) {
        return _get__("timer")(data.wait);
      }), _get__("map")(function (data) {
        return data.responseData;
      }));
    });

    _defineProperty(this, "log", function (message) {
      return _get__("tap")(function (_) {
        return _get__("logger").info(message);
      });
    });

    _defineProperty(this, "errorImage", function () {
      return _get__("catchError")(function (err) {
        if (err.response && (err.response.status == 503 || err.response.status == 429)) throw _get__("quotaExceeded");

        _get__("logger").error("An unexpected error occured, relpacing by notFound url");

        return _get__("of")(_this.notFoundUrl);
      });
    });

    _defineProperty(this, "ignoreFromDiscogs", function () {
      var contains = function contains(image) {
        return _get__("from")([/spacer.gif$/]).pipe(_get__("count")(function (ignoredImage) {
          return image.match(ignoredImage);
        }), _get__("map")(function (nbImgs) {
          return nbImgs > 0;
        }));
      };

      return [_get__("flatMap")(function (image) {
        return _get__("zip")(_get__("of")(image), contains(image));
      }), _get__("flatMap")(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            image = _ref2[0],
            ignoreImage = _ref2[1];

        return _get__("iif")(function () {
          return ignoreImage;
        }, _get__("empty")(), _get__("of")(image));
      })];
    });

    _defineProperty(this, "getFromDiscogs", function (entity) {
      var _this$discOgsImage;

      var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
      return (_this$discOgsImage = _this.discOgsImage(entity, delay)).pipe.apply(_this$discOgsImage, _toConsumableArray(_this.ignoreFromDiscogs()).concat([_this.errorImage()]));
    });

    _defineProperty(this, "getFromMsuicbrainz", function (artistName) {
      var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
      return _this.musicbrainzImage().pipe(_this.errorImage());
    });

    _defineProperty(this, "ignoreEntities", function (entityName) {
      return _this.ignoredEntities.pipe(_get__("count")(function (ientity) {
        return ientity.trim() == entityName.trim();
      }), _get__("map")(function (count) {
        return count > 0;
      }));
    });

    _defineProperty(this, "getImage", function (entityName) {
      var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
      return _this.ignoreEntities(entityName).pipe(_get__("flatMap")(function (shouldIgnore) {
        return _get__("iif")(function () {
          return shouldIgnore;
        }, _get__("of")({
          url: _this.notFoundUrl,
          needToStore: false,
          rateExcceded: false
        }), _this.getFromDB(entityName).pipe(_get__("utils").onDevRx(_this, _get__("tap"), function (url) {
          return _get__("logger").debug("Url retrieved: ".concat(url));
        }), _get__("map")(function (url) {
          return {
            url: url,
            needToStore: false,
            rateExcceded: false
          };
        })));
      }), _get__("catchError")(function (err) {
        if (err.name == _get__("entityNotStored").name) return _get__("of")({
          url: undefined,
          needToStore: true,
          rateExcceded: false
        });else throw err;
      }), //this.log(`looking for ${artistName}`),
      _get__("flatMap")(function (data) {
        return (// data comes from DB, keep data as it
          _get__("iif")(function () {
            return !data.needToStore;
          }, _get__("of")(data), // otherwise get it from music brainz
          _this.getFromDiscogs(entityName, delay).pipe(_get__("map")(function (url) {
            return {
              url: url,
              needToStore: true,
              rateExcceded: false
            };
          })))
        );
      }), _get__("flatMap")(function (data) {
        return (// data comes from DB or url retrieved previously, keep data as it
          _get__("iif")(function () {
            return !data.needToStore || data.url != _this.notFoundUrl;
          }, _get__("of")(data), // otherwise get it from music brainz
          _this.getFromMsuicbrainz(entityName, delay).pipe(_get__("map")(function (url) {
            return {
              url: url,
              needToStore: true,
              rateExcceded: false
            };
          })))
        );
      }), _get__("catchError")(function (err) {
        if (err == _get__("quotaExceeded")) {
          _get__("logger").error('quota exceeded detected');

          return _get__("of")({
            url: undefined,
            needToStore: false,
            rateExcceded: true
          });
        }

        _get__("logger").error("Untrapped error:");

        _get__("logger").error(err);

        throw err;
      }), _get__("tap")(function (data) {
        if (data.needToStore) _this.storeToDb(entityName, data.url);
      }), _get__("map")(function (data) {
        return {
          name: entityName,
          url: data.url,
          apiUsed: data.needToStore,
          rateExcceded: data.rateExcceded
        };
      }), _get__("utils").onDevRx(_this, _get__("tap"), function (res) {
        return _get__("logger").debug("getImage: ".concat(JSON.stringify(res)));
      }));
    });

    _defineProperty(this, "getImageOnly", function (entityName) {
      var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      return _this.getImage(entityName, delay).pipe(_get__("map")(function (data) {
        return data.url;
      }), _get__("tap")(function (url) {
        return _get__("logger").debug("Img for ".concat(entityName, ": ").concat(url));
      }));
    });

    _defineProperty(this, "store", function () {
      var unitDelay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000;
      var parallelism = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var maxentities = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
      var triggEndStream = new (_get__("Subject"))();

      var allentities = _this.getAllEntities().pipe(_get__("mergeMap")(function (entities) {
        return _get__("from")(entities);
      }), _get__("map")(function (entity) {
        return entity.name;
      }), _get__("takeUntil")(triggEndStream), _get__("map")(function (entity, index) {
        return [entity, index];
      }), _get__("tap")(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            entity = _ref4[0],
            index = _ref4[1];

        if (maxentities != -1 && index >= maxentities) {
          triggEndStream.next(0);
          triggEndStream.complete();
        }
      }), _get__("map")(function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
            entity = _ref6[0],
            index = _ref6[1];

        return entity;
      }));

      var nbEntities = 0;

      var storeOne = function storeOne(entitiesStream) {
        return entitiesStream.pipe(_get__("tap")(function (_) {
          return nbEntities++;
        }), _get__("mergeScan")(function (acc, current) {
          var delay = acc.rateExcceded ? 2 * unitDelay : unitDelay;
          return _this.getImage(current, delay);
        }, {
          rateExcceded: false
        }, parallelism), _get__("filter")(function (data) {
          return data.rateExcceded;
        }), _get__("map")(function (data) {
          return data.name;
        }));
      };

      var storeRec = function storeRec(entitiesStream) {
        return _get__("Observable").create(function (observer) {
          return storeOne(entitiesStream).pipe(_get__("toArray")()).subscribe(function (failedEntities) {
            var previousNbEntities = nbEntities;
            var remainingNbEntities = failedEntities.length;
            nbEntities = 0;

            _get__("logger").info("Summary iteration: \n            -> total entities tried: ".concat(previousNbEntities, " \n            -> remaining entities: ").concat(remainingNbEntities, " \n            "));

            if (remainingNbEntities == 0) observer.complete();else storeRec(_get__("of")(1).pipe(_get__("delay")(10000), _get__("mergeMap")(function (_) {
              return _get__("from")(failedEntities);
            }))).subscribe(function (_) {
              return undefined;
            }, //next
            function (_) {
              return undefined;
            }, //err
            function () {
              return observer.complete();
            });
          });
        });
      };

      return storeRec(allentities);
    });

    // abstract
    if ((this instanceof EntityMetadata ? this.constructor : void 0) == _get__("EntityMetadata")) {
      throw new TypeError("Abstract instance can't be instanciated");
    }
  }

  _createClass(EntityMetadata, [{
    key: "init",
    value: function init() {
      var _this2 = this;

      // methods to implement
      var methodsToImpl = ['getIgnoredEntities', 'getFromDB', 'storeToDb', 'discOgsImage', 'musicbrainzImage'];
      methodsToImpl.forEach(function (m) {
        if (_this2[m] === undefined) {
          throw new TypeError("Method ".concat(m, " should be implemented"));
        }
      });
      this.beetsHelper = new (_get__("BeetsHelper"))();
      this.dbHelper = _get__("DbHelper").get();
      this.ignoredEntities = this.getIgnoredEntities();
      this.notFoundUrl = this.getNotFoundUri();
      this.configureAxios();
      return this;
    }
  }]);

  return EntityMetadata;
}();

exports.EntityMetadata = EntityMetadata;

var ArtistMetadata =
/*#__PURE__*/
function (_get__2) {
  _inherits(ArtistMetadata, _get__2);

  function ArtistMetadata() {
    var _this3;

    _classCallCheck(this, ArtistMetadata);

    _this3 = _possibleConstructorReturn(this, _getPrototypeOf(ArtistMetadata).call(this));

    _defineProperty(_assertThisInitialized(_this3), "getIgnoredEntities", function () {
      return _get__("of")('', 'Soundtrack', 'Various Artists');
    });

    _defineProperty(_assertThisInitialized(_this3), "getNotFoundUri", function () {
      return "/assets/unknown.jpg";
    });

    _defineProperty(_assertThisInitialized(_this3), "getFromDB", function (entity) {
      return _get__("from")(_this3.dbHelper.getArtistUrl(entity)).pipe(_get__("tap")(function (url) {
        if (!url) throw _get__("entityNotStored");
      }));
    });

    _defineProperty(_assertThisInitialized(_this3), "storeToDb", function (entity, url) {
      return _get__("from")(_this3.dbHelper.addArtistUrl(entity, url));
    });

    _defineProperty(_assertThisInitialized(_this3), "discOgsImage", function (artistName) {
      var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
      var searchUri = "https://api.discogs.com/database/search?q=".concat(artistName, "&?type=artist&?artist=").concat(artistName);
      var conf = {
        headers: {
          'User-Agent': 'BeetsWebapp',
          'Authorization': 'Discogs token=xIFztFffPlHucUCxpNSybLPOmxnpEOBNQCfqWsdi'
        }
      };
      return _this3.http_get(searchUri, conf, delay).pipe( // restrieving results field
      _get__("flatMap")(function (response) {
        return _get__("from")(response.results);
      }), // default url if no result,
      _get__("defaultIfEmpty")(""), // do some logs
      _get__("tap")(function (result) {
        if (result == "") throw "Image not found on discogs for ".concat(artistName);
      }), // take first result
      _get__("first")(), // retrieve cover_image of the result
      _get__("map")(function (result) {
        return result.cover_image;
      }), _get__("tap")(function (url) {
        return _get__("logger").info("Image found for ".concat(artistName, ": ").concat(url));
      }));
    });

    _defineProperty(_assertThisInitialized(_this3), "musicbrainzImage", function (artistName, delay) {
      var idUri = encodeURI("http://musicbrainz.org/ws/2/artist/?query=artist:".concat(artistName, "&fmt=json"));
      var conf = {
        headers: {
          'User-Agent': 'BeetsWebapp'
        }
      };
      return _this3.http_get(idUri, conf, delay).pipe(_get__("flatMap")(function (response) {
        var artists = response.artists;

        if (!artists || artists.length == 0) {
          throw "no artist found";
        }

        var artistId = artists[0].id;
        var dataUri = encodeURI("http://musicbrainz.org/ws/2/artist/".concat(artistId, "?inc=url-rels&fmt=json"));
        return _this3.http_get(dataUri, conf, delay);
      }), // get stream of relations
      _get__("flatMap")(function (response) {
        return _get__("from")(response.relations);
      }), // get stream of resources
      _get__("map")(function (relation) {
        return relation.url.resource;
      }), // retrieve wikimedia urls only
      _get__("filter")(function (urlResource) {
        return urlResource.match(/wikimedia.+File:/);
      }), // retrieve filename from url
      _get__("map")(function (urlResource) {
        return urlResource.match(/wikimedia.+File:(.*)/)[1];
      }), // retrieve url pointing to filename
      _get__("map")(function (fileName) {
        return "https://commons.wikimedia.org/wiki/Special:FilePath/".concat(fileName, "?width=200");
      }), // default value if artist not found
      _get__("defaultIfEmpty")(""), // get the first one in case serveral images found
      _get__("first")(), // do some logs
      _get__("tap")(function (url) {
        if (url == "") throw "Image not found on musicbrainzfor ".concat(artistName);
      }));
    });

    _defineProperty(_assertThisInitialized(_this3), "getAllEntities", function () {
      return _get__("from")(_this3.beetsHelper.beetsMixedArtists());
    });

    _this3.init();

    return _this3;
  } // START ABSTRACT METHODS
  // END ABSTRACT METHODS


  return ArtistMetadata;
}(_get__("EntityMetadata"));

exports.ArtistMetadata = ArtistMetadata;

var AlbumMetadata =
/*#__PURE__*/
function (_get__3) {
  _inherits(AlbumMetadata, _get__3);

  function AlbumMetadata() {
    var _this4;

    _classCallCheck(this, AlbumMetadata);

    _this4 = _possibleConstructorReturn(this, _getPrototypeOf(AlbumMetadata).call(this));

    _defineProperty(_assertThisInitialized(_this4), "getIgnoredEntities", function () {
      return _get__("of")('');
    });

    _defineProperty(_assertThisInitialized(_this4), "getNotFoundUri", function () {
      return "/assets/unknown.jpg";
    });

    _defineProperty(_assertThisInitialized(_this4), "getFromDB", function (entity) {
      return _get__("from")(_this4.dbHelper.getAlbumUrl(entity)).pipe(_get__("tap")(function (url) {
        if (!url) throw _get__("entityNotStored");
      }));
    });

    _defineProperty(_assertThisInitialized(_this4), "storeToDb", function (albumName, url) {
      return _get__("from")(_this4.dbHelper.addAlbumUrl(albumName, url));
    });

    _defineProperty(_assertThisInitialized(_this4), "discOgsImage", function (albumName) {
      var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
      var searchUri = "https://api.discogs.com/database/search?q=".concat(albumName, "&?type=release&?release=").concat(albumName);
      var conf = {
        headers: {
          'User-Agent': 'BeetsWebapp',
          'Authorization': 'Discogs token=xIFztFffPlHucUCxpNSybLPOmxnpEOBNQCfqWsdi'
        }
      };
      return _this4.http_get(searchUri, conf, delay).pipe( // restrieving results field
      _get__("flatMap")(function (response) {
        return _get__("from")(response.results);
      }), // default url if no result,
      _get__("defaultIfEmpty")(""), // do some logs
      _get__("tap")(function (result) {
        if (result == "") throw "Image not found on discogs for ".concat(albumName);
      }), // take first result
      _get__("first")(), // retrieve cover_image of the result
      _get__("map")(function (result) {
        return result.cover_image;
      }), _get__("tap")(function (url) {
        return _get__("logger").info("Image found for ".concat(albumName, ": ").concat(url));
      }));
    });

    _defineProperty(_assertThisInitialized(_this4), "musicbrainzImage", function (albumName, delay) {
      var idUri = encodeURI("http://musicbrainz.org/ws/2/release/?query=name:".concat(albumName, "&fmt=json"));
      var conf = {
        headers: {
          'User-Agent': 'BeetsWebapp'
        }
      };
      return _this4.http_get(idUri, conf, delay).pipe(_get__("flatMap")(function (response) {
        var releases = response.releases;

        if (!releases || releases.length == 0) {
          throw "no album found";
        }

        var albumId = releases[0].id;
        var dataUri = encodeURI("http://coverartarchive.org/release/".concat(albumId));
        return _this4.http_get(dataUri, conf, delay);
      }), // get stream of relations
      _get__("flatMap")(function (response) {
        return _get__("from")(response.images);
      }), // front images only
      _get__("filter")(function (imagedata) {
        return imagedata.front;
      }), // get image field
      _get__("map")(function (imagedata) {
        return imagedata.thumbnails.small;
      }), // default value if artist not found
      _get__("defaultIfEmpty")(""), // get the first one in case serveral images found
      _get__("first")(), _get__("tap")(function (url) {
        if (url == "") throw "Image not found on musicbrainzfor ".concat(artistName);
      }));
    });

    _defineProperty(_assertThisInitialized(_this4), "getAllEntities", function () {
      return _get__("from")(_this4.beetsHelper.beetsMixedArtists());
    });

    _this4.init();

    return _this4;
  } // START ABSTRACT METHODS
  // END ABSTRACT METHODS


  return AlbumMetadata;
}(_get__("EntityMetadata"));

exports.AlbumMetadata = AlbumMetadata;

function _getGlobalObject() {
  try {
    if (!!global) {
      return global;
    }
  } catch (e) {
    try {
      if (!!window) {
        return window;
      }
    } catch (e) {
      return this;
    }
  }
}

;
var _RewireModuleId__ = null;

function _getRewireModuleId__() {
  if (_RewireModuleId__ === null) {
    var globalVariable = _getGlobalObject();

    if (!globalVariable.__$$GLOBAL_REWIRE_NEXT_MODULE_ID__) {
      globalVariable.__$$GLOBAL_REWIRE_NEXT_MODULE_ID__ = 0;
    }

    _RewireModuleId__ = __$$GLOBAL_REWIRE_NEXT_MODULE_ID__++;
  }

  return _RewireModuleId__;
}

function _getRewireRegistry__() {
  var theGlobalVariable = _getGlobalObject();

  if (!theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__) {
    theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__ = Object.create(null);
  }

  return theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__;
}

function _getRewiredData__() {
  var moduleId = _getRewireModuleId__();

  var registry = _getRewireRegistry__();

  var rewireData = registry[moduleId];

  if (!rewireData) {
    registry[moduleId] = Object.create(null);
    rewireData = registry[moduleId];
  }

  return rewireData;
}

(function registerResetAll() {
  var theGlobalVariable = _getGlobalObject();

  if (!theGlobalVariable['__rewire_reset_all__']) {
    theGlobalVariable['__rewire_reset_all__'] = function () {
      theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__ = Object.create(null);
    };
  }
})();

var INTENTIONAL_UNDEFINED = '__INTENTIONAL_UNDEFINED__';
var _RewireAPI__ = {};
exports.__RewireAPI__ = _RewireAPI__;

(function () {
  function addPropertyToAPIObject(name, value) {
    Object.defineProperty(_RewireAPI__, name, {
      value: value,
      enumerable: false,
      configurable: true
    });
  }

  addPropertyToAPIObject('__get__', _get__);
  addPropertyToAPIObject('__GetDependency__', _get__);
  addPropertyToAPIObject('__Rewire__', _set__);
  addPropertyToAPIObject('__set__', _set__);
  addPropertyToAPIObject('__reset__', _reset__);
  addPropertyToAPIObject('__ResetDependency__', _reset__);
  addPropertyToAPIObject('__with__', _with__);
})();

function _get__(variableName) {
  var rewireData = _getRewiredData__();

  if (rewireData[variableName] === undefined) {
    return _get_original__(variableName);
  } else {
    var value = rewireData[variableName];

    if (value === INTENTIONAL_UNDEFINED) {
      return undefined;
    } else {
      return value;
    }
  }
}

function _get_original__(variableName) {
  switch (variableName) {
    case "utils":
      return _utils.default;

    case "EntityMetadata":
      return EntityMetadata;

    case "BeetsHelper":
      return _beets.BeetsHelper;

    case "DbHelper":
      return _db.default;

    case "axios":
      return _axios.default;

    case "of":
      return _rxjs.of;

    case "flatMap":
      return _operators.flatMap;

    case "from":
      return _rxjs.from;

    case "map":
      return _operators.map;

    case "delayWhen":
      return _operators.delayWhen;

    case "timer":
      return _rxjs.timer;

    case "tap":
      return _operators.tap;

    case "logger":
      return logger;

    case "catchError":
      return _operators.catchError;

    case "quotaExceeded":
      return quotaExceeded;

    case "count":
      return _operators.count;

    case "zip":
      return _rxjs.zip;

    case "iif":
      return _rxjs.iif;

    case "empty":
      return _rxjs.empty;

    case "entityNotStored":
      return entityNotStored;

    case "Subject":
      return _rxjs.Subject;

    case "mergeMap":
      return _operators.mergeMap;

    case "takeUntil":
      return _operators.takeUntil;

    case "mergeScan":
      return _operators.mergeScan;

    case "filter":
      return _operators.filter;

    case "Observable":
      return _rxjs.Observable;

    case "toArray":
      return _operators.toArray;

    case "delay":
      return _operators.delay;

    case "defaultIfEmpty":
      return _operators.defaultIfEmpty;

    case "first":
      return _operators.first;
  }

  return undefined;
}

function _assign__(variableName, value) {
  var rewireData = _getRewiredData__();

  if (rewireData[variableName] === undefined) {
    return _set_original__(variableName, value);
  } else {
    return rewireData[variableName] = value;
  }
}

function _set_original__(variableName, _value) {
  switch (variableName) {}

  return undefined;
}

function _update_operation__(operation, variableName, prefix) {
  var oldValue = _get__(variableName);

  var newValue = operation === '++' ? oldValue + 1 : oldValue - 1;

  _assign__(variableName, newValue);

  return prefix ? newValue : oldValue;
}

function _set__(variableName, value) {
  var rewireData = _getRewiredData__();

  if (_typeof(variableName) === 'object') {
    Object.keys(variableName).forEach(function (name) {
      rewireData[name] = variableName[name];
    });
    return function () {
      Object.keys(variableName).forEach(function (name) {
        _reset__(variableName);
      });
    };
  } else {
    if (value === undefined) {
      rewireData[variableName] = INTENTIONAL_UNDEFINED;
    } else {
      rewireData[variableName] = value;
    }

    return function () {
      _reset__(variableName);
    };
  }
}

function _reset__(variableName) {
  var rewireData = _getRewiredData__();

  delete rewireData[variableName];

  if (Object.keys(rewireData).length == 0) {
    delete _getRewireRegistry__()[_getRewireModuleId__];
  }

  ;
}

function _with__(object) {
  var rewireData = _getRewiredData__();

  var rewiredVariableNames = Object.keys(object);
  var previousValues = {};

  function reset() {
    rewiredVariableNames.forEach(function (variableName) {
      rewireData[variableName] = previousValues[variableName];
    });
  }

  return function (callback) {
    rewiredVariableNames.forEach(function (variableName) {
      previousValues[variableName] = rewireData[variableName];
      rewireData[variableName] = object[variableName];
    });
    var result = callback();

    if (!!result && typeof result.then == 'function') {
      result.then(reset).catch(reset);
    } else {
      reset();
    }

    return result;
  };
}

var _default = _RewireAPI__;
exports.default = _default;