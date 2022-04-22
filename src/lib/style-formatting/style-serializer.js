/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */

/**
 * This file has been extracted and modified from `swagger-client`.
 *
 * @license Apache 2.0
 * @link https://npm.im/swagger-client
 * @link https://github.com/swagger-api/swagger-js/blob/master/src/execute/oas3/style-serializer.js
 */

const isRfc3986Reserved = char => ":/?#[]@!$&'()*+,;=".indexOf(char) > -1;
const isRfc3986Unreserved = char => /^[a-z0-9\-._~]+$/i.test(char);

function isURIEncoded(value) {
  try {
    return decodeURIComponent(value) !== value;
  } catch (err) {
    // `decodeURIComponent` will throw an exception if a string that has an un-encoded percent sign in it (like 20%),
    // so if it's throwing we can just assume that the value hasn't been encoded.
    return false;
  }
}

module.exports = function stylize(config) {
  const { value } = config;

  if (Array.isArray(value)) {
    return encodeArray(config);
  }
  if (typeof value === 'object' && value !== null) {
    return encodeObject(config);
  }
  return encodePrimitive(config);
};

module.exports.encodeDisallowedCharacters = function encodeDisallowedCharacters(
  str,
  { escape, returnIfEncoded = false, isAllowedReserved } = {}, // eslint-disable-line default-param-last
  parse
) {
  if (typeof str === 'number') {
    str = str.toString();
  }

  if (returnIfEncoded) {
    if (isURIEncoded(str)) {
      return str;
    }
  }

  if (typeof str !== 'string' || !str.length) {
    return str;
  }

  if (!escape) {
    return str;
  }

  if (parse) {
    return JSON.parse(str);
  }

  // In ES6 you can do this quite easily by using the new ... spread operator.
  // This causes the string iterator (another new ES6 feature) to be used internally,
  // and because that iterator is designed to deal with
  // code points rather than UCS-2/UTF-16 code units.
  return [...str]
    .map(char => {
      if (isRfc3986Unreserved(char)) {
        return char;
      }

      if (isRfc3986Reserved(char) && (escape === 'unsafe' || isAllowedReserved)) {
        return char;
      }

      const encoder = new TextEncoder();
      const encoded = Array.from(encoder.encode(char))
        .map(byte => `0${byte.toString(16).toUpperCase()}`.slice(-2))
        .map(encodedByte => `%${encodedByte}`)
        .join('');

      return encoded;
    })
    .join('');
};

function encodeArray({ location, key, value, style, explode, escape, isAllowedReserved = false }) {
  const valueEncoder = str =>
    module.exports.encodeDisallowedCharacters(str, {
      escape,
      returnIfEncoded: location === 'query',
      isAllowedReserved,
    });

  if (style === 'simple') {
    return value.map(val => valueEncoder(val)).join(',');
  }

  if (style === 'label') {
    return `.${value.map(val => valueEncoder(val)).join('.')}`;
  }

  if (style === 'matrix') {
    return value
      .map(val => valueEncoder(val))
      .reduce((prev, curr) => {
        if (!prev || explode) {
          return `${prev || ''};${key}=${curr}`;
        }
        return `${prev},${curr}`;
      }, '');
  }

  if (style === 'form') {
    const after = explode ? `&${key}=` : ',';
    return value.map(val => valueEncoder(val)).join(after);
  }

  if (style === 'spaceDelimited') {
    const after = explode ? `${key}=` : '';
    return value.map(val => valueEncoder(val)).join(` ${after}`);
  }

  if (style === 'pipeDelimited') {
    const after = explode ? `${key}=` : '';
    return value.map(val => valueEncoder(val)).join(`|${after}`);
  }

  return undefined;
}

function encodeObject({ location, key, value, style, explode, escape, isAllowedReserved = false }) {
  const valueEncoder = str =>
    module.exports.encodeDisallowedCharacters(str, {
      escape,
      returnIfEncoded: location === 'query',
      isAllowedReserved,
    });

  const valueKeys = Object.keys(value);

  if (style === 'simple') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const middleChar = explode ? '=' : ',';
      const prefix = prev ? `${prev},` : '';

      return `${prefix}${curr}${middleChar}${val}`;
    }, '');
  }

  if (style === 'label') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const middleChar = explode ? '=' : '.';
      const prefix = prev ? `${prev}.` : '.';

      return `${prefix}${curr}${middleChar}${val}`;
    }, '');
  }

  if (style === 'matrix' && explode) {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const prefix = prev ? `${prev};` : ';';

      return `${prefix}${curr}=${val}`;
    }, '');
  }

  if (style === 'matrix') {
    // no explode
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const prefix = prev ? `${prev},` : `;${key}=`;

      return `${prefix}${curr},${val}`;
    }, '');
  }

  if (style === 'form') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const prefix = prev ? `${prev}${explode ? '&' : ','}` : '';
      const separator = explode ? '=' : ',';

      return `${prefix}${curr}${separator}${val}`;
    }, '');
  }

  // Supported in 3.1, added by Readme
  if (style === 'spaceDelimited') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const prefix = prev ? `${prev} ` : '';

      return `${prefix}${curr} ${val}`;
    }, '');
  }

  // Supported in 3.1, added by Readme
  if (style === 'pipeDelimited') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const prefix = prev ? `${prev}|` : '';

      return `${prefix}${curr}|${val}`;
    }, '');
  }

  if (style === 'deepObject') {
    return valueKeys.reduce(curr => {
      const val = valueEncoder(value[curr], {}, true);
      return `${val}`;
    }, '');
  }

  return undefined;
}

function encodePrimitive({ location, key, value, style, escape, isAllowedReserved = false }) {
  const valueEncoder = str =>
    module.exports.encodeDisallowedCharacters(str, {
      escape,
      returnIfEncoded: location === 'query' || location === 'body',
      isAllowedReserved,
    });

  if (style === 'simple') {
    return valueEncoder(value);
  }

  if (style === 'label') {
    return `.${valueEncoder(value)}`;
  }

  if (style === 'matrix') {
    // This conditional added by Aaron to be more accurate to the spec
    if (value === '') {
      return `;${key}`;
    }

    return `;${key}=${valueEncoder(value)}`;
  }

  if (style === 'form') {
    return valueEncoder(value);
  }

  if (style === 'deepObject') {
    return valueEncoder(value, {}, true);
  }

  return undefined;
}
