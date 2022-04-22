const chai = require('chai');
const { expect } = require('chai');

const extensions = require('@readme/oas-extensions');
const Oas = require('oas').default;
const oasToHar = require('../src');

const chaiPlugins = require('./helpers/chai-plugins');

const petstore = require('@readme/oas-examples/3.0/json/petstore.json');
const serverVariables = require('./__datasets__/server-variables.json');

chai.use(chaiPlugins);

describe('oas-to-har', function () {
  it('should output a HAR object if no operation information is supplied', async function () {
    const har = oasToHar(new Oas({}));

    await expect(har).to.be.a.har;
    expect(har).to.deep.equal({
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

  it('should accept an Operation instance as the operation schema', async function () {
    const spec = new Oas(petstore);
    await spec.dereference();

    const operation = spec.operation('/pet', 'post');
    const har = oasToHar(spec, operation);

    await expect(har).to.be.a.har;
    expect(har).to.deep.equal({
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

  it('should return a valid HAR without an apiDefintion', async function () {
    const spec = new Oas({});
    const operation = spec.operation('/pet', 'post');
    const har = oasToHar(spec, operation);

    await expect(har).to.be.a.har;
  });

  describe('url', function () {
    it('should be constructed from oas.url()', function () {
      const spec = new Oas(petstore);
      const operation = spec.operation('/pet', 'post');
      const har = oasToHar(spec, operation);

      expect(har.log.entries[0].request.url).to.equal(`${spec.url()}/pet`);
    });

    it('should replace whitespace with %20', function () {
      const spec = new Oas({
        paths: {
          '/path with spaces': {
            get: {},
          },
        },
      });

      expect(oasToHar(spec, spec.operation('/path with spaces', 'get')).log.entries[0].request.url).to.equal(
        'https://example.com/path%20with%20spaces'
      );
    });

    describe('server variables', function () {
      let variablesOas;
      let operation;

      beforeEach(function () {
        variablesOas = new Oas(serverVariables);
        operation = variablesOas.operation('/', 'post');
      });

      it('should use defaults if not supplied', function () {
        const har = oasToHar(variablesOas, operation, {});
        expect(har.log.entries[0].request.url).to.equal('https://demo.example.com:443/v2/');
      });

      it('should support server variables', function () {
        const formData = {
          server: {
            selected: 0,
            variables: { name: 'buster', port: 8080, basePath: 'v2.1' },
          },
        };

        const har = oasToHar(variablesOas, operation, formData);
        expect(har.log.entries[0].request.url).to.equal('https://buster.example.com:8080/v2.1/');
      });

      it('should support multiple/alternate servers', function () {
        const formData = {
          server: {
            selected: 1,
            variables: { name: 'buster', port: 8080, basePath: 'v2.1' },
          },
        };

        const har = oasToHar(variablesOas, operation, formData);
        expect(har.log.entries[0].request.url).to.equal('http://buster.local/v2.1/');
      });

      it('should not error if the selected server does not exist', function () {
        const formData = {
          server: {
            selected: 3,
          },
        };

        const har = oasToHar(variablesOas, operation, formData);
        expect(har.log.entries[0].request.url).to.equal('https://example.com/');
      });

      it('should fill in missing variables with their defaults', function () {
        const formData = {
          server: {
            selected: 0,
            variables: { name: 'buster' }, // `port` and `basePath` are missing
          },
        };

        const har = oasToHar(variablesOas, operation, formData);
        expect(har.log.entries[0].request.url).to.equal('https://buster.example.com:443/v2/');
      });
    });

    describe('proxy url', function () {
      let proxyOas;

      beforeEach(function () {
        proxyOas = new Oas({
          paths: {
            '/path': {
              get: {},
            },
          },
          [extensions.PROXY_ENABLED]: true,
        });
      });

      it('should not be prefixed with without option', function () {
        const har = oasToHar(proxyOas, proxyOas.operation('/path', 'get'));
        expect(har.log.entries[0].request.url).to.equal('https://example.com/path');
      });

      it('should be prefixed with try.readme.io with option', function () {
        const har = oasToHar(proxyOas, proxyOas.operation('/path', 'get'), {}, {}, { proxyUrl: true });
        expect(har.log.entries[0].request.url).to.equal('https://try.readme.io/https://example.com/path');
      });
    });
  });

  describe('auth', function () {
    it('should work for header', function () {
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
        oasToHar(spec, spec.operation('/security', 'get'), {}, { 'auth-header': 'value' }).log.entries[0].request
          .headers
      ).to.deep.equal([
        {
          name: 'x-auth-header',
          value: 'value',
        },
      ]);
    });

    it('should work for query', function () {
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
      ).to.deep.equal([
        {
          name: 'authQuery',
          value: 'value',
        },
      ]);
    });

    it('should work for cookie', function () {
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
      ).to.deep.equal([
        {
          name: 'authCookie',
          value: 'value',
        },
      ]);
    });

    it('should work for multiple (||)', function () {
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
      ).to.deep.equal([
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

    it('should work for multiple (&&)', function () {
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
      ).to.deep.equal([
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

    it('should not set non-existent values', function () {
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
      expect(har.log.entries[0].request.headers).to.be.empty;
    });
  });

  describe('x-headers', function () {
    it('should append any static headers to the request', function () {
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

      expect(oasToHar(spec, spec.operation('/', 'post')).log.entries[0].request.headers).to.deep.equal([
        { name: 'x-api-key', value: '123456' },
      ]);
    });
  });
});
