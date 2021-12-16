const extensions = require('@readme/oas-extensions');
const Oas = require('oas').default;
const oasToHar = require('../src');
const toBeAValidHAR = require('jest-expect-har').default;

const petstore = require('@readme/oas-examples/3.0/json/petstore.json');
const serverVariables = require('./__fixtures__/server-variables.json');

expect.extend({ toBeAValidHAR });

test('should output a HAR object if no operation information is supplied', async () => {
  const har = oasToHar(new Oas({}));

  await expect(har).toBeAValidHAR();
  expect(har).toStrictEqual({
    log: {
      entries: [
        {
          request: {
            bodySize: 0,
            cookies: [],
            headers: [],
            headersSize: 0,
            httpVersion: 'HTTP/1.1',
            method: '',
            queryString: [],
            url: 'https://example.com',
          },
        },
      ],
    },
  });
});

test('should accept an Operation instance as the operation schema', async () => {
  const spec = new Oas(petstore);
  const operation = spec.operation('/pet', 'post');
  const har = oasToHar(spec, operation);

  await expect(har).toBeAValidHAR();
  expect(har).toStrictEqual({
    log: {
      entries: [
        {
          request: {
            cookies: [],
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            headersSize: 0,
            queryString: [],
            bodySize: 0,
            method: 'POST',
            url: 'http://petstore.swagger.io/v2/pet',
            httpVersion: 'HTTP/1.1',
          },
        },
      ],
    },
  });
});

describe('url', () => {
  it('should be constructed from oas.url()', () => {
    const spec = new Oas(petstore);
    const operation = spec.operation('/pet', 'post');
    const har = oasToHar(spec, operation);

    expect(har.log.entries[0].request.url).toBe(`${spec.url()}/pet`);
  });

  it('should replace whitespace with %20', () => {
    const spec = new Oas({
      paths: {
        '/path with spaces': {
          get: {},
        },
      },
    });

    expect(oasToHar(spec, spec.operation('/path with spaces', 'get')).log.entries[0].request.url).toBe(
      'https://example.com/path%20with%20spaces'
    );
  });

  describe('server variables', () => {
    const variablesOas = new Oas(serverVariables);
    const operation = variablesOas.operation('/', 'post');

    it('should use defaults if not supplied', () => {
      const har = oasToHar(variablesOas, operation, {});
      expect(har.log.entries[0].request.url).toBe('https://demo.example.com:443/v2/');
    });

    it('should support server variables', () => {
      const formData = {
        server: {
          selected: 0,
          variables: { name: 'buster', port: 8080, basePath: 'v2.1' },
        },
      };

      const har = oasToHar(variablesOas, operation, formData);
      expect(har.log.entries[0].request.url).toBe('https://buster.example.com:8080/v2.1/');
    });

    it('should support multiple/alternate servers', () => {
      const formData = {
        server: {
          selected: 1,
          variables: { name: 'buster', port: 8080, basePath: 'v2.1' },
        },
      };

      const har = oasToHar(variablesOas, operation, formData);
      expect(har.log.entries[0].request.url).toBe('http://buster.local/v2.1/');
    });

    it('should not error if the selected server does not exist', () => {
      const formData = {
        server: {
          selected: 3,
        },
      };

      const har = oasToHar(variablesOas, operation, formData);
      expect(har.log.entries[0].request.url).toBe('https://example.com/');
    });

    it('should fill in missing variables with their defaults', () => {
      const formData = {
        server: {
          selected: 0,
          variables: { name: 'buster' }, // `port` and `basePath` are missing
        },
      };

      const har = oasToHar(variablesOas, operation, formData);
      expect(har.log.entries[0].request.url).toBe('https://buster.example.com:443/v2/');
    });
  });

  describe('proxy url', () => {
    const proxyOas = new Oas({
      paths: {
        '/path': {
          get: {},
        },
      },
      [extensions.PROXY_ENABLED]: true,
    });

    it('should not be prefixed with without option', () => {
      const har = oasToHar(proxyOas, proxyOas.operation('/path', 'get'));
      expect(har.log.entries[0].request.url).toBe('https://example.com/path');
    });

    it('should be prefixed with try.readme.io with option', () => {
      const har = oasToHar(proxyOas, proxyOas.operation('/path', 'get'), {}, {}, { proxyUrl: true });
      expect(har.log.entries[0].request.url).toBe('https://try.readme.io/https://example.com/path');
    });
  });
});

describe('auth', () => {
  it('should work for header', () => {
    const spec = new Oas({
      paths: {
        '/security': {
          get: {
            security: [{ 'auth-header': [] }],
          },
        },
      },
      components: {
        securitySchemes: {
          'auth-header': {
            type: 'apiKey',
            name: 'x-auth-header',
            in: 'header',
          },
        },
      },
    });

    expect(
      oasToHar(spec, spec.operation('/security', 'get'), {}, { 'auth-header': 'value' }).log.entries[0].request.headers
    ).toStrictEqual([
      {
        name: 'x-auth-header',
        value: 'value',
      },
    ]);
  });

  it('should work for query', () => {
    const spec = new Oas({
      paths: {
        '/security': {
          get: {
            security: [{ 'auth-query': [] }],
          },
        },
      },
      components: {
        securitySchemes: {
          'auth-query': {
            type: 'apiKey',
            name: 'authQuery',
            in: 'query',
          },
        },
      },
    });

    expect(
      oasToHar(
        spec,
        spec.operation('/security', 'get'),
        {},
        {
          'auth-query': 'value',
        }
      ).log.entries[0].request.queryString
    ).toStrictEqual([
      {
        name: 'authQuery',
        value: 'value',
      },
    ]);
  });

  it('should work for cookie', () => {
    const spec = new Oas({
      paths: {
        '/security': {
          get: {
            security: [{ 'auth-cookie': [] }],
          },
        },
      },
      components: {
        securitySchemes: {
          'auth-cookie': {
            type: 'apiKey',
            name: 'authCookie',
            in: 'cookie',
          },
        },
      },
    });

    expect(
      oasToHar(
        spec,
        spec.operation('/security', 'get'),
        {},
        {
          'auth-cookie': 'value',
        }
      ).log.entries[0].request.cookies
    ).toStrictEqual([
      {
        name: 'authCookie',
        value: 'value',
      },
    ]);
  });

  it('should work for multiple (||)', () => {
    const spec = new Oas({
      paths: {
        '/security': {
          get: {
            security: [{ 'auth-header': [] }, { 'auth-header2': [] }],
          },
        },
      },
      components: {
        securitySchemes: {
          'auth-header': {
            type: 'apiKey',
            name: 'x-auth-header',
            in: 'header',
          },
          'auth-header2': {
            type: 'apiKey',
            name: 'x-auth-header2',
            in: 'header',
          },
        },
      },
    });

    expect(
      oasToHar(
        spec,
        spec.operation('/security', 'get'),
        {},
        {
          'auth-header': 'value',
          'auth-header2': 'value',
        }
      ).log.entries[0].request.headers
    ).toStrictEqual([
      {
        name: 'x-auth-header',
        value: 'value',
      },
      {
        name: 'x-auth-header2',
        value: 'value',
      },
    ]);
  });

  it('should work for multiple (&&)', () => {
    const spec = new Oas({
      paths: {
        '/security': {
          get: {
            security: [{ 'auth-header': [], 'auth-header2': [] }],
          },
        },
      },
      components: {
        securitySchemes: {
          'auth-header': {
            type: 'apiKey',
            name: 'x-auth-header',
            in: 'header',
          },
          'auth-header2': {
            type: 'apiKey',
            name: 'x-auth-header2',
            in: 'header',
          },
        },
      },
    });

    expect(
      oasToHar(
        spec,
        spec.operation('/security', 'get'),
        {},
        {
          'auth-header': 'value',
          'auth-header2': 'value',
        }
      ).log.entries[0].request.headers
    ).toStrictEqual([
      {
        name: 'x-auth-header',
        value: 'value',
      },
      {
        name: 'x-auth-header2',
        value: 'value',
      },
    ]);
  });

  it('should not set non-existent values', () => {
    const spec = new Oas({
      paths: {
        '/security': {
          get: {
            security: [{ 'auth-header': [] }],
          },
        },
      },
      components: {
        securitySchemes: {
          'auth-header': {
            type: 'apiKey',
            name: 'x-auth-header',
            in: 'header',
          },
        },
      },
    });

    const har = oasToHar(spec, spec.operation('/security', 'get'), {}, {});
    expect(har.log.entries[0].request.headers).toStrictEqual([]);
  });
});

describe('x-headers', () => {
  it('should append any static headers to the request', () => {
    const spec = new Oas({
      paths: {
        '/': {
          post: {},
        },
      },
      'x-headers': [
        {
          key: 'x-api-key',
          value: '123456',
        },
      ],
    });

    expect(oasToHar(spec, spec.operation('/', 'post')).log.entries[0].request.headers).toStrictEqual([
      { name: 'x-api-key', value: '123456' },
    ]);
  });
});
