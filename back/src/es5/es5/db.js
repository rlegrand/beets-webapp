"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _sqlite = _interopRequireDefault(require("sqlite3"));

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

var DbHelper = function DbHelper() {
  var _this = this;

  _classCallCheck(this, DbHelper);

  _defineProperty(this, "init", function () {
    _this.db.serialize(function () {
      _this.db.run('CREATE TABLE artistsUrls (artist TEXT, url TEXT)');
    });
  });

  _defineProperty(this, "addArtistUrl", function (artistName, artistUrl) {
    return new Promise(function (resolve, reject) {
      return _this.db.run('INSERT INTO artistsUrls values (?,?)', [artistName, artistUrl], function (err) {
        if (err) reject(err);else resolve();
      });
    });
  });

  _defineProperty(this, "getArtistUrl", function (artistName) {
    return new Promise(function (resolve, reject) {
      return _this.db.get('SELECT * from artistsUrls where artist = ?', [artistName], function (err, row) {
        if (err) reject(err);
        if (row) resolve(row.url);else resolve();
      });
    });
  });

  this.db = new _sqlite.default.Database('/app/data/bw.db');
};

var dbHelper = new DbHelper();
dbHelper.init();
var _default = dbHelper;
exports.default = _default;