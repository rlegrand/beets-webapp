'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BeetsHelper = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var path = require('path'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    yaml = require('js-yaml');

var BeetsHelper = function BeetsHelper() {
  var _this = this;

  _classCallCheck(this, BeetsHelper);

  _defineProperty(this, "beetRequest", function () {
    return new Promise(function (resolve, reject) {
      var updatedArgs = ['-c', _this.getBeetsConfigPath()].concat(args);
      var beet = spawn('beet', updatedArgs, {
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

  _defineProperty(this, "getBeetsConfigPath", function () {
    if (!_this.beetsConfPath) {
      _this.beetsConfPath = '/app/beets/config/config.yaml';
    }

    return _this.beetsConfPath;
  });

  _defineProperty(this, "getBeetsConfig", function () {
    if (!_this.beetsConf) {
      _this.beetsConf = yaml.safeLoad(fs.readFileSync(_this.getBeetsConfigPath(), 'utf8'));
    }

    return _this.beetsConf;
  });
};

exports.BeetsHelper = BeetsHelper;