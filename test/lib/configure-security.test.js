const { expect } = require('chai');
const configureSecurity = require('../../src/lib/configure-security');

describe('configure-security', function () {
  it('should return an empty object if there is no security keys', function () {
    expect(configureSecurity({}, {}, '')).to.deep.equal({});
  });

  it('should return undefined if no values', function () {
    const security = { type: 'apiKey', in: 'header', name: 'key' };

    expect(
      configureSecurity(
        {
          components: { securitySchemes: { schemeName: security } },
        },
        {},
        'schemeName'
      )
    ).to.be.undefined;
  });

  it('should not return non-existent values', function () {
    const security = { type: 'apiKey', in: 'header', name: 'key' };

    expect(
      configureSecurity(
        {
          components: { securitySchemes: { schemeName: security } },
        },
        {},
        'schemeName'
      )
    ).to.be.undefined;
  });

  describe('http auth support', function () {
    describe('type=basic', function () {
      it('should work for basic type', function () {
        const user = 'user';
        const pass = 'pass';

        expect(
          configureSecurity(
            {
              components: { securitySchemes: { schemeName: { type: 'http', scheme: 'basic' } } },
            },
            { schemeName: { user, pass } },
            'schemeName'
          )
        ).to.deep.equal({
          type: 'headers',
          value: {
            name: 'Authorization',
            value: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
          },
        });
      });

      it('should work if the password is empty or null', function () {
        const user = 'user';
        const pass = null;

        expect(
          configureSecurity(
            {
              components: { securitySchemes: { schemeName: { type: 'http', scheme: 'basic' } } },
            },
            { schemeName: { user, pass } },
            'schemeName'
          )
        ).to.deep.equal({
          type: 'headers',
          value: {
            name: 'Authorization',
            value: `Basic ${Buffer.from(`${user}:`).toString('base64')}`,
          },
        });
      });

      it('should return with no header if wanted scheme is missing', function () {
        expect(
          configureSecurity(
            {
              components: { securitySchemes: { schemeName: { type: 'http', scheme: 'basic' } } },
            },
            { anotherSchemeName: { user: '', pass: '' } },
            'schemeName'
          )
        ).to.be.false;
      });

      it('should return with no header if user and password are blank', function () {
        expect(
          configureSecurity(
            {
              components: { securitySchemes: { schemeName: { type: 'http', scheme: 'basic' } } },
            },
            { schemeName: { user: '', pass: '' } },
            'schemeName'
          )
        ).to.be.false;
      });

      it('should return with a header if user or password are not blank', function () {
        const user = 'user';

        expect(
          configureSecurity(
            {
              components: { securitySchemes: { schemeName: { type: 'http', scheme: 'basic' } } },
            },
            { schemeName: { user, pass: '' } },
            'schemeName'
          )
        ).to.deep.equal({
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

        expect(
          configureSecurity(
            {
              components: { securitySchemes: { schemeName: { type: 'http', scheme: 'bearer' } } },
            },
            { schemeName: apiKey },
            'schemeName'
          )
        ).to.deep.equal({
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

        expect(
          configureSecurity(
            {
              components: { securitySchemes: { schemeName: { type: 'http', scheme: 'bearer' } } },
            },
            values,
            'schemeName'
          )
        ).to.be.false;
      });
    });
  });

  describe('oauth2 support', function () {
    it('should work for oauth2', function () {
      const apiKey = '123456';

      expect(
        configureSecurity(
          {
            components: { securitySchemes: { schemeName: { type: 'oauth2' } } },
          },
          { schemeName: apiKey },
          'schemeName'
        )
      ).to.deep.equal({
        type: 'headers',
        value: {
          name: 'Authorization',
          value: `Bearer ${apiKey}`,
        },
      });
    });

    it('should return with no header if apiKey is blank', function () {
      expect(
        configureSecurity(
          {
            components: { securitySchemes: { schemeName: { type: 'oauth2' } } },
          },
          { schemeName: '' },
          'schemeName'
        )
      ).to.be.false;
    });
  });

  describe('apiKey auth support', function () {
    describe('in `query`', function () {
      it('should work for query', function () {
        const values = { schemeName: 'value' };
        const security = { type: 'apiKey', in: 'query', name: 'key' };

        expect(
          configureSecurity(
            {
              components: { securitySchemes: { schemeName: security } },
            },
            values,
            'schemeName'
          )
        ).to.deep.equal({
          type: 'queryString',
          value: {
            name: security.name,
            value: values.schemeName,
          },
        });
      });
    });

    describe('in `header`', function () {
      it('should work for header', function () {
        const values = { schemeName: 'value' };
        const security = { type: 'apiKey', in: 'header', name: 'key' };

        expect(
          configureSecurity(
            {
              components: { securitySchemes: { schemeName: security } },
            },
            values,
            'schemeName'
          )
        ).to.deep.equal({
          type: 'headers',
          value: {
            name: security.name,
            value: values.schemeName,
          },
        });
      });

      describe('x-bearer-format', function () {
        it('should work for bearer', function () {
          const values = { schemeName: 'value' };
          const security = {
            type: 'apiKey',
            in: 'header',
            name: 'key',
            'x-bearer-format': 'bearer',
          };

          expect(
            configureSecurity(
              {
                components: { securitySchemes: { schemeName: security } },
              },
              values,
              'schemeName'
            )
          ).to.deep.equal({
            type: 'headers',
            value: {
              name: security.name,
              value: `Bearer ${values.schemeName}`,
            },
          });
        });

        it('should work for basic', function () {
          const values = { schemeName: 'value' };
          const security = {
            type: 'apiKey',
            in: 'header',
            name: 'key',
            'x-bearer-format': 'basic',
          };

          expect(
            configureSecurity(
              {
                components: { securitySchemes: { schemeName: security } },
              },
              values,
              'schemeName'
            )
          ).to.deep.equal({
            type: 'headers',
            value: {
              name: security.name,
              value: `Basic ${values.schemeName}`,
            },
          });
        });

        it('should work for token', function () {
          const values = { schemeName: 'value' };
          const security = {
            type: 'apiKey',
            in: 'header',
            name: 'key',
            'x-bearer-format': 'token',
          };

          expect(
            configureSecurity(
              {
                components: { securitySchemes: { schemeName: security } },
              },
              values,
              'schemeName'
            )
          ).to.deep.equal({
            type: 'headers',
            value: {
              name: security.name,
              value: `Token ${values.schemeName}`,
            },
          });
        });
      });
    });
  });
});
