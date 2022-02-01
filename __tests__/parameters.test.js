const Oas = require('oas').default;
const oasToHar = require('../src');
const toBeAValidHAR = require('jest-expect-har').default;

const commonParameters = require('./__fixtures__/common-parameters.json');

expect.extend({ toBeAValidHAR });

describe('path', () => {
  it('should pass through unknown path params', () => {
    const spec = new Oas({
      paths: {
        '/path-param/{id}': {
          get: {},
          post: {
            parameters: [
              {
                name: 'something-else',
                in: 'path',
                required: true,
              },
            ],
          },
        },
      },
    });

    expect(oasToHar(spec, spec.operation('/path-param/{id}', 'get')).log.entries[0].request.url).toBe(
      'https://example.com/path-param/id'
    );

    expect(oasToHar(spec, spec.operation('/path-param/{id}', 'post')).log.entries[0].request.url).toBe(
      'https://example.com/path-param/id'
    );
  });

  it.each([
    [
      'should not error if empty object passed in for values',
      {
        parameters: [{ name: 'id', in: 'path', required: true }],
      },
      {},
      'https://example.com/path-param/id',
    ],
    [
      'should use default if no value',
      {
        parameters: [{ name: 'id', in: 'path', required: true, schema: { default: '123' } }],
      },
      {},
      'https://example.com/path-param/123',
    ],
    [
      'should add path values to the url',
      {
        parameters: [{ name: 'id', in: 'path', required: true }],
      },
      { path: { id: '456' } },
      'https://example.com/path-param/456',
    ],
    [
      'should add falsy values to the url',
      {
        parameters: [{ name: 'id', in: 'path', required: true }],
      },
      { path: { id: 0 } },
      'https://example.com/path-param/0',
    ],
  ])('%s', async (_, operation, formData, expectedUrl) => {
    const spec = new Oas({
      paths: {
        '/path-param/{id}': {
          get: operation,
        },
      },
    });

    const har = oasToHar(spec, spec.operation('/path-param/{id}', 'get'), formData);
    await expect(har).toBeAValidHAR();

    expect(har.log.entries[0].request.url).toStrictEqual(expectedUrl);
  });
});

describe('query', () => {
  it.each([
    [
      'should not add on empty unrequired values',
      {
        parameters: [{ name: 'a', in: 'query' }],
      },
    ],
    [
      'should not add the parameter name as a value if required but missing',
      {
        parameters: [{ name: 'a', in: 'query', required: true }],
      },
    ],
    [
      'should set defaults if no value provided but is required',
      {
        parameters: [{ name: 'a', in: 'query', required: true, schema: { default: 'value' } }],
      },
      {},
      [{ name: 'a', value: 'value' }],
    ],
    [
      'should pass in value if one is set and prioritise provided values',
      {
        parameters: [{ name: 'a', in: 'query', required: true, schema: { default: 'value' } }],
      },
      { query: { a: 'test' } },
      [{ name: 'a', value: 'test' }],
    ],
    [
      'should add falsy values to the querystring',
      {
        parameters: [{ name: 'id', in: 'query' }],
      },
      { query: { id: 0 } },
      [{ name: 'id', value: '0' }],
    ],
    [
      'should handle null array values',
      {
        parameters: [{ name: 'id', in: 'query' }],
      },
      { query: { id: [null, null] } },
      [{ name: 'id', value: '&id=' }],
    ],
    [
      'should handle null values',
      {
        parameters: [{ name: 'id', in: 'query' }],
      },
      { query: { id: null } },
      [{ name: 'id', value: 'null' }],
    ],
    [
      'should handle null default values',
      {
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
              default: [null, null],
            },
          },
        ],
      },
      { query: {} },
      [{ name: 'id', value: '&id=' }],
    ],
  ])('%s', async (_, operation = {}, formData = {}, expectedQueryString = []) => {
    const spec = new Oas({
      paths: {
        '/query': {
          get: operation,
        },
      },
    });

    const har = oasToHar(spec, spec.operation('/query', 'get'), formData);
    await expect(har).toBeAValidHAR();

    expect(har.log.entries[0].request.queryString).toStrictEqual(expectedQueryString);
  });

  describe('URI encoding', () => {
    const spec = new Oas({
      servers: [{ url: 'https://httpbin.org/' }],
      paths: {
        '/anything': {
          get: {
            parameters: [
              { name: 'stringPound', in: 'query', schema: { type: 'string' } },
              { name: 'stringPound2', in: 'query', schema: { type: 'string' } },
              { name: 'stringHash', in: 'query', schema: { type: 'string' } },
              { name: 'stringArray', in: 'query', schema: { type: 'string' } },
              { name: 'stringWeird', in: 'query', schema: { type: 'string' } },
              { name: 'array', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
            ],
          },
        },
      },
    });

    it('should encode query parameters', async () => {
      const formData = {
        query: {
          stringPound: 'something&nothing=true',
          stringHash: 'hash#data',
          stringArray: 'where[4]=10',
          stringWeird: 'properties["$email"] == "testing"',
          array: [
            encodeURIComponent('something&nothing=true'), // This is already encoded so it shouldn't be double encoded.
            'nothing&something=false',
            'another item',
          ],
        },
      };

      const operation = spec.operation('/anything', 'get');

      const har = oasToHar(spec, operation, formData);
      await expect(har).toBeAValidHAR();

      expect(har.log.entries[0].request.queryString).toStrictEqual([
        { name: 'stringPound', value: 'something%26nothing%3Dtrue' },
        { name: 'stringHash', value: 'hash%23data' },
        { name: 'stringArray', value: 'where%5B4%5D%3D10' },
        {
          name: 'stringWeird',
          value: 'properties%5B%22%24email%22%5D%20%3D%3D%20%22testing%22',
        },
        { name: 'array', value: 'something%26nothing%3Dtrue&array=nothing%26something%3Dfalse&array=another%20item' },
      ]);
    });

    it('should not double encode query parameters that are already encoded', async () => {
      const formData = {
        query: {
          stringPound: encodeURIComponent('something&nothing=true'),
          stringHash: encodeURIComponent('hash#data'),
          stringArray: encodeURIComponent('where[4]=10'),
          stringWeird: encodeURIComponent('properties["$email"] == "testing"'),
          array: [
            'something&nothing=true', // Should still encode this one eventhrough the others are already encoded.
            encodeURIComponent('nothing&something=false'),
            encodeURIComponent('another item'),
          ],
        },
      };

      const operation = spec.operation('/anything', 'get');

      const har = oasToHar(spec, operation, formData);
      await expect(har).toBeAValidHAR();

      expect(har.log.entries[0].request.queryString).toStrictEqual([
        { name: 'stringPound', value: 'something%26nothing%3Dtrue' },
        { name: 'stringHash', value: 'hash%23data' },
        { name: 'stringArray', value: 'where%5B4%5D%3D10' },
        {
          name: 'stringWeird',
          value: 'properties%5B%22%24email%22%5D%20%3D%3D%20%22testing%22',
        },
        { name: 'array', value: 'something%26nothing%3Dtrue&array=nothing%26something%3Dfalse&array=another%20item' },
      ]);
    });
  });
});

describe('cookie', () => {
  it.each([
    [
      'should not add on empty unrequired values',
      {
        parameters: [{ name: 'a', in: 'cookie' }],
      },
    ],
    [
      'should not add the parameter name as a value if required but missing',
      {
        parameters: [{ name: 'a', in: 'cookie', required: true }],
      },
    ],
    [
      'should set defaults if no value provided but is required',
      {
        parameters: [{ name: 'a', in: 'cookie', required: true, schema: { default: 'value' } }],
      },
      {},
      [{ name: 'a', value: 'value' }],
    ],
    [
      'should pass in value if one is set and prioritize provided values',
      {
        parameters: [{ name: 'a', in: 'cookie', required: true, schema: { default: 'value' } }],
      },
      { cookie: { a: 'test' } },
      [{ name: 'a', value: 'test' }],
    ],
    [
      'should add falsy values to the cookies',
      {
        parameters: [{ name: 'id', in: 'cookie' }],
      },
      { cookie: { id: 0 } },
      [{ name: 'id', value: '0' }],
    ],
  ])('%s', async (_, operation = {}, formData = {}, expectedCookies = []) => {
    const spec = new Oas({
      paths: {
        '/cookie': {
          get: operation,
        },
      },
    });

    const har = oasToHar(spec, spec.operation('/cookie', 'get'), formData);
    await expect(har).toBeAValidHAR();

    expect(har.log.entries[0].request.cookies).toStrictEqual(expectedCookies);
  });
});

describe('header', () => {
  it.each([
    [
      'should not add on empty unrequired values',
      {
        parameters: [{ name: 'a', in: 'header' }],
      },
    ],
    [
      'should not add the parameter name as a value if required but missing',
      {
        parameters: [{ name: 'a', in: 'header', required: true }],
      },
    ],
    [
      'should set defaults if no value provided but is required',
      {
        parameters: [{ name: 'a', in: 'header', required: true, schema: { default: 'value' } }],
      },
      {},
      [{ name: 'a', value: 'value' }],
    ],
    [
      'should pass in value if one is set and prioritise provided values',
      {
        parameters: [{ name: 'a', in: 'header', required: true, schema: { default: 'value' } }],
      },
      { header: { a: 'test' } },
      [{ name: 'a', value: 'test' }],
    ],
    [
      'should pass accept header if endpoint expects a content back from response',
      {
        parameters: [{ name: 'a', in: 'header', required: true, schema: { default: 'value' } }],
        responses: {
          200: {
            content: {
              'application/xml': { type: 'array' },
              'application/json': { type: 'array' },
            },
          },
        },
      },
      {},
      [
        { name: 'Accept', value: 'application/xml' },
        { name: 'a', value: 'value' },
      ],
    ],
    [
      'should only add one accept header',
      {
        responses: {
          200: {
            content: {
              'application/xml': {},
            },
          },
          400: {
            content: {
              'application/json': {},
            },
          },
        },
      },
      {},
      [{ name: 'Accept', value: 'application/xml' }],
    ],
    [
      'should only receive one accept header if specified in values',
      {
        parameters: [{ name: 'Accept', in: 'header' }],
        responses: {
          200: {
            content: {
              'application/json': {},
              'application/xml': {},
            },
          },
        },
      },
      { header: { Accept: 'application/xml' } },
      [{ name: 'Accept', value: 'application/xml' }],
    ],
    [
      'should add accept header if specified in formdata',
      {
        responses: {
          200: {
            content: {
              'application/json': {},
              'application/xml': {},
            },
          },
        },
      },
      { header: { Accept: 'application/xml' } },
      [{ name: 'Accept', value: 'application/xml' }],
    ],
    [
      'should add falsy values to the headers',
      {
        parameters: [{ name: 'id', in: 'header' }],
      },
      { header: { id: 0 } },
      [{ name: 'id', value: '0' }],
    ],
  ])('%s', async (_, operation = {}, formData = {}, expectedHeaders = []) => {
    const spec = new Oas({
      paths: {
        '/header': {
          post: operation,
        },
      },
    });

    const har = oasToHar(spec, spec.operation('/header', 'post'), formData);
    await expect(har).toBeAValidHAR();

    expect(har.log.entries[0].request.headers).toStrictEqual(expectedHeaders);
  });
});

describe('common parameters', () => {
  it('should work for common parameters', async () => {
    const spec = new Oas(commonParameters);
    await spec.dereference();

    const har = oasToHar(spec, spec.operation('/anything/{id}', 'post'), {
      path: { id: 1234 },
      header: { 'x-extra-id': 'abcd' },
      query: { limit: 10 },
      cookie: { authtoken: 'password' },
    });

    await expect(har).toBeAValidHAR();
    expect(har.log.entries[0].request).toStrictEqual({
      bodySize: 0,
      cookies: [{ name: 'authtoken', value: 'password' }],
      headers: [{ name: 'x-extra-id', value: 'abcd' }],
      headersSize: 0,
      httpVersion: 'HTTP/1.1',
      queryString: [{ name: 'limit', value: '10' }],
      method: 'POST',
      url: 'https://httpbin.org/anything/1234',
    });
  });

  it('should not mutate the original operation that was passed in', () => {
    const spec = new Oas(commonParameters);
    const operation = spec.operation('/anything/{id}', 'post');

    const existingCount = operation.schema.parameters.length;

    oasToHar(spec, operation, {
      path: { id: 1234 },
      header: { 'x-extra-id': 'abcd' },
      query: { limit: 10 },
      cookie: { authtoken: 'password' },
    });

    expect(operation.schema.parameters).toHaveLength(existingCount);
  });
});
