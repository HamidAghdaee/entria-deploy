"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shouldDeployPackage = exports.getCommitRange = void 0;

var _execa = _interopRequireDefault(require("execa"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
CIRCLE_COMPARE_URL=https://github.com/owner/repo/compare/9324164e3f51...8aaaec63a3a6
  CIRCLE_COMPARE_URL=https://github.com/owner/repo/compare/37ac69404a5b...69bc6e3fe337
 CIRCLE_COMPARE_URL=https://github.com/owner/repo/commit/d11b95d4ee18

 CIRCLE_COMPARE_URL=https://github.com/owner/repo/compare/9324164e3...a2e2709c4

 LAST_HEAD...CHANGED_COMMIT
*/
const gitDiff = (cwd, ...args) => {
  return (0, _execa.default)("git", ["diff", ...args], {
    cwd
  });
}; // if (!process.env.CIRCLE_COMPARE_URL) return null;


const getCommitRange = compareUrl => {
  if (!compareUrl) return null;
  const re = /compare\/([0-9a-z]+)\.\.\.([0-9a-z]+)$/;
  const matches = compareUrl.match(re);

  if (matches && matches.length === 3) {
    return `${matches[1]}...${matches[2]}`;
  }

  return null;
};

exports.getCommitRange = getCommitRange;

const shouldDeployPackage = cwd => compareUrl => async pkg => {
  const commitRange = getCommitRange(compareUrl);
  console.log("commitrange", commitRange);
  if (!commitRange) return false;

  try {
    const pkgs = Array.isArray(pkg) ? pkg : [pkg];
    const changes = await gitDiff(cwd, commitRange, "--name-only", ...pkgs);
    console.log("changes", changes);
    return changes.stdout !== "";
  } catch (err) {
    console.log("err: ", err);
    return false;
  }
};

exports.shouldDeployPackage = shouldDeployPackage;