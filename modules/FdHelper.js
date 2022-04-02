let fs = require('fs');

module.exports.dir = async function (dir) {
  if (!dir) {
    throw new TypeError('Missing dir error');
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

module.exports.file = async function (file) {
  if (!file) {
    throw new TypeError('Missing file error');
  }
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file);
  }
};
