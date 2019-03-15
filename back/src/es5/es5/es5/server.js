'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StandaloneServer = void 0;

var _express = _interopRequireDefault(require("express"));

var _http = _interopRequireDefault(require("http"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _beets = require("./beets");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var defaultConfigCallback = function defaultConfigCallback(appServer) {
  appServer.use(_bodyParser.default.json()).use(_express.default.static('/app/front/beetswebapp/'));
};

var StandaloneServer = function StandaloneServer(configServerCallbak) {
  var _this = this;

  _classCallCheck(this, StandaloneServer);

  _defineProperty(this, "buildBeetsApi", function (appServer) {
    appServer.post('/api/beets/songs', function (req, res) {
      var filter = req.body.beetsfilter;
      console.log("Using beet filter ".concat(filter));

      _this.beetsHelper.beetsSongsRequest(filter).then(function (songs) {
        res.send({
          songs: songs
        });
      }).catch(function (err) {
        console.error(err);
        res.send(err);
      });
    });
    appServer.post('/api/beets/albumartists', function (req, res) {
      console.log("Retrieving all album artists");

      _this.beetsHelper.beetsAlbumArists().then(function (albumArtists) {
        res.send({
          data: albumArtists
        });
      }).catch(function (err) {
        console.error(err);
        res.send(err);
      });
    });
    appServer.post('/api/beets/albums', function (req, res) {
      console.log("Retrieving all albums");

      _this.beetsHelper.beetsAlbums().then(function (albums) {
        res.send({
          data: albums
        });
      }).catch(function (err) {
        console.error(err);
        res.send(err);
      });
    });
  });

  _defineProperty(this, "initServer", function () {
    var appServer = (0, _express.default)();

    _this.configServerCallbak(appServer);

    var beetsConf = _this.beetsConf.getBeetsConfig();

    appServer.use(_express.default.static(beetsConf.directory));

    _this.buildBeetsApi(appServer);

    return _http.default.createServer(appServer);
  });

  _defineProperty(this, "getServer", function () {
    return _this.server;
  });

  _defineProperty(this, "run", function (port) {
    _this.server.listen(port, function () {
      console.log("server listening on ".concat(port));
    });
  });

  this.configServerCallbak = configServerCallbak ? configServerCallbak : defaultConfigCallback;
  this.server = this.initServer();
  this.beetsHelper = new _beets.BeetsHelper();
};

exports.StandaloneServer = StandaloneServer;
;