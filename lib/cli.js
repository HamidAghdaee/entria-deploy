"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = void 0;

require("@babel/polyfill");

var _yargs = _interopRequireDefault(require("yargs"));

var _shouldDeploy = require("./shouldDeploy");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const usage = 'Usage: $0 <package-folder-name> <another-package-folder-name>';
const docs = 'Documentation: https://github.com/entria/entria-deploy';

const run = async (argv, project) => {
  argv = (0, _yargs.default)(argv || process.argv.slice(2)).usage(usage).epilogue(docs).help().argv;
  const shouldDeploy = (0, _shouldDeploy.shouldDeployPackage)(process.cwd())(process.env.CIRCLE_COMPARE_URL);
  const result = await shouldDeploy(argv._.map(pkg => `packages/${pkg}`));
  console.log('result: ', result);

  if (result) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

exports.run = run;