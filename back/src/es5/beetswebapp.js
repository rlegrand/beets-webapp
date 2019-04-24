"use strict";

var _minimist = _interopRequireDefault(require("minimist"));

var _metadata = require("./metadata");

var _server = require("./server");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var args = (0, _minimist.default)(process.argv.slice(2));
var usage = "node beetswebapp [server] [genmetadata]";

if (args._.length > 1 || ['server', 'genmetadata'].filter(function (action) {
  return args._[0] == action;
}).length == 0) {
  console.error(usage);
  process.exit(-1);
}

var action = args._[0];

switch (action) {
  case 'server':
    var server = new _server.StandaloneServer();
    server.run(80);
    break;

  case 'genmetadata':
    var artistmeta = new _metadata.ArtistMetadata();
    artistmeta.store().subscribe(function () {
      return console.log("metadata generation complete");
    });
    break;
}