/*
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
        get: operation,
      },
    },
  });
}

describe('multipart/form-data parameters', () => {
  describe('form style', () => {
    const bodyNoExplode = {
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
                style: 'form',
                explode: false,
              },
              array: {
                style: 'form',
                explode: false,
              },
              object: {
                style: 'form',
                explode: false,
              },
            },
          },
        },
      },
    };

    const bodyExplode = {
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
                style: 'form',
                explode: true,
              },
              array: {
                style: 'form',
                explode: true,
              },
              object: {
                style: 'form',
                explode: true,
              },
            },
          },
        },
      },
    };

    it.each([
      [
        'should support form delimited multipart/form-data styles for non exploded empty input',
        paramNoExplode,
        { query: { color: emptyInput } },
        [{ name: 'color', value: '' }],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded empty input',
        paramExplode,
        { query: { color: emptyInput } },
        [{ name: 'color', value: '' }],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded string input',
        paramNoExplode,
        { query: { color: stringInput } },
        [{ name: 'color', value: 'blue' }],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded string input and NOT encode already encoded values',
        paramNoExplode,
        { query: { color: stringInputEncoded } },
        [{ name: 'color', value: 'something%26nothing%3Dtrue' }],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded string input',
        paramExplode,
        { query: { color: stringInput } },
        [{ name: 'color', value: 'blue' }],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded string input and NOT encode already encoded values',
        paramExplode,
        { query: { color: stringInputEncoded } },
        [{ name: 'color', value: 'something%26nothing%3Dtrue' }],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded array input',
        paramNoExplode,
        { query: { color: arrayInput } },
        [{ name: 'color', value: 'blue,black,brown' }],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded array input and NOT encode already encoded values',
        paramNoExplode,
        { query: { color: arrayInputEncoded } },
        [{ name: 'color', value: 'something%26nothing%3Dtrue,hash%23data' }],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded array input',
        paramExplode,
        { query: { color: arrayInput } },
        [
          { name: 'color', value: 'blue' },
          { name: 'color', value: 'black' },
          { name: 'color', value: 'brown' },
        ],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded array inpu and NOT encode already encoded values',
        paramExplode,
        { query: { color: arrayInputEncoded } },
        [
          { name: 'color', value: 'something%26nothing%3Dtrue' },
          { name: 'color', value: 'hash%23data' },
        ],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded object input',
        paramNoExplode,
        { query: { color: objectInput } },
        [{ name: 'color', value: 'R,100,G,200,B,150' }],
      ],
      [
        'should support form delimited multipart/form-data styles for non exploded object input and NOT encode already encoded values',
        paramNoExplode,
        { query: { color: objectInputEncoded } },
        [{ name: 'color', value: 'pound,something%26nothing%3Dtrue,hash,hash%23data' }],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded object input',
        paramExplode,
        { query: { color: objectInput } },
        [
          { name: 'R', value: '100' },
          { name: 'G', value: '200' },
          { name: 'B', value: '150' },
        ],
      ],
      [
        'should support form delimited multipart/form-data styles for exploded object input and NOT encode already encoded values',
        paramExplode,
        { query: { color: objectInputEncoded } },
        [
          { name: 'pound', value: 'something%26nothing%3Dtrue' },
          { name: 'hash', value: 'hash%23data' },
        ],
      ],
    ])('%s', async (_, operation = {}, formData = {}, requestBody = []) => {
      const oas = createOas('/query', operation);
      const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
      await expect(har).toBeAValidHAR();

      // index.js line 288 is the form-data parsing, it should go into params and auto fix it. check line 311 and 319 for the formatter
      expect(har.log.entries[0].request.params).toStrictEqual(requestBody);
    });
  });

  describe('spaceDelimited style', () => {
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

    it.each([
      [
        'should NOT support space delimited multipart/form-data styles for non exploded empty input',
        paramNoExplode,
        { query: { color: emptyInput } },
        [],
      ],
      [
        'should NOT support space delimited multipart/form-data styles for exploded empty input',
        paramExplode,
        { query: { color: emptyInput } },
        [],
      ],
      [
        'should NOT support space delimited multipart/form-data styles for non exploded string input',
        paramNoExplode,
        { query: { color: stringInput } },
        [],
      ],
      [
        'should NOT support space delimited multipart/form-data styles for exploded string input',
        paramExplode,
        { query: { color: stringInput } },
        [],
      ],
      [
        'should support space delimited multipart/form-data styles for non exploded array input',
        paramNoExplode,
        { query: { color: arrayInput } },
        [{ name: 'color', value: 'blue black brown' }],
      ],
      [
        'should support space delimited multipart/form-data styles for non exploded array input and NOT encode already encoded values',
        paramNoExplode,
        { query: { color: arrayInputEncoded } },
        [{ name: 'color', value: 'something%26nothing%3Dtrue hash%23data' }],
      ],
      [
        'should NOT support space delimited multipart/form-data styles for exploded array input',
        paramExplode,
        { query: { color: arrayInput } },
        [],
      ],
      // This is supposed to be supported, but the style-serializer library we use does not have support. Holding off for now.
      /* [
        'should support space delimited multipart/form-data styles for non exploded object input',
        paramNoExplode,
        { query: { color: objectInput } },
        // Note: this is space here, but %20 in the example above, because encoding happens far down the line
        [{ name: 'color', value: 'R 100 G 200 B 150' }],
      ],
      [
        'should NOT support space delimited multipart/form-data styles for exploded object input',
        paramExplode,
        { query: { color: objectInput } },
        [],
      ],
    ])('%s', async (_, operation = {}, formData = {}, expectedQueryString = []) => {
      const oas = createOas('/query', operation);
      const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
      await expect(har).toBeAValidHAR();

      expect(har.log.entries[0].request.queryString).toStrictEqual(expectedQueryString);
    });
  });

  describe('pipeDelimited style', () => {
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

    it.each([
      [
        'should NOT support pipe delimited multipart/form-data styles for non exploded empty input',
        paramNoExplode,
        { query: { color: emptyInput } },
        [],
      ],
      [
        'should NOT support pipe delimited multipart/form-data styles for exploded empty input',
        paramExplode,
        { query: { color: emptyInput } },
        [],
      ],
      [
        'should NOT support pipe delimited multipart/form-data styles for non exploded string input',
        paramNoExplode,
        { query: { color: stringInput } },
        [],
      ],
      [
        'should NOT support pipe delimited multipart/form-data styles for exploded string input',
        paramExplode,
        { query: { color: stringInput } },
        [],
      ],
      [
        'should support pipe delimited multipart/form-data styles for non exploded array input',
        paramNoExplode,
        { query: { color: arrayInput } },
        [{ name: 'color', value: 'blue|black|brown' }],
      ],
      [
        'should support pipe delimited multipart/form-data styles for non exploded array input and NOT encode already encoded values',
        paramNoExplode,
        { query: { color: arrayInputEncoded } },
        [{ name: 'color', value: 'something%26nothing%3Dtrue|hash%23data' }],
      ],
      [
        'should NOT support pipe delimited multipart/form-data styles for exploded array input',
        paramExplode,
        { query: { color: arrayInput } },
        [],
      ],
      // This is supposed to be supported, but the style-seralizer library we use does not have support. Holding off for now.
      /* [
        'should support pipe delimited multipart/form-data styles for non exploded object input',
        paramNoExplode,
        { query: { color: objectInput } },
        [{ name: 'color', value: 'R|100|G|200|B|150' }],
      ],
      [
        'should NOT support pipe delimited multipart/form-data styles for exploded object input',
        paramExplode,
        { query: { color: objectInput } },
        [],
      ],
    ])('%s', async (_, operation = {}, formData = {}, expectedQueryString = []) => {
      const oas = createOas('/query', operation);
      const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
      await expect(har).toBeAValidHAR();

      expect(har.log.entries[0].request.queryString).toStrictEqual(expectedQueryString);
    });
  });

  describe('deepObject style', () => {
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

    it.each([
      [
        'should NOT support deepObject delimited multipart/form-data styles for non exploded empty input',
        paramNoExplode,
        { query: { color: emptyInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for exploded empty input',
        paramExplode,
        { query: { color: emptyInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for non exploded string input',
        paramNoExplode,
        { query: { color: stringInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for exploded string input',
        paramExplode,
        { query: { color: stringInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for non exploded array input',
        paramNoExplode,
        { query: { color: arrayInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for exploded array input',
        paramExplode,
        { query: { color: arrayInput } },
        [],
      ],
      [
        'should NOT support deepObject delimited multipart/form-data styles for non exploded object input',
        paramNoExplode,
        { query: { color: objectInput } },
        [],
      ],
      [
        'should support deepObject delimited multipart/form-data styles for exploded object input',
        paramExplode,
        { query: { color: objectInput } },
        [
          { name: 'color[R]', value: '100' },
          { name: 'color[G]', value: '200' },
          { name: 'color[B]', value: '150' },
        ],
      ],
      [
        'should support deepObject delimited multipart/form-data styles for exploded object input and NOT encode already encoded values',
        paramExplode,
        { query: { color: objectInputEncoded } },
        [
          { name: 'color[pound]', value: 'something%26nothing%3Dtrue' },
          { name: 'color[hash]', value: 'hash%23data' },
        ],
      ],
    ])('%s', async (_, operation = {}, formData = {}, expectedQueryString = []) => {
      const oas = createOas('/query', operation);
      const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
      await expect(har).toBeAValidHAR();

      expect(har.log.entries[0].request.queryString).toStrictEqual(expectedQueryString);
    });
  });
});
*/
