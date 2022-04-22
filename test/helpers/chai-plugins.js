/* eslint-disable no-underscore-dangle */
const chai = require('chai');
const validate = require('har-validator');

module.exports = function chaiPlugins(_chai, utils) {
  utils.addProperty(chai.Assertion.prototype, 'har', async function () {
    const isValid = await validate.request(this._obj.log.entries[0].request);

    this.assert(isValid, 'expected #{this} to be a valid HAR', 'expected #{this} to not a valid HAR');
  });
};
