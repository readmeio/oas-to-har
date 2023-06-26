import type { OASDocument, SecuritySchemeObject } from 'oas/dist/rmoas.types';

import configureSecurity from '../../src/lib/configure-security';

function createSecurityOAS(scheme: SecuritySchemeObject) {
  return {
    components: { securitySchemes: { busterAuth: scheme } },
  } as unknown as OASDocument;
}

describe('configure-security', function () {
  it('should return an empty object if there is no security keys', function () {
    expect(configureSecurity({} as OASDocument, {}, '')).toBeUndefined();
  });

  it('should return undefined if no values', function () {
    const spec = createSecurityOAS({ type: 'apiKey', in: 'header', name: 'key' });

    expect(configureSecurity(spec, {}, 'busterAuth')).toBeUndefined();
  });

  it('should not return non-existent values', function () {
    const spec = createSecurityOAS({ type: 'apiKey', in: 'header', name: 'key' });

    expect(configureSecurity(spec, {}, 'busterAuth')).toBeUndefined();
  });

  describe('http auth support', function () {
    describe('type=basic', function () {
      it.each([
        ['basic auth', { user: 'user', pass: 'pass' }, 'user:pass'],
        ['if a password is present but the username is undefined', { user: undefined, pass: 'pass' }, ':pass'],
        ['if a password is present but the username is null', { user: null, pass: 'pass' }, ':pass'],
        ['if a password is present but the username is an empty string', { user: '', pass: 'pass' }, ':pass'],
        ['if a username is present but the pass is undefined', { user: 'user', pass: undefined }, 'user:'],
        ['if a username is present but the pass is null', { user: 'user', pass: null }, 'user:'],
        ['if a username is present but the pass is an empty string', { user: 'user', pass: '' }, 'user:'],
      ])('should handle %s', (_, auth, expected) => {
        const user = auth.user;
        const pass = auth.pass;
        const spec = createSecurityOAS({ type: 'http', scheme: 'basic' });

        expect(configureSecurity(spec, { busterAuth: { user, pass } }, 'busterAuth')).toStrictEqual({
          type: 'headers',
          value: {
            name: 'authorization',
            value: `Basic ${Buffer.from(expected).toString('base64')}`,
          },
        });
      });

      it('should return with no header if wanted scheme is missing', function () {
        const spec = createSecurityOAS({ type: 'http', scheme: 'basic' });

        expect(configureSecurity(spec, { anotherSchemeName: { user: '', pass: '' } }, 'busterAuth')).toBe(false);
      });

      it('should return with no header if user and password are blank', function () {
        const spec = createSecurityOAS({ type: 'http', scheme: 'basic' });

        expect(configureSecurity(spec, { busterAuth: { user: '', pass: '' } }, 'busterAuth')).toBe(false);
      });

      it('should return with a header if user or password are not blank', function () {
        const user = 'user';
        const spec = createSecurityOAS({ type: 'http', scheme: 'basic' });

        expect(configureSecurity(spec, { busterAuth: { user, pass: '' } }, 'busterAuth')).toStrictEqual({
          type: 'headers',
          value: {
            name: 'authorization',
            value: `Basic ${Buffer.from(`${user}:`).toString('base64')}`,
          },
        });
      });
    });

    describe('scheme `bearer`', function () {
      it('should work for bearer', function () {
        const apiKey = '123456';
        const spec = createSecurityOAS({ type: 'http', scheme: 'bearer' });

        expect(configureSecurity(spec, { busterAuth: apiKey }, 'busterAuth')).toStrictEqual({
          type: 'headers',
          value: {
            name: 'authorization',
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
        ).toBe(false);
      });
    });
  });

  describe('oauth2 support', function () {
    it('should work for oauth2', function () {
      const apiKey = '123456';
      const spec = createSecurityOAS({ type: 'oauth2', flows: {} });

      expect(configureSecurity(spec, { busterAuth: apiKey }, 'busterAuth')).toStrictEqual({
        type: 'headers',
        value: {
          name: 'authorization',
          value: `Bearer ${apiKey}`,
        },
      });
    });

    it('should return with no header if apiKey is blank', function () {
      const spec = createSecurityOAS({ type: 'oauth2', flows: {} });

      expect(configureSecurity(spec, { busterAuth: '' }, 'busterAuth')).toBe(false);
    });
  });

  describe('apiKey auth support', function () {
    describe('in `query`', function () {
      it('should work for query', function () {
        const values = { busterAuth: 'value' };
        const security: SecuritySchemeObject = { type: 'apiKey', in: 'query', name: 'key' };
        const spec = createSecurityOAS(security);

        expect(configureSecurity(spec, values, 'busterAuth')).toStrictEqual({
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

        expect(configureSecurity(spec, values, 'busterAuth')).toStrictEqual({
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

          expect(configureSecurity(spec, values, 'busterAuth')).toStrictEqual({
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

          expect(configureSecurity(spec, values, 'busterAuth')).toStrictEqual({
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

          expect(configureSecurity(spec, values, 'busterAuth')).toStrictEqual({
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
