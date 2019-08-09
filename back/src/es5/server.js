'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.__GetDependency__ = exports.__get__ = _get__;
exports.__set__ = exports.__Rewire__ = _set__;
exports.__ResetDependency__ = _reset__;
exports.default = exports.__RewireAPI__ = exports.StandaloneServer = void 0;

var _express = _interopRequireDefault(require("express"));

var _http = _interopRequireDefault(require("http"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _beets = require("./beets");

var _db = _interopRequireDefault(require("./db"));

var _utils = _interopRequireDefault(require("./utils"));

var _metadata = require("./metadata");

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var logger = _get__("utils").getLogger();

var defaultConfigCallback = function defaultConfigCallback(appServer) {
  appServer.use(_get__("bodyParser").json()).use(_get__("express").static('/app/front/beetswebapp/'));
};

var StandaloneServer = function StandaloneServer(configServerCallbak) {
  var _this = this;

  _classCallCheck(this, StandaloneServer);

  _defineProperty(this, "buildBeetsApi", function (appServer) {
    appServer.post('/api/beets/songs', function (req, res, next) {
      var filter = req.body.beetsfilter;

      _get__("logger").debug("Using beet filter ".concat(filter));

      _this.beetsHelper.beetsSongsRequest(filter).then(function (songs) {
        res.send({
          songs: songs
        });
      }).catch(next);
    });
    appServer.post('/api/beets/artists', function (req, res, next) {
      _get__("logger").info("Retrieving all artists and albumartists");

      var artistsObs = _get__("from")(_this.beetsHelper.beetsMixedArtists()).pipe(_get__("mergeMap")(function (artists) {
        return _get__("from")(artists);
      }), _get__("utils").onDevRx(_this, _get__("take"), 10), _get__("utils").onDevRx(_this, _get__("tap"), function (artist) {
        return _get__("logger").debug("Treating artist ".concat(artist.name));
      }), _get__("mergeMap")(function (artist) {
        return _get__("zip")(_get__("of")(artist), _this.artistMetaHelper.getImageOnly(artist.name));
      }), _get__("map")(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            artist = _ref2[0],
            url = _ref2[1];

        artist.url = url;
        return artist;
      }), _get__("toArray")()).toPromise().then(function (artists) {
        res.send({
          data: artists
        });
      }).catch(next);
    });
    appServer.post('/api/beets/albums', function (req, res, next) {
      _get__("logger").info("Retrieving all albums");

      var artistsObs = _get__("from")(_this.beetsHelper.beetsAlbums()).pipe(_get__("mergeMap")(function (albums) {
        return _get__("from")(albums);
      }), _get__("utils").onDevRx(_this, _get__("take"), 10), _get__("utils").onDevRx(_this, _get__("tap"), function (album) {
        return _get__("logger").debug("Treating album ".concat(album.name));
      }), _get__("mergeMap")(function (album) {
        return _get__("zip")(_get__("of")(album), _this.albumMetaHelper.getImageOnly(album.name));
      }), _get__("map")(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            album = _ref4[0],
            url = _ref4[1];

        album.url = url;
        return album;
      }), _get__("toArray")()).toPromise().then(function (albums) {
        res.send({
          data: albums
        });
      }).catch(next);
    });
  });

  _defineProperty(this, "initServer", function () {
    var appServer = _get__("express")();

    _this.configServerCallbak(appServer);

    var beetsConf = _this.beetsHelper.getBeetsConfig();

    var logError = function logError(err, req, res, next) {
      _get__("logger").error('middleware detected error');

      _get__("logger").error(err.stack);

      res.status(500).send({});
      next(err);
    };

    _this.buildBeetsApi(appServer);

    appServer.use(_get__("express").static(beetsConf.directory));
    appServer.use(logError);
    return _get__("http").createServer(appServer);
  });

  _defineProperty(this, "getServer", function () {
    return _this.server;
  });

  _defineProperty(this, "run", function (port) {
    _this.server.listen(port, function () {
      _get__("logger").info("server listening on ".concat(port));
    });
  });

  this.configServerCallbak = configServerCallbak ? configServerCallbak : _get__("defaultConfigCallback");
  this.beetsHelper = new (_get__("BeetsHelper"))();
  this.server = this.initServer();
  this.artistMetaHelper = new (_get__("ArtistMetadata"))();
  this.albumMetaHelper = new (_get__("AlbumMetadata"))();
};

exports.StandaloneServer = StandaloneServer;
;

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

    case "bodyParser":
      return _bodyParser.default;

    case "express":
      return _express.default;

    case "defaultConfigCallback":
      return defaultConfigCallback;

    case "BeetsHelper":
      return _beets.BeetsHelper;

    case "ArtistMetadata":
      return _metadata.ArtistMetadata;

    case "AlbumMetadata":
      return _metadata.AlbumMetadata;

    case "logger":
      return logger;

    case "from":
      return _rxjs.from;

    case "mergeMap":
      return _operators.mergeMap;

    case "take":
      return _operators.take;

    case "tap":
      return _operators.tap;

    case "zip":
      return _rxjs.zip;

    case "of":
      return _rxjs.of;

    case "map":
      return _operators.map;

    case "toArray":
      return _operators.toArray;

    case "http":
      return _http.default;
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