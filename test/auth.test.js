const Oas = require('oas').default;
const { expect } = require('chai');
const oasToHar = require('../src');

const security = require('./__datasets__/security.json');

const spec = new Oas(security);

describe('auth handling', function () {
  it('should work for header auth', function () {
    expect(
      oasToHar(spec, spec.operation('/header', 'post'), {}, { auth_header: 'value' }).log.entries[0].request.headers
    ).to.deep.equal([
      {
        name: 'x-auth-header',
        value: 'value',
      },
    ]);
  });

  it('should work for query auth', function () {
    expect(
      oasToHar(
        spec,
        spec.operation('/query', 'post'),
        {},
        {
          auth_query: 'value',
        }
      ).log.entries[0].request.queryString
    ).to.deep.equal([
      {
        name: 'authQuery',
        value: 'value',
      },
    ]);
  });

  it('should work for cookie auth', function () {
    expect(
      oasToHar(
        spec,
        spec.operation('/cookie', 'post'),
        {},
        {
          auth_cookie: 'value',
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
    expect(
      oasToHar(
        spec,
        spec.operation('/multiple-auth-or', 'post'),
        {},
        {
          auth_header: 'value',
          auth_headerAlt: 'value',
        }
      ).log.entries[0].request.headers
    ).to.deep.equal([
      {
        name: 'x-auth-header',
        value: 'value',
      },
      {
        name: 'x-auth-header-alt',
        value: 'value',
      },
    ]);
  });

  it('should work for multiple (&&)', function () {
    expect(
      oasToHar(
        spec,
        spec.operation('/multiple-auth-and', 'post'),
        {},
        {
          auth_header: 'value',
          auth_headerAlt: 'value',
        }
      ).log.entries[0].request.headers
    ).to.deep.equal([
      {
        name: 'x-auth-header',
        value: 'value',
      },
      {
        name: 'x-auth-header-alt',
        value: 'value',
      },
    ]);
  });

  it('should not set non-existent values', function () {
    const har = oasToHar(spec, spec.operation('/header', 'post'), {}, {});
    expect(har.log.entries[0].request.headers).to.be.empty;
  });
});
