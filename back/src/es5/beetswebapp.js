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
  exit(-1);
}

var action = args._[0];

switch (action) {
  case 'server':
    new _server.StandaloneServer().run(80);
    break;

  case 'genmetadata':
    new _metadata.ArtistMetadata().store();
    break;
}