const Oas = require('oas').default;
const oasToHar = require('../../../src');
const toBeAValidHAR = require('jest-expect-har').default;

expect.extend({ toBeAValidHAR });

const emptyInput = '';
const stringInput = 'blue';
const stringInputEncoded = encodeURIComponent('something&nothing=true');
const arrayInput = ['blue', 'black', 'brown'];
const arrayInputEncoded = ['something&nothing=true', 'hash#data'];
const objectInput = { R: 100, G: 200, B: 150 };
const objectInputEncoded = { pound: 'something&nothing=true', hash: 'hash#data' };

function createOas(path, operation) {
  return new Oas({
    paths: {
      [path]: {
        post: operation,
      },
    },
  });
}

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

describe('multipart/form-data parameters', () => {
  describe('form style', () => {
    const bodyNoExplode = buildBody('form', false);
    const bodyExplode = buildBody('form', true);

    it.each([
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
    ])('%s', async (_, operation = {}, formData = {}, expectedRequestBody = []) => {
      const oas = createOas('/body', operation);
      const har = oasToHar(oas, oas.operation('/body', 'post'), formData);
      await expect(har).toBeAValidHAR();

      expect(har.log.entries[0].request.postData.params).toStrictEqual(expectedRequestBody);
    });
  });

  describe('spaceDelimited style', () => {
    const bodyNoExplode = buildBody('spaceDelimited', false);
    const bodyExplode = buildBody('spaceDelimited', true);

    it.each([
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
    ])('%s', async (_, operation = {}, formData = {}, expectedRequestBody = undefined) => {
      const oas = createOas('/body', operation);
      const har = oasToHar(oas, oas.operation('/body', 'post'), formData);
      await expect(har).toBeAValidHAR();

      // Note: not sure what the best path forward is here. research har spec more
      // Basically some tests in this section, when the test is a "should NOT" test, give us an empty array, and some don't give us postData at all
      // we need to standardize them
      if (expectedRequestBody === undefined) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(har.log.entries[0].request.postData).toBeUndefined();
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(har.log.entries[0].request.postData.params).toStrictEqual(expectedRequestBody);
      }
    });
  });

  describe('pipeDelimited style', () => {
    const bodyNoExplode = buildBody('pipeDelimited', false);
    const bodyExplode = buildBody('pipeDelimited', true);

    it.each([
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
    ])('%s', async (_, operation = {}, formData = {}, expectedRequestBody = undefined) => {
      const oas = createOas('/body', operation);
      const har = oasToHar(oas, oas.operation('/body', 'post'), formData);
      await expect(har).toBeAValidHAR();

      // Note: not sure what the best path forward is here. research har spec more
      // Basically some tests in this section, when the test is a "should NOT" test, give us an empty array, and some don't give us postData at all
      // we need to standardize them
      if (expectedRequestBody === undefined) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(har.log.entries[0].request.postData).toBeUndefined();
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(har.log.entries[0].request.postData.params).toStrictEqual(expectedRequestBody);
      }
    });
  });

  describe('deepObject style', () => {
    const bodyNoExplode = buildBody('deepObject', false);
    const bodyExplode = buildBody('deepObject', true);

    it.each([
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
    ])('%s', async (_, operation = {}, formData = {}, expectedRequestBody = undefined) => {
      const oas = createOas('/body', operation);
      const har = oasToHar(oas, oas.operation('/body', 'post'), formData);
      await expect(har).toBeAValidHAR();

      // Note: not sure what the best path forward is here. research har spec more
      // Basically some tests in this section, when the test is a "should NOT" test, give us an empty array, and some don't give us postData at all
      // we need to standardize them
      if (expectedRequestBody === undefined) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(har.log.entries[0].request.postData).toBeUndefined();
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(har.log.entries[0].request.postData.params).toStrictEqual(expectedRequestBody);
      }
    });
  });
});
