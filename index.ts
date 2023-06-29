import { CollectionConfig, Field } from 'npm:payload/types';
import {
  components,
  Component,
  models,
  Model,
} from './models.ts';
import { camelCase } from 'npm:change-case';
// @deno-types="npm:@types/pluralize"
import pluralize from 'npm:pluralize';

function transform(name: string, input: Model | Component): CollectionConfig {
  return {
    slug: transformSlug(name),
    fields: transformFields(input),
  };
}

type Values<T> = T extends T ? T[keyof T] : never;

function transformFields(input: Model | Component): Field[] {
  const localized = 'pluginOptions' in input && 'i18n' in input.pluginOptions && input.pluginOptions.i18n ? true : undefined;

  return Object.entries<Values<typeof input.attributes>>(input.attributes).map(([name, opt]): Field => {
    const fieldBase: {
      name: string;
      localized?: true;
      required?: true;
    } = {
      name: camelCase(name),
      localized,
    };

    if ('pluginOptions' in opt) {
      fieldBase.localized = opt.pluginOptions.i18n.localized ? true : undefined;
    }
    if ('required' in opt) {
      fieldBase.required = opt.required ? true : undefined;
    }

    if ('type' in opt) {
      if (opt.type === 'string') return { ...fieldBase,type: 'text' };
      if (opt.type === 'datetime') return { ...fieldBase,type: 'date' };
      if (opt.type === 'richtext') return { ...fieldBase,type: 'richText' };
      if (opt.type === 'component') {
        if (opt.repeatable) return {
          ...fieldBase,
          type: 'array',
          fields: transformFields(components[opt.component]),
        };
        return {
          ...fieldBase,
          type: 'group',
          fields: transformFields(components[opt.component]),
        };
      }
      if (opt.type === 'enumeration') return {
        ...fieldBase,
        type: 'radio', // option: 'select'
        options: opt.enum.map(v => ({
          label: v,
          value: v,
        })),
      };
      if (opt.type === 'json') return {
        ...fieldBase,
        type: 'json',
      };
      if (opt.type === 'text') return {
        ...fieldBase,
        type: 'text',
      };
      if (opt.type === 'boolean') return {
        ...fieldBase,
        type: 'checkbox',
      };
      if (opt.type === 'integer') return {
        ...fieldBase,
        type: 'number',
        min: 'min' in opt ? opt.min : undefined,
        max: 'max' in opt ? opt.max as number : undefined,
      };
      if (opt.type === 'float') return {
        ...fieldBase,
        type: 'number',
      };
      if (opt.type === 'email') return {
        ...fieldBase,
        type: 'email',
      };
    } else if ('model' in opt) {
      if (opt.model === 'file') {
        return {
          ...fieldBase,
          type: 'upload',
          relationTo: 'media',
        };
      }

      return {
        ...fieldBase,
        type: 'relationship',
        relationTo: transformSlug(opt.model),
      };
    } else if ('collection' in opt) {
      if (opt.collection === 'file') {
        return {
          ...fieldBase,
          type: 'array',
          fields: [{
            name: 'file',
            type: 'upload',
            relationTo: 'media',
          }],
        };
      }
      // if (opt.collection === 'user') {
      //   return {
      //     ...fieldBase,//     type: 'relationship',
      //     relationTo: 'users',
      //     hasMany: true,
      //   }
      // }

      return {
        ...fieldBase,
        type: 'relationship',
        relationTo: transformSlug(opt.collection),
        hasMany: true,
      };
    }
    throw `Unimplemented schema translation: ${Deno.inspect(opt, { depth: 100 })}`;
  });
}

function transformSlug(slug: string) {
  return pluralize.plural(camelCase(slug));
}

console.log(JSON.stringify(Object.entries(models).map(([name, model]) => transform(name, model)), null, 2));
