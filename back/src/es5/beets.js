'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BeetsHelper = void 0;

var _path = _interopRequireDefault(require("path"));

var _child_process = require("child_process");

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _fs = _interopRequireDefault(require("fs"));

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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var BeetsHelper = function BeetsHelper() {
  var _this = this;

  _classCallCheck(this, BeetsHelper);

  _defineProperty(this, "beetRequest", function (args) {
    return new Promise(function (resolve, reject) {
      var updatedArgs = ['-c', _this.beetsConfPath].concat(_toConsumableArray(args));
      console.log("Beets args: ".concat(updatedArgs.join(' ')));
      var beet = (0, _child_process.spawn)('beet', updatedArgs, {
        shell: true
      });
      var res = '';
      beet.stdout.on('data', function (data) {
        var dataStr = data.toString(); //console.log('data retrieved:');
        //console.log(dataStr);

        res += dataStr;
      });
      beet.on('close', function (code) {
        resolve(res.split('\n').filter(function (elt, idx) {
          return elt && elt.trim().length > 0;
        }));
      });
    });
  });

  _defineProperty(this, "beetsSongsRequest", function (filter) {
    var delim = '<#>',
        args = ['ls', '-f', "'$path ".concat(delim, " $artist ").concat(delim, " $album ").concat(delim, " $title'"), filter];
    return _this.beetRequest(args).then(function (data) {
      return data.map(function (elt, idx) {
        var delimedElt = elt.split(delim).map(function (elt, idx) {
          return elt.trim();
        });
        var res = {
          path: delimedElt[0].substring(_this.getBeetsConfig().directory.length),
          artist: delimedElt[1],
          album: delimedElt[2],
          title: delimedElt[3] // console.log('data returned:');
          // console.log(res);

        };
        return res;
      });
    });
  });

  _defineProperty(this, "beetsAlbumArists", function () {
    var delim = '<#>';
    var artists = [];
    return _this.beetRequest(['ls', '-a', 'added-', '-f', "'$albumartist ".concat(delim, " $added'")]).then(function (data) {
      return data.map(function (elt, idx) {
        var delimedElt = elt.split(delim).map(function (elt, idx) {
          return elt.trim();
        });
        return {
          name: delimedElt[0],
          addedDate: delimedElt[1]
        };
      }).filter(function (elt, idx) {
        var keep = artists.indexOf(elt.name) == -1;

        if (keep) {
          artists.push(elt.name);
          return true;
        }

        return false;
      });
    });
  });

  _defineProperty(this, "beetsArists", function () {
    return _this.beetRequest(['ls', '-af', "'$albumartist'"]).then(function (data) {
      return data.sort(function (w1, w2) {
        var w1l = w1.toLowerCase();
        var w2l = w2.toLowerCase();
        if (w1l < w2l) return -1;
        if (w1l > w2l) return 1;
        return 0;
      }).filter(function (elt, idx, self) {
        return idx == self.indexOf(elt);
      });
    });
  });

  _defineProperty(this, "beetsAlbums", function () {
    return _this.beetRequest(['ls', '-af', "'$album'"]).then(function (data) {
      var res = data.sort(function (w1, w2) {
        var w1l = w1.toLowerCase();
        var w2l = w2.toLowerCase();
        if (w1l < w2l) return -1;
        if (w1l > w2l) return 1;
        return 0;
      });
      return res.map(function (elt, idx) {
        return {
          name: elt
        };
      });
      ;
    });
  });

  _defineProperty(this, "getBeetsConfig", function () {
    return _this.beetsConf;
  });

  _defineProperty(this, "getLastModificationDate", function () {
    return new Promise(function (resolve, reject) {
      return _fs.default.stat(_this.beetsConfPath, function (err, resp) {
        if (err) reject(err);
        resolve(resp.mtimt);
      });
    });
  });

  _defineProperty(this, "rememberDateConf", function () {
    return _this.savedModificationDate = _this.getLastModificationDate();
  });

  _defineProperty(this, "confChanged", function () {
    return Promise.all([_this.getLastModificationDate(), _this.savedModificationDate]).then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          lastModif = _ref2[0],
          savedModif = _ref2[1];

      return lastModif > savedModif;
    });
  });

  this.beetsConfPath = '/app/beets/config/config.yaml';
  this.beetsConf = _jsYaml.default.safeLoad(_fs.default.readFileSync(this.beetsConfPath, 'utf8'));
  this.rememberDateConf();
};

exports.BeetsHelper = BeetsHelper;