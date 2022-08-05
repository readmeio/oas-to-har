/* eslint-disable no-underscore-dangle */
import chai from 'chai';
import validate from 'har-validator';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface Assertion {
      /**
       * Assert that a HAR is valid.
       */
      har: void;
    }
  }
}

export default function chaiPlugins(_chai, utils) {
  utils.addProperty(chai.Assertion.prototype, 'har', async function () {
    const isValid = await validate.request(this._obj.log.entries[0].request);

    this.assert(isValid, 'expected #{this} to be a valid HAR', 'expected #{this} to not a valid HAR');
  });
}
