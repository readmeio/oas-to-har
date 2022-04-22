/* eslint-disable mocha/no-setup-in-describe */
const chai = require('chai');
const { expect } = require('chai');

const oasToHar = require('../../../src');

const chaiPlugins = require('../../helpers/chai-plugins');

const createOas = require('../../__fixtures__/create-oas')('post');
const {
  emptyInput,
  stringInput,
  stringInputEncoded,
  arrayInput,
  arrayInputEncoded,
  objectInput,
  objectNestedObject,
  objectNestedObjectOfARidiculiousShape,
  objectInputEncoded,
} = require('../../__fixtures__/style-data');

chai.use(chaiPlugins);

function buildBody(style, explode) {
  return {
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              primitive: {
                type: 'string',
              },
              array: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              object: {
                type: 'object',
                properties: {
                  foo: {
                    type: 'string',
                  },
                  bar: {
                    type: 'string',
                  },
                },
              },
            },
          },
          encoding: {
            primitive: {
              style,
              explode,
            },
            array: {
              style,
              explode,
            },
            object: {
              style,
              explode,
            },
          },
        },
      },
    },
  };
}

describe('multipart/form-data parameters', function () {
  describe('addtl tests', function () {
    it('should return an empty array when provided a privitive request body', async function () {
      const oas = createOas('/body', buildBody('form', false));
      const har = oasToHar(oas, oas.operation('/body', 'post'), { body: 'hello, primitive string body' });
      await expect(har).to.be.a.har;

      expect(har.log.entries[0].request.postData.params).to.be.empty;
    });
  });

  describe('form style', function () {
    const bodyNoExplode = buildBody('form', false);
    const bodyExplode = buildBody('form', true);

    [
      [
        'should support form delimited multipart/form-data styles for non exploded empty input',
        bodyNoExplode,
        { body: { primitive: emptyInput } },
        [{ name: 'primitive', value: '' }],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded empty input',
        bodyExplode,
        { body: { primitive: emptyInput } },
        [{ name: 'primitive', value: '' }],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded string input',
        bodyNoExplode,
        { body: { primitive: stringInput } },
        [{ name: 'primitive', value: 'blue' }],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded string input and NOT encode already encoded values',
        bodyNoExplode,
        { body: { primitive: stringInputEncoded } },
        [{ name: 'primitive', value: 'something%26nothing%3Dtrue' }],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded string input',
        bodyExplode,
        { body: { primitive: stringInput } },
        [{ name: 'primitive', value: 'blue' }],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded string input and NOT encode already encoded values',
        bodyExplode,
        { body: { primitive: stringInputEncoded } },
        [{ name: 'primitive', value: 'something%26nothing%3Dtrue' }],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded array input',
        bodyNoExplode,
        { body: { array: arrayInput } },
        [{ name: 'array', value: 'blue,black,brown' }],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded array input and NOT encode already encoded values',
        bodyNoExplode,
        { body: { array: arrayInputEncoded } },
        [{ name: 'array', value: 'something%26nothing%3Dtrue,hash%23data' }],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded array input',
        bodyExplode,
        { body: { array: arrayInput } },
        [
          { name: 'array', value: 'blue' },
          { name: 'array', value: 'black' },
          { name: 'array', value: 'brown' },
        ],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded array inpu and NOT encode already encoded values',
        bodyExplode,
        { body: { array: arrayInputEncoded } },
        [
          { name: 'array', value: 'something%26nothing%3Dtrue' },
          { name: 'array', value: 'hash%23data' },
        ],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded object input',
        bodyNoExplode,
        { body: { object: objectInput } },
        [{ name: 'object', value: 'R,100,G,200,B,150' }],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded object input and NOT encode already encoded values',
        bodyNoExplode,
        { body: { object: objectInputEncoded } },
        [{ name: 'object', value: 'pound,something%26nothing%3Dtrue,hash,hash%23data' }],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded object input',
        bodyExplode,
        { body: { object: objectInput } },
        [
          { name: 'R', value: '100' },
          { name: 'G', value: '200' },
          { name: 'B', value: '150' },
        ],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded object input and NOT encode already encoded values',
        bodyExplode,
        { body: { object: objectInputEncoded } },
        [
          { name: 'pound', value: 'something%26nothing%3Dtrue' },
          { name: 'hash', value: 'hash%23data' },
        ],
      ],
    ].forEach(([test, operation, formData = {}, expectedRequestBody = []]) => {
      it(test, async function () {
        const oas = createOas('/body', operation);
        const har = oasToHar(oas, oas.operation('/body', 'post'), formData);
        await expect(har).to.be.a.har;

        expect(har.log.entries[0].request.postData.params).to.deep.equal(expectedRequestBody);
      });
    });
  });

  describe('spaceDelimited style', function () {
    const bodyNoExplode = buildBody('spaceDelimited', false);
    const bodyExplode = buildBody('spaceDelimited', true);

    [
      [
        'should NOT support space delimited multipart/form-data styles for non exploded empty input',
        bodyNoExplode,
        { body: { primitive: emptyInput } },
        [],
      ],
      [
        'should NOT support space delimited multipart/form-data styles for exploded empty input',
        bodyExplode,
        { body: { primitive: emptyInput } },
        [],
      ],
      [
        'should NOT support space delimited multipart/form-data styles for non exploded string input',
        bodyNoExplode,
        { body: { primitive: stringInput } },
        [],
      ],
      [
        'should NOT support space delimited multipart/form-data styles for exploded string input',
        bodyExplode,
        { body: { primitive: stringInput } },
        [],
      ],
      [
        'should support space delimited multipart/form-data styles for non exploded array input',
        bodyNoExplode,
        { body: { array: arrayInput } },
        [{ name: 'array', value: 'blue black brown' }],
      ],
      [
        'should support space delimited multipart/form-data styles for non exploded array input and NOT encode already encoded values',
        bodyNoExplode,
        { body: { array: arrayInputEncoded } },
        [{ name: 'array', value: 'something%26nothing%3Dtrue hash%23data' }],
      ],
      [
        'should NOT support space delimited multipart/form-data styles for exploded array input',
        bodyExplode,
        { body: { array: arrayInput } },
        [],
      ],
      // This is supposed to be supported, but the style-serializer library we use does not have support. Holding off for now.
      /* [
        'should support space delimited multipart/form-data styles for non exploded object input',
        bodyNoExplode,
        { body: { object: objectInput } },
        // Note: this is space here, but %20 in the example above, because encoding happens far down the line
        { object: 'R 100 G 200 B 150' },
      ],
      [
        'should NOT support space delimited multipart/form-data styles for exploded object input',
        bodyExplode,
        { body: { object: objectInput } },
        [],
      ], */
    ].forEach(([test, operation = {}, formData = {}, expectedRequestBody = undefined]) => {
      it(test, async function () {
        const oas = createOas('/body', operation);
        const har = oasToHar(oas, oas.operation('/body', 'post'), formData);
        await expect(har).to.be.a.har;

        expect(har.log.entries[0].request.postData.params).to.deep.equal(expectedRequestBody);
      });
    });
  });

  describe('pipeDelimited style', function () {
    const bodyNoExplode = buildBody('pipeDelimited', false);
    const bodyExplode = buildBody('pipeDelimited', true);

    [
      [
        'should NOT support pipe delimited multipart/form-data styles for non exploded empty input',
        bodyNoExplode,
        { body: { primitive: emptyInput } },
        [],
      ],
      [
        'should NOT support pipe delimited multipart/form-data styles for exploded empty input',
        bodyExplode,
        { body: { primitive: emptyInput } },
        [],
      ],
      [
        'should NOT support pipe delimited multipart/form-data styles for non exploded string input',
        bodyNoExplode,
        { body: { primitive: stringInput } },
        [],
      ],
      [
        'should NOT support pipe delimited multipart/form-data styles for exploded string input',
        bodyExplode,
        { body: { primitive: stringInput } },
        [],
      ],
      [
        'should support pipe delimited multipart/form-data styles for non exploded array input',
        bodyNoExplode,
        { body: { array: arrayInput } },
        [{ name: 'array', value: 'blue|black|brown' }],
      ],
      [
        'should support pipe delimited multipart/form-data styles for non exploded array input and NOT encode already encoded values',
        bodyNoExplode,
        { body: { array: arrayInputEncoded } },
        [{ name: 'array', value: 'something%26nothing%3Dtrue|hash%23data' }],
      ],
      [
        'should NOT support pipe delimited multipart/form-data styles for exploded array input',
        bodyExplode,
        { body: { array: arrayInput } },
        [],
      ],
      // This is supposed to be supported, but the style-seralizer library we use does not have support. Holding off for now.
      /* [
        'should support pipe delimited multipart/form-data styles for non exploded object input',
        bodyNoExplode,
        { body: { color: objectInput } },
        { color: 'R|100|G|200|B|150' },
      ],
      [
        'should NOT support pipe delimited multipart/form-data styles for exploded object input',
        bodyExplode,
        { body: { color: objectInput } },
        [],
      ], */
    ].forEach(([test, operation = {}, formData = {}, expectedRequestBody = undefined]) => {
      it(test, async function () {
        const oas = createOas('/body', operation);
        const har = oasToHar(oas, oas.operation('/body', 'post'), formData);
        await expect(har).to.be.a.har;

        expect(har.log.entries[0].request.postData.params).to.deep.equal(expectedRequestBody);
      });
    });
  });

  describe('deepObject style', function () {
    const bodyNoExplode = buildBody('deepObject', false);
    const bodyExplode = buildBody('deepObject', true);

    [
      [
        'should NOT support deepObject delimited multipart/form-data styles for non exploded empty input',
        bodyNoExplode,
        { body: { primitive: emptyInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for exploded empty input',
        bodyExplode,
        { body: { primitive: emptyInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for non exploded string input',
        bodyNoExplode,
        { body: { primitive: stringInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for exploded string input',
        bodyExplode,
        { body: { primitive: stringInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for non exploded array input',
        bodyNoExplode,
        { body: { array: arrayInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for exploded array input',
        bodyExplode,
        { body: { array: arrayInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for non exploded object input',
        bodyNoExplode,
        { body: { object: objectInput } },
        [],
      ],
      [
        'should support deepObject delimited multipart/form-data styles for exploded object input',
        bodyExplode,
        { body: { object: objectInput } },
        [
          { name: 'object[R]', value: '100' },
          { name: 'object[G]', value: '200' },
          { name: 'object[B]', value: '150' },
        ],
      ],
      [
        'should support deepObject delimited multipart/form-data styles for exploded object input and NOT encode already encoded values',
        bodyExplode,
        { body: { object: objectInputEncoded } },
        [
          { name: 'object[pound]', value: 'something%26nothing%3Dtrue' },
          { name: 'object[hash]', value: 'hash%23data' },
        ],
      ],
      [
        'should support deepObject styles for nested objects past 1 level depth',
        bodyExplode,
        { body: { object: objectNestedObject } },
        [
          { name: 'object[id]', value: 'someID' },
          { name: 'object[child][name]', value: 'childName' },
          { name: 'object[child][age]', value: 'null' },
          { name: 'object[child][metadata][name]', value: 'meta' },
        ],
      ],
      [
        'should support deepObject styles for nested objects past 1 level depth (and with a ridiculious shape)',
        bodyExplode,
        { body: { object: objectNestedObjectOfARidiculiousShape } },
        [
          { name: 'object[id]', value: 'someID' },
          { name: 'object[petLicense]', value: 'null' },
          { name: 'object[dog][name]', value: 'buster' },
          { name: 'object[dog][age]', value: '18' },
          { name: 'object[dog][treats][0]', value: 'peanut%20butter' },
          { name: 'object[dog][treats][1]', value: 'apple' },
          { name: 'object[pets][0][name]', value: 'buster' },
          { name: 'object[pets][0][age]', value: 'null' },
          { name: 'object[pets][0][metadata][isOld]', value: 'true' },
        ],
      ],
    ].forEach(([test, operation = {}, formData = {}, expectedRequestBody = undefined]) => {
      it(test, async function () {
        const oas = createOas('/body', operation);
        const har = oasToHar(oas, oas.operation('/body', 'post'), formData);
        await expect(har).to.be.a.har;

        expect(har.log.entries[0].request.postData.params).to.deep.equal(expectedRequestBody);
      });
    });
  });
});
