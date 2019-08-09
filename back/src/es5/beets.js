'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.__GetDependency__ = exports.__get__ = _get__;
exports.__set__ = exports.__Rewire__ = _set__;
exports.__ResetDependency__ = _reset__;
exports.default = exports.__RewireAPI__ = exports.BeetsHelper = void 0;

var _path = _interopRequireDefault(require("path"));

var _child_process = require("child_process");

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _fs = _interopRequireDefault(require("fs"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _utils = _interopRequireDefault(require("./utils.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var logger = _get__("myutils").getLogger();

var BeetsHelper =
/*#__PURE__*/
function () {
  function BeetsHelper() {
    var _this = this;

    _classCallCheck(this, BeetsHelper);

    _defineProperty(this, "beetRequest", function (args) {
      return new Promise(function (resolve, reject) {
        var updatedArgs = ['-c', _this.beetsConfPath].concat(_toConsumableArray(args));

        _get__("logger").debug("Beets args: ".concat(updatedArgs.join(' ')));

        var beet = _get__("spawn")('beet', updatedArgs, {
          shell: true
        });

        var res = '';
        beet.stdout.on('data', function (data) {
          var dataStr = data.toString();
          res += dataStr;
        });
        beet.on('close', function (code) {
          resolve(res.split('\n').filter(function (elt, idx) {
            return elt && elt.trim().length > 0;
          }));
        });
      });
    });

    _defineProperty(this, "parseDelimString", function (toParse, delim, mapFields, unicityField) {
      return _get__("from")(toParse).pipe(_get__("mergeMap")(function (singleElt) {
        return _get__("from")(singleElt.split(delim)).pipe(_get__("map")(function (subElt) {
          return subElt.trim();
        }), _get__("reduce")(function (acc, current, index) {
          acc[mapFields[index]] = current;
          return acc;
        }, {}));
      }), _get__("filter")(function (singleElt) {
        return singleElt[unicityField].trim().length > 0;
      }), _get__("groupBy")(function (singleElt) {
        return singleElt[unicityField];
      }), _get__("mergeMap")(function (group) {
        return group.pipe(_get__("first")());
      }), _get__("toArray")()).toPromise();
    });

    _defineProperty(this, "parseSongsString", function (songsString, delim) {
      return _this.parseDelimString(songsString, delim, ['path', 'artist', 'album', 'title'], 'path');
    });

    _defineProperty(this, "getArtistsFromString", function (artistsString, delim, mainField) {
      return _get__("from")(_this.parseDelimString(artistsString, delim, ['name', 'addedDate', 'fields'], 'name')).pipe(_get__("mergeMap")(function (artistsArray) {
        return _get__("from")(artistsArray);
      }), _get__("map")(function (artist) {
        artist.fields = [artist.fields];
        artist.mainField = mainField;
        artist.addedDate = _get__("myutils").getDate(artist.addedDate);
        return artist;
      }), _get__("toArray")()).toPromise();
    });

    _defineProperty(this, "getAlbumsFromString", function (albumsString, delim, mainField) {
      return _get__("from")(_this.parseDelimString(albumsString, delim, ['name', 'addedDate', 'fields'], 'name')).pipe(_get__("mergeMap")(function (albumsArray) {
        return _get__("from")(albumsArray);
      }), _get__("map")(function (album) {
        album.fields = [album.fields];
        album.mainField = mainField;
        album.addedDate = _get__("myutils").getDate(album.addedDate);
        return album;
      }), _get__("toArray")()).toPromise();
    });

    _defineProperty(this, "beetsSongsRequest", function (filter) {
      var delim = '<#>';
      return _this.beetRequest(['ls', '-f', "'$path".concat(delim, "$artist").concat(delim, "$album").concat(delim, "$title'"), filter]).then(function (songs) {
        return _this.parseSongsString(songs, delim);
      });
    });

    _defineProperty(this, "beetsAlbumArtists", function () {
      var delim = '<#>';
      return _this.beetRequest(['ls', '-a', 'added-', '-f', "'$albumartist".concat(delim, "$added").concat(delim, "albumartist'")]).then(function (albumartist) {
        return _this.getArtistsFromString(albumartist, delim, 'albumartist');
      });
    });

    _defineProperty(this, "beetsArtists", function () {
      var delim = '<#>';
      return _this.beetRequest(['ls', 'added-', "-f", "'$artist".concat(delim, "$added").concat(delim, "artist'")]).then(function (artist) {
        return _this.getArtistsFromString(artist, delim, 'artist');
      });
    });

    _defineProperty(this, "beetsMixedArtists", function () {
      return _get__("zip")(_get__("from")(_this.beetsAlbumArtists()), _get__("from")(_this.beetsArtists())).pipe(_get__("mergeMap")(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            albumsArtists = _ref2[0],
            artists = _ref2[1];

        return albumsArtists.concat(artists);
      }), _get__("groupBy")(function (artist) {
        return artist.name;
      }), _get__("mergeMap")(function (group) {
        return group.pipe(_get__("reduce")(function (accumulated, current) {
          current.fields = [].concat(_toConsumableArray(accumulated.fields), _toConsumableArray(current.fields));
          return current;
        }, {
          fields: []
        }));
      }), _get__("toArray")(), _get__("map")(function (arr) {
        return arr.sort(function (a1, a2) {
          return {
            true: -1,
            false: 1
          }[a1.name < a2.name];
        });
      })).toPromise();
    });

    _defineProperty(this, "beetsAlbums", function () {
      var delim = '<#>';
      return _this.beetRequest(['ls', 'added-', "-f", "'$album".concat(delim, "$added").concat(delim, "album'")]).then(function (albums) {
        return _this.getAlbumsFromString(albums, delim, 'album');
      }).then(function (albums) {
        return albums.sort(function (a1, a2) {
          return {
            true: -1,
            false: 1
          }[a1.name < a2.name];
        });
      });
    });

    _defineProperty(this, "getBeetsConfig", function () {
      return _this.beetsConf;
    });

    _defineProperty(this, "getLastModificationDate", function () {
      return new Promise(function (resolve, reject) {
        return _get__("fs").stat(_this.beetsConfPath, function (err, resp) {
          if (err) reject(err);
          resolve(resp.mtimt);
        });
      });
    });

    _defineProperty(this, "rememberDateConf", function () {
      return _this.savedModificationDate = _this.getLastModificationDate();
    });

    _defineProperty(this, "confChanged", function () {
      return Promise.all([_this.getLastModificationDate(), _this.savedModificationDate]).then(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            lastModif = _ref4[0],
            savedModif = _ref4[1];

        return lastModif > savedModif;
      });
    });

    this.init.bind(this);
    this.init();
  } // Init convention
  // classic function so it can be mocked


  _createClass(BeetsHelper, [{
    key: "init",
    value: function init() {
      this.beetsConfPath = '/app/beets/config/config.yaml';
      this.beetsConf = _get__("yaml").safeLoad(_get__("fs").readFileSync(this.beetsConfPath, 'utf8'));
      this.rememberDateConf();
    }
  }]);

  return BeetsHelper;
}();

exports.BeetsHelper = BeetsHelper;

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
    case "myutils":
      return _utils.default;

    case "yaml":
      return _jsYaml.default;

    case "fs":
      return _fs.default;

    case "logger":
      return logger;

    case "spawn":
      return _child_process.spawn;

    case "from":
      return _rxjs.from;

    case "mergeMap":
      return _operators.mergeMap;

    case "map":
      return _operators.map;

    case "reduce":
      return _operators.reduce;

    case "filter":
      return _operators.filter;

    case "groupBy":
      return _operators.groupBy;

    case "first":
      return _operators.first;

    case "toArray":
      return _operators.toArray;

    case "zip":
      return _rxjs.zip;
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