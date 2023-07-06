import type { JSONSchema, SchemaObject } from 'oas/dist/rmoas.types';

import { get as lodashGet } from 'lodash'; // eslint-disable-line no-restricted-imports

/**
 * Determine if a schema `type` is, or contains, a specific discriminator.
 *
 */
export function hasSchemaType(
  schema: SchemaObject,
  discriminator: 'array' | 'object' | 'string' | 'number' | 'boolean' | 'integer' | 'null'
) {
  if (Array.isArray(schema.type)) {
    return schema.type.includes(discriminator);
  }

  return schema.type === discriminator;
}

/**
 * With a supplied JSON Schema object, spider through it for any schemas that may contain specific
 * kind of `format` that also happen to be within the current `requestBody` payload that we're
 * creating a HAR representation for.
 *
 */
export function getTypedFormatsInSchema(
  format: 'json' | 'binary',
  schema: any,
  opts: {
    parentIsArray?: boolean;
    parentKey?: string;
    payload: unknown;
  }
): boolean | string | (string | boolean)[] {
  try {
    if (schema?.format === format) {
      if (opts.parentIsArray) {
        const parentData = lodashGet(opts.payload, opts.parentKey);
        if (parentData !== undefined && Array.isArray(parentData)) {
          return Object.keys(parentData)
            .map(pdk => {
              const currentKey = [opts.parentKey, pdk].join('.');
              if (lodashGet(opts.payload, currentKey) !== undefined) {
                return currentKey;
              }

              return false;
            })
            .filter(Boolean);
        }
      } else if (opts.parentKey && lodashGet(opts.payload, opts.parentKey) !== undefined) {
        return opts.parentKey;
      } else if (opts.payload !== undefined) {
        // If this payload is present and we're looking for a specific format then we should assume
        // that the **root** schema of the request body is that format, and we aren't trafficking in
        // a nested object or array schema.
        return true;
      }

      return false;
    }

    let subSchemaDataSize = 0;
    if (opts.parentIsArray) {
      // If we don't have data for this parent schema in our body payload then we
      // shouldn't bother spidering further into the schema looking for more `format`s
      // for data that definitely doesn't exist.
      const parentData = lodashGet(opts.payload, opts.parentKey);
      if (parentData === undefined || !Array.isArray(parentData)) {
        return false;
      }

      subSchemaDataSize = parentData.length;
    }

    let subschemas: any[] = [];
    if (subSchemaDataSize > 0) {
      for (let idx = 0; idx < subSchemaDataSize; idx += 1) {
        subschemas = subschemas.concat(
          Object.entries(schema).map(([key, subschema]: [string, JSONSchema]) => ({
            key: opts.parentKey ? [opts.parentKey, idx, key].join('.') : key,
            schema: subschema,
          }))
        );
      }
    } else {
      subschemas = Object.entries(schema).map(([key, subschema]: [string, JSONSchema]) => ({
        key: opts.parentKey ? [opts.parentKey, key].join('.') : key,
        schema: subschema,
      }));
    }

    return subschemas
      .map(({ key, schema: subschema }) => {
        if ('properties' in subschema) {
          return getTypedFormatsInSchema(format, subschema.properties, { payload: opts.payload, parentKey: key });
        } else if ('items' in subschema) {
          if ((subschema.items as JSONSchema)?.properties) {
            return getTypedFormatsInSchema(format, (subschema.items as JSONSchema).properties, {
              payload: opts.payload,
              parentKey: key,
              parentIsArray: true,
            });
          }

          return getTypedFormatsInSchema(format, subschema.items, {
            payload: opts.payload,
            parentKey: key,
            parentIsArray: true,
          });
        }

        // If this schema has neither `properties` or `items` then it's a regular schema
        // we can re-run.
        return getTypedFormatsInSchema(format, subschema, { payload: opts.payload, parentKey: key });
      })
      .flat()
      .filter(Boolean);
  } catch (err) {
    // If this fails for whatever reason then we should act as if we didn't find any `format`'d
    // schemas.
    return [];
  }
}
