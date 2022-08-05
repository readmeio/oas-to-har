import type { DataForHAR } from '../../../src';
import type { Request } from 'har-format';
import chai, { expect } from 'chai';

import oasToHar from '../../../src';
import chaiPlugins from '../../helpers/chai-plugins';

import oasFixture from '../../__fixtures__/create-oas';
import {
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
} from '../../__fixtures__/style-data';

chai.use(chaiPlugins);

const createOas = oasFixture('get');

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

      function assertMatrixPath(operation, formData: DataForHAR, expected: string) {
        return async () => {
          const oas = createOas('/style-path/{color}', operation);
          const har = oasToHar(oas, oas.operation('/style-path/{color}', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.url).to.equal(expected);
        };
      }

      it(
        'should support matrix path styles non exploded empty input',
        assertMatrixPath(
          paramNoExplode,
          { path: { color: emptyInput } },
          `https://example.com/style-path/${semicolon}color`
        )
      );

      it(
        'should support matrix path styles styles for exploded empty input',
        assertMatrixPath(
          paramExplode,
          { path: { color: emptyInput } },
          `https://example.com/style-path/${semicolon}color`
        )
      );

      it(
        'should support matrix path styles non exploded undefined input',
        assertMatrixPath(
          paramNoExplode,
          { path: { color: undefinedInput } },
          `https://example.com/style-path/${semicolon}color`
        )
      );

      it(
        'should support matrix path styles styles for exploded undefined input',
        assertMatrixPath(
          paramExplode,
          { path: { color: undefinedInput } },
          `https://example.com/style-path/${semicolon}color`
        )
      );

      it(
        'should support matrix path styles non exploded undefined array input',
        assertMatrixPath(
          paramNoExplode,
          { path: { color: undefinedArrayInput } },
          `https://example.com/style-path/${semicolon}color`
        )
      );

      it(
        'should support matrix path styles styles for exploded undefined array input',
        assertMatrixPath(
          paramExplode,
          { path: { color: undefinedArrayInput } },
          `https://example.com/style-path/${semicolon}color`
        )
      );

      it(
        'should support matrix path styles non exploded undefined object input',
        assertMatrixPath(
          paramNoExplode,
          { path: { color: undefinedObjectInput } },
          `https://example.com/style-path/${semicolon}color${equals}R${comma}`
        )
      );

      it(
        'should support matrix path styles styles for exploded undefined object input',
        assertMatrixPath(
          paramExplode,
          { path: { color: undefinedObjectInput } },
          `https://example.com/style-path/${semicolon}R${equals}`
        )
      );

      it(
        'should support matrix path styles styles for non exploded string input',
        assertMatrixPath(
          paramNoExplode,
          { path: { color: stringInput } },
          `https://example.com/style-path/${semicolon}color${equals}blue`
        )
      );

      it(
        'should support matrix path styles styles for exploded string input',
        assertMatrixPath(
          paramExplode,
          { path: { color: stringInput } },
          `https://example.com/style-path/${semicolon}color${equals}blue`
        )
      );

      it(
        'should support matrix path styles styles for non exploded array input',
        assertMatrixPath(
          paramNoExplode,
          { path: { color: arrayInput } },
          `https://example.com/style-path/${semicolon}color${equals}blue${comma}black${comma}brown`
        )
      );

      it(
        'should support matrix path styles styles for exploded array input',
        assertMatrixPath(
          paramExplode,
          { path: { color: arrayInput } },
          `https://example.com/style-path/${semicolon}color${equals}blue${semicolon}color${equals}black${semicolon}color${equals}brown`
        )
      );

      it(
        'should support matrix path styles styles for non exploded object input',
        assertMatrixPath(
          paramNoExplode,
          { path: { color: objectInput } },
          `https://example.com/style-path/${semicolon}color${equals}R${comma}100${comma}G${comma}200${comma}B${comma}150`
        )
      );

      it(
        'should support matrix path styles styles for exploded object input',
        assertMatrixPath(
          paramExplode,
          { path: { color: objectInput } },
          `https://example.com/style-path/${semicolon}R${equals}100${semicolon}G${equals}200${semicolon}B${equals}150`
        )
      );
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

      function assertLabelPath(operation, formData: DataForHAR, expected: string) {
        return async () => {
          const oas = createOas('/style-path/{color}', operation);
          const har = oasToHar(oas, oas.operation('/style-path/{color}', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.url).to.equal(expected);
        };
      }

      it(
        'should support label path styles non exploded empty input',
        assertLabelPath(paramNoExplode, { path: { color: emptyInput } }, 'https://example.com/style-path/.')
      );

      it(
        'should support label path styles styles for exploded empty input',
        assertLabelPath(paramExplode, { path: { color: emptyInput } }, 'https://example.com/style-path/.')
      );

      it(
        'should support label path styles styles for non exploded string input',
        assertLabelPath(paramNoExplode, { path: { color: stringInput } }, 'https://example.com/style-path/.blue')
      );

      it(
        'should support label path styles styles for exploded string input',
        assertLabelPath(paramExplode, { path: { color: stringInput } }, 'https://example.com/style-path/.blue')
      );

      it(
        'should support label path styles styles for non exploded array input',
        assertLabelPath(
          paramNoExplode,
          { path: { color: arrayInput } },
          'https://example.com/style-path/.blue.black.brown'
        )
      );

      it(
        'should support label path styles styles for exploded array input',
        assertLabelPath(
          paramExplode,
          { path: { color: arrayInput } },
          'https://example.com/style-path/.blue.black.brown'
        )
      );

      it(
        'should support label path styles styles for non exploded object input',
        assertLabelPath(
          paramNoExplode,
          { path: { color: objectInput } },
          'https://example.com/style-path/.R.100.G.200.B.150'
        )
      );

      it(
        'should support label path styles styles for exploded object input',
        assertLabelPath(
          paramExplode,
          { path: { color: objectInput } },
          `https://example.com/style-path/.R${equals}100.G${equals}200.B${equals}150`
        )
      );
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

      function assertSimplePath(operation, formData: DataForHAR, expected: string) {
        return async () => {
          const oas = createOas('/style-path/{color}', operation);
          const har = oasToHar(oas, oas.operation('/style-path/{color}', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.url).to.equal(expected);
        };
      }

      it(
        'should NOT support simple path styles non exploded empty input',
        assertSimplePath(paramNoExplode, { path: { color: emptyInput } }, 'https://example.com/style-path/')
      );

      it(
        'should NOT support simple path styles styles for exploded empty input',
        assertSimplePath(paramExplode, { path: { color: emptyInput } }, 'https://example.com/style-path/')
      );

      it(
        'should support simple path styles styles for non exploded string input',
        assertSimplePath(paramNoExplode, { path: { color: stringInput } }, 'https://example.com/style-path/blue')
      );

      it(
        'should support simple path styles styles for exploded string input',
        assertSimplePath(paramExplode, { path: { color: stringInput } }, 'https://example.com/style-path/blue')
      );

      it(
        'should support simple path styles styles for non exploded array input',
        assertSimplePath(
          paramNoExplode,
          { path: { color: arrayInput } },
          `https://example.com/style-path/blue${comma}black${comma}brown`
        )
      );

      it(
        'should support simple path styles styles for exploded array input',
        assertSimplePath(
          paramExplode,
          { path: { color: arrayInput } },
          `https://example.com/style-path/blue${comma}black${comma}brown`
        )
      );

      it(
        'should support simple path styles styles for non exploded object input',
        assertSimplePath(
          paramNoExplode,
          { path: { color: objectInput } },
          `https://example.com/style-path/R${comma}100${comma}G${comma}200${comma}B${comma}150`
        )
      );

      it(
        'should support simple path styles styles for exploded object input',
        assertSimplePath(
          paramExplode,
          { path: { color: objectInput } },
          `https://example.com/style-path/R${equals}100${comma}G${equals}200${comma}B${equals}150`
        )
      );
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

      function assertFormStyle(operation, formData: DataForHAR, expected: Request['queryString']) {
        return async () => {
          const oas = createOas('/query', operation);
          const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.queryString).to.deep.equal(expected);
        };
      }

      it(
        'should support form delimited query styles for non exploded empty input',
        assertFormStyle(paramNoExplode, { query: { color: emptyInput } }, [{ name: 'color', value: '' }])
      );
      it(
        'should support form delimited query styles for exploded empty input',
        assertFormStyle(paramExplode, { query: { color: emptyInput } }, [{ name: 'color', value: '' }])
      );

      it(
        'should support form delimited query styles for non exploded string input',
        assertFormStyle(paramNoExplode, { query: { color: stringInput } }, [{ name: 'color', value: 'blue' }])
      );

      it(
        'should support form delimited query styles for non exploded string input and NOT encode already encoded values',
        assertFormStyle(paramNoExplode, { query: { color: stringInputEncoded } }, [
          { name: 'color', value: 'something%26nothing%3Dtrue' },
        ])
      );

      it(
        'should support form delimited query styles for exploded string input',
        assertFormStyle(paramExplode, { query: { color: stringInput } }, [{ name: 'color', value: 'blue' }])
      );

      it(
        'should support form delimited query styles for exploded string input and NOT encode already encoded values',
        assertFormStyle(paramExplode, { query: { color: stringInputEncoded } }, [
          { name: 'color', value: 'something%26nothing%3Dtrue' },
        ])
      );

      it(
        'should support form delimited query styles for non exploded array input',
        assertFormStyle(paramNoExplode, { query: { color: arrayInput } }, [
          { name: 'color', value: 'blue,black,brown' },
        ])
      );

      it(
        'should support form delimited query styles for non exploded array input and NOT encode already encoded values',
        assertFormStyle(paramNoExplode, { query: { color: arrayInputEncoded } }, [
          { name: 'color', value: 'something%26nothing%3Dtrue,hash%23data' },
        ])
      );

      it(
        'should support form delimited query styles for exploded array input',
        assertFormStyle(paramExplode, { query: { color: arrayInput } }, [
          { name: 'color', value: 'blue' },
          { name: 'color', value: 'black' },
          { name: 'color', value: 'brown' },
        ])
      );

      it(
        'should support form delimited query styles for exploded array inpu and NOT encode already encoded values',
        assertFormStyle(paramExplode, { query: { color: arrayInputEncoded } }, [
          { name: 'color', value: 'something%26nothing%3Dtrue' },
          { name: 'color', value: 'hash%23data' },
        ])
      );

      it(
        'should support form delimited query styles for non exploded object input',
        assertFormStyle(paramNoExplode, { query: { color: objectInput } }, [
          { name: 'color', value: 'R,100,G,200,B,150' },
        ])
      );

      it(
        'should support form delimited query styles for non exploded object input and NOT encode already encoded values',
        assertFormStyle(paramNoExplode, { query: { color: objectInputEncoded } }, [
          { name: 'color', value: 'pound,something%26nothing%3Dtrue,hash,hash%23data' },
        ])
      );

      it(
        'should support form delimited query styles for exploded object input',
        assertFormStyle(paramExplode, { query: { color: objectInput } }, [
          { name: 'R', value: '100' },
          { name: 'G', value: '200' },
          { name: 'B', value: '150' },
        ])
      );

      it(
        'should support form delimited query styles for exploded object input and NOT encode already encoded values',
        assertFormStyle(paramExplode, { query: { color: objectInputEncoded } }, [
          { name: 'pound', value: 'something%26nothing%3Dtrue' },
          { name: 'hash', value: 'hash%23data' },
        ])
      );

      it(
        'should support allowReserved for query parameters and not replace reserved characters',
        assertFormStyle(paramReserved, { query: { color: objectInputEncoded } }, [
          { name: 'pound', value: 'something&nothing=true' },
          { name: 'hash', value: 'hash#data' },
        ])
      );
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

      function assertSpaceDelimitedStyle(operation, formData: DataForHAR, expected: Request['queryString']) {
        return async () => {
          const oas = createOas('/query', operation);
          const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.queryString).to.deep.equal(expected);
        };
      }

      it(
        'should NOT support space delimited query styles for non exploded empty input',
        assertSpaceDelimitedStyle(paramNoExplode, { query: { color: emptyInput } }, [])
      );

      it(
        'should NOT support space delimited query styles for exploded empty input',
        assertSpaceDelimitedStyle(paramExplode, { query: { color: emptyInput } }, [])
      );

      it(
        'should NOT support space delimited query styles for non exploded string input',
        assertSpaceDelimitedStyle(paramNoExplode, { query: { color: stringInput } }, [])
      );

      it(
        'should NOT support space delimited query styles for exploded string input',
        assertSpaceDelimitedStyle(paramExplode, { query: { color: stringInput } }, [])
      );

      it(
        'should support space delimited query styles for non exploded array input',
        assertSpaceDelimitedStyle(paramNoExplode, { query: { color: arrayInput } }, [
          { name: 'color', value: 'blue black brown' },
        ])
      );

      it(
        'should support space delimited query styles for non exploded array input and NOT encode already encoded values',
        assertSpaceDelimitedStyle(paramNoExplode, { query: { color: arrayInputEncoded } }, [
          { name: 'color', value: 'something%26nothing%3Dtrue hash%23data' },
        ])
      );

      it(
        'should NOT support space delimited query styles for exploded array input',
        assertSpaceDelimitedStyle(paramExplode, { query: { color: arrayInput } }, [])
      );

      it(
        'should support space delimited query styles for non exploded object input',
        assertSpaceDelimitedStyle(paramNoExplode, { query: { color: objectInput } }, [
          { name: 'color', value: 'R 100 G 200 B 150' },
        ])
      );

      it(
        'should NOT support space delimited query styles for exploded object input',
        assertSpaceDelimitedStyle(paramExplode, { query: { color: objectInput } }, [])
      );
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

      function assertPipeDelimitedStyle(operation, formData: DataForHAR, expected: Request['queryString']) {
        return async () => {
          const oas = createOas('/query', operation);
          const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.queryString).to.deep.equal(expected);
        };
      }

      it(
        'should NOT support pipe delimited query styles for non exploded empty input',
        assertPipeDelimitedStyle(paramNoExplode, { query: { color: emptyInput } }, [])
      );

      it(
        'should NOT support pipe delimited query styles for exploded empty input',
        assertPipeDelimitedStyle(paramExplode, { query: { color: emptyInput } }, [])
      );

      it(
        'should NOT support pipe delimited query styles for non exploded string input',
        assertPipeDelimitedStyle(paramNoExplode, { query: { color: stringInput } }, [])
      );

      it(
        'should NOT support pipe delimited query styles for exploded string input',
        assertPipeDelimitedStyle(paramExplode, { query: { color: stringInput } }, [])
      );

      it(
        'should support pipe delimited query styles for non exploded array input',
        assertPipeDelimitedStyle(paramNoExplode, { query: { color: arrayInput } }, [
          { name: 'color', value: 'blue|black|brown' },
        ])
      );
      it(
        'should support pipe delimited query styles for non exploded array input and NOT encode already encoded values',
        assertPipeDelimitedStyle(paramNoExplode, { query: { color: arrayInputEncoded } }, [
          { name: 'color', value: 'something%26nothing%3Dtrue|hash%23data' },
        ])
      );

      it(
        'should NOT support pipe delimited query styles for exploded array input',
        assertPipeDelimitedStyle(paramExplode, { query: { color: arrayInput } }, [])
      );

      it(
        'should support pipe delimited query styles for non exploded object input',
        assertPipeDelimitedStyle(paramNoExplode, { query: { color: objectInput } }, [
          { name: 'color', value: 'R|100|G|200|B|150' },
        ])
      );

      it(
        'should NOT support pipe delimited query styles for exploded object input',
        assertPipeDelimitedStyle(paramExplode, { query: { color: objectInput } }, [])
      );
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

      function assertDeepObjectStyle(operation, formData: DataForHAR, expected: Request['queryString']) {
        return async () => {
          const oas = createOas('/query', operation);
          const har = oasToHar(oas, oas.operation('/query', 'get'), formData);
          await expect(har).to.be.a.har;

          expect(har.log.entries[0].request.queryString).to.deep.equal(expected);
        };
      }

      it(
        'should NOT support deepObject delimited query styles for non exploded empty input',
        assertDeepObjectStyle(paramNoExplode, { query: { color: emptyInput } }, [])
      );

      it(
        'should NOT support deepObject delimited query styles for exploded empty input',
        assertDeepObjectStyle(paramExplode, { query: { color: emptyInput } }, [])
      );

      it(
        'should NOT support deepObject delimited query styles for non exploded string input',
        assertDeepObjectStyle(paramNoExplode, { query: { color: stringInput } }, [])
      );

      it(
        'should NOT support deepObject delimited query styles for exploded string input',
        assertDeepObjectStyle(paramExplode, { query: { color: stringInput } }, [])
      );

      it(
        'should NOT support deepObject delimited query styles for non exploded array input',
        assertDeepObjectStyle(paramNoExplode, { query: { color: arrayInput } }, [])
      );

      it(
        'should NOT support deepObject delimited query styles for exploded array input',
        assertDeepObjectStyle(paramExplode, { query: { color: arrayInput } }, [])
      );

      it(
        'should NOT support deepObject delimited query styles for non exploded object input',
        assertDeepObjectStyle(paramNoExplode, { query: { color: objectInput } }, [])
      );

      it(
        'should support deepObject delimited query styles for exploded object input',
        assertDeepObjectStyle(paramExplode, { query: { color: objectInput } }, [
          { name: 'color[R]', value: '100' },
          { name: 'color[G]', value: '200' },
          { name: 'color[B]', value: '150' },
        ])
      );

      it(
        'should NOT support deepObject delimited query styles for non exploded nested object input',
        assertDeepObjectStyle(paramNoExplode, { query: { color: objectNestedObject } }, [])
      );

      it(
        'should support deepObject delimited query styles for exploded nested object input',
        assertDeepObjectStyle(paramExplode, { query: { color: objectNestedObject } }, [
          { name: 'color[id]', value: 'someID' },
          { name: 'color[child][name]', value: 'childName' },
          { name: 'color[child][age]', value: 'null' },
          { name: 'color[child][metadata][name]', value: 'meta' },
        ])
      );

      it(
        'should support deepObject delimited query styles for exploded nested object (of a ridiculious shape) input',
        assertDeepObjectStyle(paramExplode, { query: { color: objectNestedObjectOfARidiculiousShape } }, [
          { name: 'color[id]', value: 'someID' },
          { name: 'color[petLicense]', value: 'null' },
          { name: 'color[dog][name]', value: 'buster' },
          { name: 'color[dog][age]', value: '18' },
          { name: 'color[dog][treats][0]', value: 'peanut%20butter' },
          { name: 'color[dog][treats][1]', value: 'apple' },
          { name: 'color[pets][0][name]', value: 'buster' },
          { name: 'color[pets][0][age]', value: 'null' },
          { name: 'color[pets][0][metadata][isOld]', value: 'true' },
        ])
      );

      it(
        'should support deepObject delimited query styles for exploded object input and NOT encode already encoded values',
        assertDeepObjectStyle(paramExplode, { query: { color: objectInputEncoded } }, [
          { name: 'color[pound]', value: 'something%26nothing%3Dtrue' },
          { name: 'color[hash]', value: 'hash%23data' },
        ])
      );
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

    function assertCookies(operation, formData: DataForHAR, expected: Request['cookies']) {
      return async () => {
        const oas = createOas('/cookies', operation);
        const har = oasToHar(oas, oas.operation('/cookies', 'get'), formData);
        await expect(har).to.be.a.har;

        expect(har.log.entries[0].request.cookies).to.deep.equal(expected);
      };
    }

    it(
      'should support form delimited cookie styles for non exploded empty input',
      assertCookies(paramNoExplode, { cookie: { color: emptyInput } }, [{ name: 'color', value: '' }])
    );

    it(
      'should support form delimited cookie styles for exploded empty input',
      assertCookies(paramExplode, { cookie: { color: emptyInput } }, [{ name: 'color', value: '' }])
    );

    it(
      'should support form delimited cookie styles for non exploded string input',
      assertCookies(
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
        [{ name: 'color', value: 'blue' }]
      )
    );

    it(
      'should support form delimited cookie styles for exploded string input',
      assertCookies(paramExplode, { cookie: { color: stringInput } }, [{ name: 'color', value: 'blue' }])
    );

    it(
      'should support form delimited cookie styles for non exploded array input',
      assertCookies(paramNoExplode, { cookie: { color: arrayInput } }, [{ name: 'color', value: 'blue,black,brown' }])
    );

    it(
      'should support form delimited cookie styles for exploded array input',
      assertCookies(paramExplode, { cookie: { color: arrayInput } }, [
        { name: 'color', value: 'blue' },
        { name: 'color', value: 'black' },
        { name: 'color', value: 'brown' },
      ])
    );

    it(
      'should support form delimited cookie styles for non exploded object input',
      assertCookies(paramNoExplode, { cookie: { color: objectInput } }, [{ name: 'color', value: 'R,100,G,200,B,150' }])
    );

    it(
      'should support form delimited cookie styles for exploded object input',
      assertCookies(paramExplode, { cookie: { color: objectInput } }, [
        { name: 'R', value: '100' },
        { name: 'G', value: '200' },
        { name: 'B', value: '150' },
      ])
    );
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

    function assertHeaders(operation, formData: DataForHAR, expected: Request['headers']) {
      return async () => {
        const oas = createOas('/header', operation);
        const har = oasToHar(oas, oas.operation('/header', 'get'), formData);
        await expect(har).to.be.a.har;

        expect(har.log.entries[0].request.headers).to.deep.equal(expected);
      };
    }

    it(
      'should NOT support simple header styles for non exploded empty input',
      assertHeaders(paramNoExplode, { header: { color: emptyInput } }, [])
    );

    it(
      'should NOT support simple header styles for exploded empty input',
      assertHeaders(paramExplode, { header: { color: emptyInput } }, [])
    );

    it(
      'should support simple header styles for non exploded string input',
      assertHeaders(paramNoExplode, { header: { color: stringInput } }, [{ name: 'color', value: 'blue' }])
    );

    it(
      'should support simple header styles for exploded string input',
      assertHeaders(paramExplode, { header: { color: stringInput } }, [{ name: 'color', value: 'blue' }])
    );

    it(
      'should support simple header styles for non exploded arrays',
      assertHeaders(paramNoExplode, { header: { color: arrayInput } }, [{ name: 'color', value: 'blue,black,brown' }])
    );

    it(
      'should support simple header styles for exploded arrays',
      assertHeaders(
        paramExplode,
        { header: { color: arrayInput } },
        /**
         * NOTE: The wording of explode sounds like exploding this object should lead to multiple
         * color headers, but the examples at show a single header. I believe this is because in
         * HTTP (https://tools.ietf.org/html/rfc7230#section-3.2.2), multiple identical headers are
         * represented by a comma separated list in a single header
         *
         * @see {@link https://swagger.io/docs/specification/serialization/#header}
         * */
        [{ name: 'color', value: 'blue,black,brown' }]
      )
    );

    it(
      'should support simple header styles for non exploded objects',
      assertHeaders(paramNoExplode, { header: { color: objectInput } }, [{ name: 'color', value: 'R,100,G,200,B,150' }])
    );

    it(
      'should support simple header styles for exploded objects',
      assertHeaders(
        paramExplode,
        { header: { color: objectInput } },
        /**
         * NOTE: The wording of explode sounds like exploding this object should lead to an R, G
         * and B header, but the examples show a single header. I'm not sure why this is the case,
         * since explosion should push these values up one level. I would think that we would end
         * up with R, G and B headers. For some unclear reason we do not.
         *
         * @see {@link https://swagger.io/docs/specification/serialization/#header}
         */
        [{ name: 'color', value: 'R=100,G=200,B=150' }]
      )
    );

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