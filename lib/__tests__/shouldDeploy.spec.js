"use strict";

var _tempy = _interopRequireDefault(require("tempy"));

var _execa = _interopRequireDefault(require("execa"));

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _findUp = _interopRequireDefault(require("find-up"));

var _os = _interopRequireDefault(require("os"));

var _tempWrite = _interopRequireDefault(require("temp-write"));

var _touch = _interopRequireDefault(require("touch"));

var _shouldDeploy = require("../shouldDeploy");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Contains all relevant git config (user, commit.gpgSign, etc)
const TEMPLATE = _path.default.resolve(__dirname, 'template');

const gitInit = (cwd, ...args) => {
  return (0, _execa.default)('git', ['init', '--template', TEMPLATE, ...args], {
    cwd
  });
};

const gitAdd = (cwd, ...files) => {
  return (0, _execa.default)('git', ['add', ...files], {
    cwd
  });
};

const gitCommit = (cwd, message) => {
  if (message.indexOf(_os.default.EOL) > -1) {
    // Use tempfile to allow multi\nline strings.
    return (0, _tempWrite.default)(message).then(fp => (0, _execa.default)('git', ['commit', '-F', fp], {
      cwd
    }));
  }

  return (0, _execa.default)('git', ['commit', '-m', message], {
    cwd
  });
};

const getLastCommit = (cwd, ...args) => {
  return (0, _execa.default)('git', ['rev-parse', 'HEAD'], {
    cwd
  });
};

const findFixture = (cwd, fixtureName) => {
  return (0, _findUp.default)(_path.default.join('__fixtures__', fixtureName), {
    cwd
  }).then(fixturePath => {
    if (fixturePath === null) {
      throw new Error(`Could not find fixture with name "${fixtureName}"`);
    }

    return fixturePath;
  });
};

const copyFixture = (targetDir, fixtureName, cwd) => {
  return findFixture(cwd, fixtureName).then(fp => _fsExtra.default.copy(fp, targetDir));
};

const initFixture = startDir => {
  return async (fixtureName, commitMessage = 'Init commit') => {
    const cwd = _tempy.default.directory();

    process.chdir(startDir);
    await copyFixture(cwd, fixtureName, startDir);
    await gitInit(cwd, '.');

    if (commitMessage) {
      await gitAdd(cwd, '-A');
      await gitCommit(cwd, commitMessage);
    }

    return cwd;
  };
};

const setupGitChanges = async (cwd, filePaths) => {
  for (const fp of filePaths) {
    const fullPath = _path.default.join(cwd, fp);

    await (0, _touch.default)(fullPath);
  }

  await gitAdd(cwd, '-A');
  await gitCommit(cwd, 'Commit');
};

const getShortCommitHash = hash => {
  return hash.slice(0, 12);
};

it('should deploy package 1 if something inside a folder changed', async () => {
  const packageName = 'package-1';
  const cwd = await initFixture(__dirname)('basic');
  const headCommit = await getLastCommit(cwd);
  await setupGitChanges(cwd, ['packages/package-1/random-file']);
  const changeCommit = await getLastCommit(cwd);
  const compareUrl = `https://github.com/entria/project/compare/${getShortCommitHash(headCommit.stdout)}...${getShortCommitHash(changeCommit.stdout)}`;
  const shouldDeploy = (0, _shouldDeploy.shouldDeployPackage)(cwd)(compareUrl);
  expect((await shouldDeploy(`packages/${packageName}`))).toBe(true);
});
it('should not deploy package 1 if nothing inside a folder changed', async () => {
  const packageName = 'package-1';
  const cwd = await initFixture(__dirname)('basic');
  const headCommit = await getLastCommit(cwd);
  await setupGitChanges(cwd, ['packages/package-2/random-file']);
  const changeCommit = await getLastCommit(cwd);
  const compareUrl = `https://github.com/entria/project/compare/${getShortCommitHash(headCommit.stdout)}...${getShortCommitHash(changeCommit.stdout)}`;
  const shouldDeploy = (0, _shouldDeploy.shouldDeployPackage)(cwd)(compareUrl);
  expect((await shouldDeploy(packageName))).toBe(false);
});
it('should deploy package 3 if package 3 or common package has changed', async () => {
  const packageName = 'package-3';
  const pkgs = [`packages/${packageName}`, 'packages/common'];
  const cwd = await initFixture(__dirname)('basic');
  const headCommit = await getLastCommit(cwd);
  await setupGitChanges(cwd, ['packages/common/random-file']);
  const changeCommit = await getLastCommit(cwd);
  const compareUrl = `https://github.com/entria/project/compare/${getShortCommitHash(headCommit.stdout)}...${getShortCommitHash(changeCommit.stdout)}`;
  const shouldDeploy = (0, _shouldDeploy.shouldDeployPackage)(cwd)(compareUrl);
  expect((await shouldDeploy(pkgs))).toBe(true);
});