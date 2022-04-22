const Oas = require('oas').default;

module.exports = function createOas(method) {
  return function (path, operation) {
    return new Oas({
      paths: {
        [path]: {
          [method]: operation,
        },
      },
    });
  };
};
