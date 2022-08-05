import type { OASDocument, SecuritySchemeObject } from 'oas/dist/rmoas.types';

import { isRef } from 'oas/dist/rmoas.types';

export type AuthForHAR = Record<string, string | number | { user?: string; pass?: string }>;

function harValue(type: 'cookies' | 'headers' | 'queryString', value: { name: string; value: string }) {
  if (!value.value) return undefined;
  return { type, value };
}

export default function configureSecurity(apiDefinition: OASDocument, values: AuthForHAR, scheme: string) {
  if (!scheme) return undefined;

  if (Object.keys(values || {}).length === 0) return undefined;

  if (!apiDefinition.components.securitySchemes[scheme]) return undefined;
  const security = apiDefinition.components.securitySchemes[scheme] as SecuritySchemeObject & {
    'x-bearer-format'?: string;
  };

  if (isRef(security)) {
    return undefined;
  }

  if (security.type === 'http') {
    if (security.scheme === 'basic') {
      // Return with no header if user and password are blank
      if (!values[scheme]) return false;

      const auth = values[scheme];
      if (typeof auth !== 'object') return false;
      if (!auth.user && !auth.pass) return false;

      let user = auth.user;
      if (user === null || user.length === 0) {
        user = '';
      }

      let pass = auth.pass;
      if (pass === null || pass.length === 0) {
        pass = '';
      }

      return harValue('headers', {
        name: 'Authorization',
        value: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
      });
    } else if (security.scheme === 'bearer') {
      if (!values[scheme]) return false;

      return harValue('headers', {
        name: 'Authorization',
        value: `Bearer ${values[scheme]}`,
      });
    }
  }

  if (security.type === 'apiKey') {
    if (security.in === 'query') {
      return harValue('queryString', {
        name: security.name,
        value: String(values[scheme]),
      });
    } else if (security.in === 'header') {
      const header = {
        name: security.name,
        value: String(values[scheme]),
      };

      if (security['x-bearer-format']) {
        // Uppercase: token -> Token
        const bearerFormat = security['x-bearer-format'].charAt(0).toUpperCase() + security['x-bearer-format'].slice(1);
        header.name = security.name;
        header.value = `${bearerFormat} ${header.value}`;
      }

      return harValue('headers', header);
    } else if (security.in === 'cookie') {
      return harValue('cookies', {
        name: security.name,
        value: String(values[scheme]),
      });
    }
  }

  if (security.type === 'oauth2') {
    if (!values[scheme]) return false;

    return harValue('headers', {
      name: 'Authorization',
      value: `Bearer ${values[scheme]}`,
    });
  }

  return undefined;
}
