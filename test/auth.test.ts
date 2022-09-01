import { expect } from 'chai';
import Oas from 'oas';

import oasToHar from '../src';

import securityQuirks from './__datasets__/security-quirks.json';
import security from './__datasets__/security.json';

const spec = Oas.init(security);

describe('auth handling', function () {
  describe('headers', function () {
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

    it('should not send the same auth header twice', function () {
      const auth = {
        appId: '1234567890',
        accessToken: 'e229822e-f625-45eb-a963-4d197d29637b',
      };

      const oas = Oas.init(securityQuirks);
      const har = oasToHar(oas, oas.operation('/anything', 'post'), {}, auth);

      expect(har.log.entries[0].request.headers).to.deep.equal([
        {
          name: 'Access-Token',
          value: 'e229822e-f625-45eb-a963-4d197d29637b',
        },
      ]);
    });
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
