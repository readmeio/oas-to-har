const Oas = require('oas').default;
const oasToHar = require('../src');
const toBeAValidHAR = require('jest-expect-har').default;

const security = require('./__fixtures__/security.json');

expect.extend({ toBeAValidHAR });

const spec = new Oas(security);

test('should work for header auth', () => {
  expect(
    oasToHar(spec, spec.operation('/header', 'post'), {}, { auth_header: 'value' }).log.entries[0].request.headers
  ).toStrictEqual([
    {
      name: 'x-auth-header',
      value: 'value',
    },
  ]);
});

test('should work for query auth', () => {
  expect(
    oasToHar(
      spec,
      spec.operation('/query', 'post'),
      {},
      {
        auth_query: 'value',
      }
    ).log.entries[0].request.queryString
  ).toStrictEqual([
    {
      name: 'authQuery',
      value: 'value',
    },
  ]);
});

test('should work for cookie auth', () => {
  expect(
    oasToHar(
      spec,
      spec.operation('/cookie', 'post'),
      {},
      {
        auth_cookie: 'value',
      }
    ).log.entries[0].request.cookies
  ).toStrictEqual([
    {
      name: 'authCookie',
      value: 'value',
    },
  ]);
});

test('should work for multiple (||)', () => {
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
  ).toStrictEqual([
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

test('should work for multiple (&&)', () => {
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
  ).toStrictEqual([
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

test('should not set non-existent values', () => {
  const har = oasToHar(spec, spec.operation('/header', 'post'), {}, {});
  expect(har.log.entries[0].request.headers).toStrictEqual([]);
});
