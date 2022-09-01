import type { OASDocument, SecuritySchemeObject } from 'oas/dist/rmoas.types';

import { expect } from 'chai';

import configureSecurity from '../../src/lib/configure-security';

function createSecurityOAS(scheme: SecuritySchemeObject) {
  return {
    components: { securitySchemes: { busterAuth: scheme } },
  } as unknown as OASDocument;
}

describe('configure-security', function () {
  it('should return an empty object if there is no security keys', function () {
    expect(configureSecurity({} as OASDocument, {}, '')).to.be.undefined;
  });

  it('should return undefined if no values', function () {
    const spec = createSecurityOAS({ type: 'apiKey', in: 'header', name: 'key' });

    expect(configureSecurity(spec, {}, 'busterAuth')).to.be.undefined;
  });

  it('should not return non-existent values', function () {
    const spec = createSecurityOAS({ type: 'apiKey', in: 'header', name: 'key' });

    expect(configureSecurity(spec, {}, 'busterAuth')).to.be.undefined;
  });

  describe('http auth support', function () {
    describe('type=basic', function () {
      it('should work for basic type', function () {
        const user = 'user';
        const pass = 'pass';
        const spec = createSecurityOAS({ type: 'http', scheme: 'basic' });

        expect(configureSecurity(spec, { busterAuth: { user, pass } }, 'busterAuth')).to.deep.equal({
          type: 'headers',
          value: {
            name: 'Authorization',
            value: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
          },
        });
      });

      it('should work if a password is present but the username is empty or null', function () {
        const user = null;
        const pass = 'pass';
        const spec = createSecurityOAS({ type: 'http', scheme: 'basic' });

        expect(configureSecurity(spec, { busterAuth: { user, pass } }, 'busterAuth')).to.deep.equal({
          type: 'headers',
          value: {
            name: 'Authorization',
            value: `Basic ${Buffer.from(`:${pass}`).toString('base64')}`,
          },
        });
      });

      it('should work if the password is empty or null', function () {
        const user = 'user';
        const pass = null;
        const spec = createSecurityOAS({ type: 'http', scheme: 'basic' });

        expect(configureSecurity(spec, { busterAuth: { user, pass } }, 'busterAuth')).to.deep.equal({
          type: 'headers',
          value: {
            name: 'Authorization',
            value: `Basic ${Buffer.from(`${user}:`).toString('base64')}`,
          },
        });
      });

      it('should return with no header if wanted scheme is missing', function () {
        const spec = createSecurityOAS({ type: 'http', scheme: 'basic' });

        expect(configureSecurity(spec, { anotherSchemeName: { user: '', pass: '' } }, 'busterAuth')).to.be.false;
      });

      it('should return with no header if user and password are blank', function () {
        const spec = createSecurityOAS({ type: 'http', scheme: 'basic' });

        expect(configureSecurity(spec, { busterAuth: { user: '', pass: '' } }, 'busterAuth')).to.be.false;
      });

      it('should return with a header if user or password are not blank', function () {
        const user = 'user';
        const spec = createSecurityOAS({ type: 'http', scheme: 'basic' });

        expect(configureSecurity(spec, { busterAuth: { user, pass: '' } }, 'busterAuth')).to.deep.equal({
          type: 'headers',
          value: {
            name: 'Authorization',
            value: `Basic ${Buffer.from(`${user}:`).toString('base64')}`,
          },
        });
      });
    });

    describe('scheme `bearer`', function () {
      it('should work for bearer', function () {
        const apiKey = '123456';
        const spec = createSecurityOAS({ type: 'http', scheme: 'bearer' });

        expect(configureSecurity(spec, { busterAuth: apiKey }, 'busterAuth')).to.deep.equal({
          type: 'headers',
          value: {
            name: 'Authorization',
            value: `Bearer ${apiKey}`,
          },
        });
      });

      it('should return with no header if apiKey is blank', function () {
        const values = {
          auth: { test: '' },
        };

        const spec = createSecurityOAS({ type: 'http', scheme: 'bearer' });

        expect(
          configureSecurity(
            spec,
            // @ts-expect-error Testing a failure case here
            values,
            'busterAuth'
          )
        ).to.be.false;
      });
    });
  });

  describe('oauth2 support', function () {
    it('should work for oauth2', function () {
      const apiKey = '123456';
      const spec = createSecurityOAS({ type: 'oauth2', flows: {} });

      expect(configureSecurity(spec, { busterAuth: apiKey }, 'busterAuth')).to.deep.equal({
        type: 'headers',
        value: {
          name: 'Authorization',
          value: `Bearer ${apiKey}`,
        },
      });
    });

    it('should return with no header if apiKey is blank', function () {
      const spec = createSecurityOAS({ type: 'oauth2', flows: {} });

      expect(configureSecurity(spec, { busterAuth: '' }, 'busterAuth')).to.be.false;
    });
  });

  describe('apiKey auth support', function () {
    describe('in `query`', function () {
      it('should work for query', function () {
        const values = { busterAuth: 'value' };
        const security: SecuritySchemeObject = { type: 'apiKey', in: 'query', name: 'key' };
        const spec = createSecurityOAS(security);

        expect(configureSecurity(spec, values, 'busterAuth')).to.deep.equal({
          type: 'queryString',
          value: {
            name: security.name,
            value: values.busterAuth,
          },
        });
      });
    });

    describe('in `header`', function () {
      it('should work for header', function () {
        const values = { busterAuth: 'value' };
        const security: SecuritySchemeObject = { type: 'apiKey', in: 'header', name: 'key' };
        const spec = createSecurityOAS(security);

        expect(configureSecurity(spec, values, 'busterAuth')).to.deep.equal({
          type: 'headers',
          value: {
            name: security.name,
            value: values.busterAuth,
          },
        });
      });

      describe('x-bearer-format', function () {
        it('should work for bearer', function () {
          const values = { busterAuth: 'value' };
          const security: SecuritySchemeObject & { 'x-bearer-format': string } = {
            type: 'apiKey',
            in: 'header',
            name: 'key',
            'x-bearer-format': 'bearer',
          };

          const spec = createSecurityOAS(security);

          expect(configureSecurity(spec, values, 'busterAuth')).to.deep.equal({
            type: 'headers',
            value: {
              name: security.name,
              value: `Bearer ${values.busterAuth}`,
            },
          });
        });

        it('should work for basic', function () {
          const values = { busterAuth: 'value' };
          const security: SecuritySchemeObject & { 'x-bearer-format': string } = {
            type: 'apiKey',
            in: 'header',
            name: 'key',
            'x-bearer-format': 'basic',
          };

          const spec = createSecurityOAS(security);

          expect(configureSecurity(spec, values, 'busterAuth')).to.deep.equal({
            type: 'headers',
            value: {
              name: security.name,
              value: `Basic ${values.busterAuth}`,
            },
          });
        });

        it('should work for token', function () {
          const values = { busterAuth: 'value' };
          const security: SecuritySchemeObject & { 'x-bearer-format': string } = {
            type: 'apiKey',
            in: 'header',
            name: 'key',
            'x-bearer-format': 'token',
          };

          const spec = createSecurityOAS(security);

          expect(configureSecurity(spec, values, 'busterAuth')).to.deep.equal({
            type: 'headers',
            value: {
              name: security.name,
              value: `Token ${values.busterAuth}`,
            },
          });
        });
      });
    });
  });
});
