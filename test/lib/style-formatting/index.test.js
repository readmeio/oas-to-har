const chai = require('chai');
const { expect } = require('chai');

const oasToHar = require('../../../src');

const chaiPlugins = require('../../helpers/chai-plugins');

const createOas = require('../../__fixtures__/create-oas')('get');
const {
  emptyInput,
  undefinedInput,
  stringInput,
  stringInputEncoded,
  arrayInput,
  arrayInputEncoded,
  undefinedArrayInput,
  objectInput,
  objectNestedObject,
  objectNestedObjectOfARidiculiousShape,
  objectInputEncoded,
  undefinedObjectInput,
} = require('../../__fixtures__/style-data');

chai.use(chaiPlugins);

const semicolon = ';'; // %3B when encoded, which we don't want
const equals = '='; // %3D when encoded, which we don't want
const comma = ','; // %2C when encoded, which we don't want

describe('style formatting', function () {
  it('should not crash on uri decoding errors', async function () {
    const oas = createOas('/query', {
      parameters: [
        {
          name: 'width',
          in: 'query',
        },
      ],
    });

    // `decodeURIComponent('20%')` will throw an exception that we don't want to crash the library.
    let formData = { query: { width: '20%' } };
    let har = oasToHar(oas, oas.operation('/query', 'get'), formData);
    await expect(har).to.be.a.har;

    expect(har.log.entries[0].request.queryString).to.deep.equal([{ name: 'width', value: '20%25' }]);

    // However if `20%` has been encoded we should still be able to determine that because it'll decode properly.
    formData = { query: { width: encodeURIComponent('20%') } };
    har = oasToHar(oas, oas.operation('/query', 'get'), formData);
    await expect(har).to.be.a.har;

    expect(har.log.entries[0].request.queryString).to.deep.equal([{ name: 'width', value: '20%25' }]);
  });

  it('should not crash for `explode: true` and `default: null` combinations', function () {
    const oas = createOas('/query', {
      parameters: [
        {
          in: 'query',
          name: 'pet_id',
          required: false,
          explode: true,
          schema: {
            type: 'string',
            default: null,
          },
        },
      ],
    });

    expect(() => {
      oasToHar(oas, oas.operation('/query', 'get'), { query: { pet_id: null } });
    }).not.to.throw(TypeError);
  });

  describe('path parameters', function () {
    describe('matrix path', function () {
      const paramNoExplode = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: false,
          },
        ],
      };

      const paramExplode = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'matrix',
            explode: true,
          },
        ],
      };

      // eslint-disable-next-line mocha/no-setup-in-describe
      [
        [
          'should support matrix path styles non exploded empty input',
          paramNoExplode,
          { path: { color: emptyInput } },
          `https://example.com/style-path/${semicolon}color`,
        ],
        [
          'should support matrix path styles styles for exploded empty input',
          paramExplode,
          { path: { color: emptyInput } },
          `https://example.com/style-path/${semicolon}color`,
        ],
        [
          'should support matrix path styles non exploded undefined input',
          paramNoExplode,
          { path: { color: undefinedInput } },
          `https://example.com/style-path/${semicolon}color`,
        ],
        [
          'should support matrix path styles styles for exploded undefined input',
          paramExplode,
          { path: { color: undefinedInput } },
          `https://example.com/style-path/${semicolon}color`,
        ],
        [
          'should support matrix path styles non exploded undefined array input',
          paramNoExplode,
          { path: { color: undefinedArrayInput } },
          `https://example.com/style-path/${semicolon}color`,
        ],
        [
          'should support matrix path styles styles for exploded undefined array input',
          paramExplode,
          { path: { color: undefinedArrayInput } },
          `https://example.com/style-path/${semicolon}color`,
        ],
        [
          'should support matrix path styles non exploded undefined object input',
          paramNoExplode,
          { path: { color: undefinedObjectInput } },
          `https://example.com/style-path/${semicolon}color${equals}R${comma}`,
        ],
        [
          'should support matrix path styles styles for exploded undefined object input',
          paramExplode,
          { path: { color: undefinedObjectInput } },
          `https://example.com/style-path/${semicolon}R${equals}`,
        ],
        [
          'should support matrix path styles styles for non exploded string input',
          paramNoExplode,
          { path: { color: stringInput } },
          `https://example.com/style-path/${semicolon}color${equals}blue`,
        ],
        [
          'should support matrix path styles styles for exploded string input',
          paramExplode,
          { path: { color: stringInput } },
          `https://example.com/style-path/${semicolon}color${equals}blue`,
        ],
        [
          'should support matrix path styles styles for non exploded array input',
          paramNoExplode,
          { path: { color: arrayInput } },
          `https://example.com/style-path/${semicolon}color${equals}blue${comma}black${comma}brown`,
        ],
        [
          'should support matrix path styles styles for exploded array input',
          paramExplode,
          { path: { color: arrayInput } },
          `https://example.com/style-path/${semicolon}color${equals}blue${semicolon}color${equals}black${semicolon}color${equals}brown`,
        ],
        [
          'should support matrix path styles styles for non exploded object input',
          paramNoExplode,
          { path: { color: objectInput } },
          `https://example.com/style-path/${semicolon}color${equals}R${comma}100${comma}G${comma}200${comma}B${comma}150`,
        ],
        [
          'should support matrix path styles styles for exploded object input',
          paramExplode,
          { path: { color: objectInput } },
          `https://example.com/style-path/${semicolon}R${equals}100${semicolon}G${equals}200${semicolon}B${equals}150`,
        ],
      ].forEach(([test, operation, formData, expected]) => {
        it(test, async function () {
          const oas = createOas('/style-path/{color}', operation);
          const har = oasToHar(oas, oas.operation('/style-path/{color}', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.url).to.equal(expected);
        });
      });
    });

    describe('label path', function () {
      const paramNoExplode = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: false,
          },
        ],
      };

      const paramExplode = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'label',
            explode: true,
          },
        ],
      };

      // eslint-disable-next-line mocha/no-setup-in-describe
      [
        [
          'should support label path styles non exploded empty input',
          paramNoExplode,
          { path: { color: emptyInput } },
          'https://example.com/style-path/.',
        ],
        [
          'should support label path styles styles for exploded empty input',
          paramExplode,
          { path: { color: emptyInput } },
          'https://example.com/style-path/.',
        ],
        [
          'should support label path styles styles for non exploded string input',
          paramNoExplode,
          { path: { color: stringInput } },
          'https://example.com/style-path/.blue',
        ],
        [
          'should support label path styles styles for exploded string input',
          paramExplode,
          { path: { color: stringInput } },
          'https://example.com/style-path/.blue',
        ],
        [
          'should support label path styles styles for non exploded array input',
          paramNoExplode,
          { path: { color: arrayInput } },
          'https://example.com/style-path/.blue.black.brown',
        ],
        [
          'should support label path styles styles for exploded array input',
          paramExplode,
          { path: { color: arrayInput } },
          'https://example.com/style-path/.blue.black.brown',
        ],
        [
          'should support label path styles styles for non exploded object input',
          paramNoExplode,
          { path: { color: objectInput } },
          'https://example.com/style-path/.R.100.G.200.B.150',
        ],
        [
          'should support label path styles styles for exploded object input',
          paramExplode,
          { path: { color: objectInput } },
          `https://example.com/style-path/.R${equals}100.G${equals}200.B${equals}150`,
        ],
      ].forEach(([test, operation, formData, expected]) => {
        it(test, async function () {
          const oas = createOas('/style-path/{color}', operation);
          const har = oasToHar(oas, oas.operation('/style-path/{color}', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.url).to.equal(expected);
        });
      });
    });

    describe('simple path', function () {
      const paramNoExplode = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: false,
          },
        ],
      };

      const paramExplode = {
        parameters: [
          {
            name: 'color',
            in: 'path',
            style: 'simple',
            explode: true,
          },
        ],
      };

      // eslint-disable-next-line mocha/no-setup-in-describe
      [
        [
          'should NOT support simple path styles non exploded empty input',
          paramNoExplode,
          { path: { color: emptyInput } },
          'https://example.com/style-path/',
        ],
        [
          'should NOT support simple path styles styles for exploded empty input',
          paramExplode,
          { path: { color: emptyInput } },
          'https://example.com/style-path/',
        ],
        [
          'should support simple path styles styles for non exploded string input',
          paramNoExplode,
          { path: { color: stringInput } },
          'https://example.com/style-path/blue',
        ],
        [
          'should support simple path styles styles for exploded string input',
          paramExplode,
          { path: { color: stringInput } },
          'https://example.com/style-path/blue',
        ],
        [
          'should support simple path styles styles for non exploded array input',
          paramNoExplode,
          { path: { color: arrayInput } },
          `https://example.com/style-path/blue${comma}black${comma}brown`,
        ],
        [
          'should support simple path styles styles for exploded array input',
          paramExplode,
          { path: { color: arrayInput } },
          `https://example.com/style-path/blue${comma}black${comma}brown`,
        ],
        [
          'should support simple path styles styles for non exploded object input',
          paramNoExplode,
          { path: { color: objectInput } },
          `https://example.com/style-path/R${comma}100${comma}G${comma}200${comma}B${comma}150`,
        ],
        [
          'should support simple path styles styles for exploded object input',
          paramExplode,
          { path: { color: objectInput } },
          `https://example.com/style-path/R${equals}100${comma}G${equals}200${comma}B${equals}150`,
        ],
      ].forEach(([test, operation, formData, expected]) => {
        it(test, async function () {
          const oas = createOas('/style-path/{color}', operation);
          const har = oasToHar(oas, oas.operation('/style-path/{color}', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.url).to.equal(expected);
        });
      });
    });
  });

  describe('query parameters', function () {
    describe('form style', function () {
      const paramNoExplode = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'form',
            explode: false,
          },
        ],
      };

      const paramReserved = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'form',
            allowReserved: true,
          },
        ],
      };

      const paramExplode = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'form',
            explode: true,
          },
        ],
      };

      // eslint-disable-next-line mocha/no-setup-in-describe
      [
        [
          'should support form delimited query styles for non exploded empty input',
          paramNoExplode,
          { query: { color: emptyInput } },
          [{ name: 'color', value: '' }],
        ],
        [
          'should support form delimited query styles for exploded empty input',
          paramExplode,
          { query: { color: emptyInput } },
          [{ name: 'color', value: '' }],
        ],
        [
          'should support form delimited query styles for non exploded string input',
          paramNoExplode,
          { query: { color: stringInput } },
          [{ name: 'color', value: 'blue' }],
        ],
        [
          'should support form delimited query styles for non exploded string input and NOT encode already encoded values',
          paramNoExplode,
          { query: { color: stringInputEncoded } },
          [{ name: 'color', value: 'something%26nothing%3Dtrue' }],
        ],
        [
          'should support form delimited query styles for exploded string input',
          paramExplode,
          { query: { color: stringInput } },
          [{ name: 'color', value: 'blue' }],
        ],
        [
          'should support form delimited query styles for exploded string input and NOT encode already encoded values',
          paramExplode,
          { query: { color: stringInputEncoded } },
          [{ name: 'color', value: 'something%26nothing%3Dtrue' }],
        ],
        [
          'should support form delimited query styles for non exploded array input',
          paramNoExplode,
          { query: { color: arrayInput } },
          [{ name: 'color', value: 'blue,black,brown' }],
        ],
        [
          'should support form delimited query styles for non exploded array input and NOT encode already encoded values',
          paramNoExplode,
          { query: { color: arrayInputEncoded } },
          [{ name: 'color', value: 'something%26nothing%3Dtrue,hash%23data' }],
        ],
        [
          'should support form delimited query styles for exploded array input',
          paramExplode,
          { query: { color: arrayInput } },
          [
            { name: 'color', value: 'blue' },
            { name: 'color', value: 'black' },
            { name: 'color', value: 'brown' },
          ],
        ],
        [
          'should support form delimited query styles for exploded array inpu and NOT encode already encoded values',
          paramExplode,
          { query: { color: arrayInputEncoded } },
          [
            { name: 'color', value: 'something%26nothing%3Dtrue' },
            { name: 'color', value: 'hash%23data' },
          ],
        ],
        [
          'should support form delimited query styles for non exploded object input',
          paramNoExplode,
          { query: { color: objectInput } },
          [{ name: 'color', value: 'R,100,G,200,B,150' }],
        ],
        [
          'should support form delimited query styles for non exploded object input and NOT encode already encoded values',
          paramNoExplode,
          { query: { color: objectInputEncoded } },
          [{ name: 'color', value: 'pound,something%26nothing%3Dtrue,hash,hash%23data' }],
        ],
        [
          'should support form delimited query styles for exploded object input',
          paramExplode,
          { query: { color: objectInput } },
          [
            { name: 'R', value: '100' },
            { name: 'G', value: '200' },
            { name: 'B', value: '150' },
          ],
        ],
        [
          'should support form delimited query styles for exploded object input and NOT encode already encoded values',
          paramExplode,
          { query: { color: objectInputEncoded } },
          [
            { name: 'pound', value: 'something%26nothing%3Dtrue' },
            { name: 'hash', value: 'hash%23data' },
          ],
        ],
        [
          'should support allowReserved for query parameters and not replace reserved characters',
          paramReserved,
          { query: { color: objectInputEncoded } },
          [
            { name: 'pound', value: 'something&nothing=true' },
            { name: 'hash', value: 'hash#data' },
          ],
        ],
      ].forEach(([test, operation = {}, formData = {}, expectedQueryString = []]) => {
        it(test, async function () {
          const oas = createOas('/query', operation);
          const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.queryString).to.deep.equal(expectedQueryString);
        });
      });
    });

    describe('spaceDelimited style', function () {
      const paramNoExplode = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'spaceDelimited',
            explode: false,
          },
        ],
      };

      const paramExplode = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'spaceDelimited',
            explode: true,
          },
        ],
      };

      // eslint-disable-next-line mocha/no-setup-in-describe
      [
        [
          'should NOT support space delimited query styles for non exploded empty input',
          paramNoExplode,
          { query: { color: emptyInput } },
          [],
        ],
        [
          'should NOT support space delimited query styles for exploded empty input',
          paramExplode,
          { query: { color: emptyInput } },
          [],
        ],
        [
          'should NOT support space delimited query styles for non exploded string input',
          paramNoExplode,
          { query: { color: stringInput } },
          [],
        ],
        [
          'should NOT support space delimited query styles for exploded string input',
          paramExplode,
          { query: { color: stringInput } },
          [],
        ],
        [
          'should support space delimited query styles for non exploded array input',
          paramNoExplode,
          { query: { color: arrayInput } },
          [{ name: 'color', value: 'blue black brown' }],
        ],
        [
          'should support space delimited query styles for non exploded array input and NOT encode already encoded values',
          paramNoExplode,
          { query: { color: arrayInputEncoded } },
          [{ name: 'color', value: 'something%26nothing%3Dtrue hash%23data' }],
        ],
        [
          'should NOT support space delimited query styles for exploded array input',
          paramExplode,
          { query: { color: arrayInput } },
          [],
        ],
        [
          'should support space delimited query styles for non exploded object input',
          paramNoExplode,
          { query: { color: objectInput } },
          [{ name: 'color', value: 'R 100 G 200 B 150' }],
        ],
        [
          'should NOT support space delimited query styles for exploded object input',
          paramExplode,
          { query: { color: objectInput } },
          [],
        ],
      ].forEach(([test, operation = {}, formData = {}, expectedQueryString = []]) => {
        it(test, async function () {
          const oas = createOas('/query', operation);
          const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.queryString).to.deep.equal(expectedQueryString);
        });
      });
    });

    describe('pipeDelimited style', function () {
      const paramNoExplode = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'pipeDelimited',
            explode: false,
          },
        ],
      };

      const paramExplode = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'pipeDelimited',
            explode: true,
          },
        ],
      };

      // eslint-disable-next-line mocha/no-setup-in-describe
      [
        [
          'should NOT support pipe delimited query styles for non exploded empty input',
          paramNoExplode,
          { query: { color: emptyInput } },
          [],
        ],
        [
          'should NOT support pipe delimited query styles for exploded empty input',
          paramExplode,
          { query: { color: emptyInput } },
          [],
        ],
        [
          'should NOT support pipe delimited query styles for non exploded string input',
          paramNoExplode,
          { query: { color: stringInput } },
          [],
        ],
        [
          'should NOT support pipe delimited query styles for exploded string input',
          paramExplode,
          { query: { color: stringInput } },
          [],
        ],
        [
          'should support pipe delimited query styles for non exploded array input',
          paramNoExplode,
          { query: { color: arrayInput } },
          [{ name: 'color', value: 'blue|black|brown' }],
        ],
        [
          'should support pipe delimited query styles for non exploded array input and NOT encode already encoded values',
          paramNoExplode,
          { query: { color: arrayInputEncoded } },
          [{ name: 'color', value: 'something%26nothing%3Dtrue|hash%23data' }],
        ],
        [
          'should NOT support pipe delimited query styles for exploded array input',
          paramExplode,
          { query: { color: arrayInput } },
          [],
        ],
        [
          'should support pipe delimited query styles for non exploded object input',
          paramNoExplode,
          { query: { color: objectInput } },
          [{ name: 'color', value: 'R|100|G|200|B|150' }],
        ],
        [
          'should NOT support pipe delimited query styles for exploded object input',
          paramExplode,
          { query: { color: objectInput } },
          [],
        ],
      ].forEach(([test, operation = {}, formData = {}, expectedQueryString = []]) => {
        it(test, async function () {
          const oas = createOas('/query', operation);
          const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.queryString).to.deep.equal(expectedQueryString);
        });
      });
    });

    describe('deepObject style', function () {
      const paramNoExplode = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'deepObject',
            explode: false,
          },
        ],
      };

      const paramExplode = {
        parameters: [
          {
            name: 'color',
            in: 'query',
            style: 'deepObject',
            explode: true,
          },
        ],
      };

      // eslint-disable-next-line mocha/no-setup-in-describe
      [
        [
          'should NOT support deepObject delimited query styles for non exploded empty input',
          paramNoExplode,
          { query: { color: emptyInput } },
          [],
        ],
        [
          'should NOT support deepObject delimited query styles for exploded empty input',
          paramExplode,
          { query: { color: emptyInput } },
          [],
        ],
        [
          'should NOT support deepObject delimited query styles for non exploded string input',
          paramNoExplode,
          { query: { color: stringInput } },
          [],
        ],
        [
          'should NOT support deepObject delimited query styles for exploded string input',
          paramExplode,
          { query: { color: stringInput } },
          [],
        ],
        [
          'should NOT support deepObject delimited query styles for non exploded array input',
          paramNoExplode,
          { query: { color: arrayInput } },
          [],
        ],
        [
          'should NOT support deepObject delimited query styles for exploded array input',
          paramExplode,
          { query: { color: arrayInput } },
          [],
        ],
        [
          'should NOT support deepObject delimited query styles for non exploded object input',
          paramNoExplode,
          { query: { color: objectInput } },
          [],
        ],
        [
          'should support deepObject delimited query styles for exploded object input',
          paramExplode,
          { query: { color: objectInput } },
          [
            { name: 'color[R]', value: '100' },
            { name: 'color[G]', value: '200' },
            { name: 'color[B]', value: '150' },
          ],
        ],
        [
          'should NOT support deepObject delimited query styles for non exploded nested object input',
          paramNoExplode,
          { query: { color: objectNestedObject } },
          [],
        ],
        [
          'should support deepObject delimited query styles for exploded nested object input',
          paramExplode,
          { query: { color: objectNestedObject } },
          [
            { name: 'color[id]', value: 'someID' },
            { name: 'color[child][name]', value: 'childName' },
            { name: 'color[child][age]', value: 'null' },
            { name: 'color[child][metadata][name]', value: 'meta' },
          ],
        ],
        [
          'should support deepObject delimited query styles for exploded nested object (of a ridiculious shape) input',
          paramExplode,
          { query: { color: objectNestedObjectOfARidiculiousShape } },
          [
            { name: 'color[id]', value: 'someID' },
            { name: 'color[petLicense]', value: 'null' },
            { name: 'color[dog][name]', value: 'buster' },
            { name: 'color[dog][age]', value: '18' },
            { name: 'color[dog][treats][0]', value: 'peanut%20butter' },
            { name: 'color[dog][treats][1]', value: 'apple' },
            { name: 'color[pets][0][name]', value: 'buster' },
            { name: 'color[pets][0][age]', value: 'null' },
            { name: 'color[pets][0][metadata][isOld]', value: 'true' },
          ],
        ],
        [
          'should support deepObject delimited query styles for exploded object input and NOT encode already encoded values',
          paramExplode,
          { query: { color: objectInputEncoded } },
          [
            { name: 'color[pound]', value: 'something%26nothing%3Dtrue' },
            { name: 'color[hash]', value: 'hash%23data' },
          ],
        ],
      ].forEach(([test, operation = {}, formData = {}, expectedQueryString = []]) => {
        it(test, async function () {
          const oas = createOas('/query', operation);
          const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.queryString).to.deep.equal(expectedQueryString);
        });
      });
    });
  });

  describe('cookie parameters', function () {
    const paramNoExplode = {
      parameters: [
        {
          name: 'color',
          in: 'cookie',
          style: 'form',
          explode: false,
        },
      ],
    };

    const paramExplode = {
      parameters: [
        {
          name: 'color',
          in: 'cookie',
          style: 'form',
          explode: true,
        },
      ],
    };

    // eslint-disable-next-line mocha/no-setup-in-describe
    [
      [
        'should support form delimited cookie styles for non exploded empty input',
        paramNoExplode,
        { cookie: { color: emptyInput } },
        [{ name: 'color', value: '' }],
      ],
      [
        'should support form delimited cookie styles for exploded empty input',
        paramExplode,
        { cookie: { color: emptyInput } },
        [{ name: 'color', value: '' }],
      ],
      [
        'should support form delimited cookie styles for non exploded string input',
        {
          parameters: [
            {
              name: 'color',
              in: 'cookie',
              style: 'form',
              explode: false,
            },
          ],
        },
        { cookie: { color: stringInput } },
        [{ name: 'color', value: 'blue' }],
      ],
      [
        'should support form delimited cookie styles for exploded string input',
        paramExplode,
        { cookie: { color: stringInput } },
        [{ name: 'color', value: 'blue' }],
      ],
      [
        'should support form delimited cookie styles for non exploded array input',
        paramNoExplode,
        { cookie: { color: arrayInput } },
        [{ name: 'color', value: 'blue,black,brown' }],
      ],
      [
        'should support form delimited cookie styles for exploded array input',
        paramExplode,
        { cookie: { color: arrayInput } },
        [
          { name: 'color', value: 'blue' },
          { name: 'color', value: 'black' },
          { name: 'color', value: 'brown' },
        ],
      ],
      [
        'should support form delimited cookie styles for non exploded object input',
        paramNoExplode,
        { cookie: { color: objectInput } },
        [{ name: 'color', value: 'R,100,G,200,B,150' }],
      ],
      [
        'should support form delimited cookie styles for exploded object input',
        paramExplode,
        { cookie: { color: objectInput } },
        [
          { name: 'R', value: '100' },
          { name: 'G', value: '200' },
          { name: 'B', value: '150' },
        ],
      ],
    ].forEach(([test, operation = {}, formData = {}, expectedCookies = []]) => {
      it(test, async function () {
        const oas = createOas('/cookies', operation);
        const har = oasToHar(oas, oas.operation('/cookies', 'get'), formData);
        await expect(har).to.be.a.har;

        expect(har.log.entries[0].request.cookies).to.deep.equal(expectedCookies);
      });
    });
  });

  describe('header parameters', function () {
    const paramNoExplode = {
      parameters: [
        {
          name: 'color',
          in: 'header',
          style: 'simple',
          explode: false,
        },
      ],
    };

    const paramExplode = {
      parameters: [
        {
          name: 'color',
          in: 'header',
          style: 'simple',
          explode: true,
        },
      ],
    };

    // eslint-disable-next-line mocha/no-setup-in-describe
    [
      [
        'should NOT support simple header styles for non exploded empty input',
        paramNoExplode,
        { header: { color: emptyInput } },
        [],
      ],
      [
        'should NOT support simple header styles for exploded empty input',
        paramExplode,
        { header: { color: emptyInput } },
        [],
      ],
      [
        'should support simple header styles for non exploded string input',
        paramNoExplode,
        { header: { color: stringInput } },
        [{ name: 'color', value: 'blue' }],
      ],
      [
        'should support simple header styles for exploded string input',
        paramExplode,
        { header: { color: stringInput } },
        [{ name: 'color', value: 'blue' }],
      ],
      [
        'should support simple header styles for non exploded arrays',
        paramNoExplode,
        { header: { color: arrayInput } },
        [{ name: 'color', value: 'blue,black,brown' }],
      ],
      [
        'should support simple header styles for exploded arrays',
        paramExplode,
        { header: { color: arrayInput } },
        // NOTE: The wording of explode sounds like exploding this object should lead to multiple color headers,
        //  but the examples at https://swagger.io/docs/specification/serialization/#header show a single header
        //  I believe this is because in HTTP (https://tools.ietf.org/html/rfc7230#section-3.2.2), multiple identical headers are represented by a comma separated list in a single header
        [{ name: 'color', value: 'blue,black,brown' }],
      ],
      [
        'should support simple header styles for non exploded objects',
        paramNoExplode,
        { header: { color: objectInput } },
        [{ name: 'color', value: 'R,100,G,200,B,150' }],
      ],
      [
        'should support simple header styles for exploded objects',
        paramExplode,
        { header: { color: objectInput } },
        /**
         * NOTE: The wording of explode sounds like exploding this object should lead to an R, G
         * and B header, but the examples at show a single header. I'm not sure why this is the
         * case, since explosion should push these values up one level. I would think that we would
         * end up with R, G and B headers. For some unclear reason we do not.
         *
         * @see {@link https://swagger.io/docs/specification/serialization/#header}
         */
        [{ name: 'color', value: 'R=100,G=200,B=150' }],
      ],
    ].forEach(([test, operation = {}, formData = {}, expectedHeaders = []]) => {
      it(test, async function () {
        const oas = createOas('/header', operation);
        const har = oasToHar(oas, oas.operation('/header', 'get'), formData);
        await expect(har).to.be.a.har;

        expect(har.log.entries[0].request.headers).to.deep.equal(expectedHeaders);
      });
    });

    /**
     * Eventhough `Accept`, `Authorization`, and `Content-Type` headers can be defined as path
     * parameters, they should be completely ignored when it comes to serialization.
     *
     *  > If `in` is "header" and the `name` field is "Accept", "Content-Type" or "Authorization",
     *  > the parameter definition SHALL be ignored.
     *
     * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.3.md#fixed-fields-10
     */
    describe('should ignore styling definitions on OAS-level handled headers', function () {
      // eslint-disable-next-line mocha/no-setup-in-describe
      [
        ['`accept`', 'accept', 'application/json'],
        ['`content-type`', 'content-type', 'application/json'],
        ['`authorization`', 'authorization', 'scheme d9b23eb/0df'],
      ].forEach(([test, headerName, value]) => {
        it(test, async function () {
          const oas = createOas('/header', {
            parameters: [
              {
                name: headerName,
                in: 'header',
                style: 'simple',
                explode: false,
              },
            ],
          });

          const formData = { header: { [headerName]: value } };

          const har = oasToHar(oas, oas.operation('/header', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.headers).to.deep.equal([{ name: headerName, value }]);
        });
      });
    });
  });
});
