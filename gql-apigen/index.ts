/* eslint-disable react/display-name */

import { DocumentNode, FieldDefinitionNode, Kind, ListTypeNode, NamedTypeNode, NonNullTypeNode, ObjectTypeDefinitionNode, TypeNode } from 'graphql';
import type { IResolvers } from '@graphql-tools/utils/typings';
import { faker } from '@faker-js/faker';

export const mockResolvers = (typeDefs: DocumentNode): Record<string, any> => {
  const userDefinedTypes = typeDefs.definitions.filter(node =>
    node.kind === Kind.OBJECT_TYPE_DEFINITION
    && node.name.value !== 'Query'
    && node.name.value !== 'Mutation'
    && node.name.value !== 'Subscription'
  ).reduce<Record<string, any>>((types, n) => {
    const node = n as ObjectTypeDefinitionNode;
    types[node.name.value] = node.fields?.reduce<Record<string, string | [string]>>((fields, field) => {
      switch (field.type.kind) {
        case Kind.NAMED_TYPE: {
          fields[field.name.value] = field.type.name.value;
          return fields;
        }
        case Kind.LIST_TYPE: {
          const innerListType = (type: TypeNode): string => {
            switch (type.kind) {
              case Kind.NAMED_TYPE: {
                return type.name.value;
              }
              case Kind.LIST_TYPE: {
                // throw new Error('Nested lists are not supported');
                return innerListType(type.type);
              }
              case Kind.NON_NULL_TYPE: {
                // throw new Error('Nested nulls are not supported');
                return type.type.kind === Kind.NAMED_TYPE ? type.type.name.value : innerListType(type.type.type);
              }
              default: {
                return '';
              }
            }
          };

          fields[field.name.value] = [innerListType(field.type.type)];
          return fields;
        }
        case Kind.NON_NULL_TYPE: {
          const innerType = field.type.type;
          if (innerType.kind === Kind.NAMED_TYPE) {
            fields[field.name.value] = innerType.name.value;
          }
          return fields;
        }
        default: return fields;
      }
    }, {}) ?? {};
    return types;
  }, {});

  const resolvers = typeDefs.definitions.reduce<IResolvers>((resolvers, node) => {
    switch (node.kind) {
      case Kind.OBJECT_TYPE_DEFINITION: {
        resolvers[node.name.value] = objectTypeGen(userDefinedTypes)(node);
        return resolvers;
      }
      default: {
        return resolvers;
      }
    }
  }, {});
  return resolvers;
};

/**
 * Handle 'type' declarations in graphql, ie.
 * ```graphql
 *  type Query {
 *   ...
 *  }
 * ```
 * A node looks like:
 * ```
 * {
 *    kind: 'ObjectTypeDefinition',
 *    description: undefined,
 *    name: [Object],
 *    interfaces: [],
 *    directives: [],
 *    fields: [Array]
 *  }
 * ```
 */
export const objectTypeGen = (userTypes: Record<string, any>) => (node: ObjectTypeDefinitionNode) => {
  switch (node.name.value) {
    case 'Mutation': {
      return {};
    }
    case 'Query':
    default: {
      const fields = node.fields?.reduce<Record<string, ReturnType<ReturnType<typeof fieldResolverGen>>>>((fields, field) => {
        const fieldName = field.name.value;
        fields[fieldName] = fieldResolverGen(userTypes)(field);
        return fields;
      }, {}) ?? {};

      return fields;
    };
  }
};

export const fieldResolverGen = (userTypes: Record<string, any>) => (node: FieldDefinitionNode) => {
  const fieldName = node.name.value;
  switch (node.type.kind) {
    case Kind.NON_NULL_TYPE: {
      const t = node.type as NonNullTypeNode;
      if (t.type.kind === Kind.NAMED_TYPE) {
        const namedType = t.type as NamedTypeNode;
        return valueForType(userTypes)(fieldName, namedType.name.value);
      } else {
        const listType = t.type as ListTypeNode;
        return listTypeGen(userTypes)(fieldName, listType);
      }
    }
    case Kind.NAMED_TYPE: {
      return valueForType(userTypes)(fieldName, node.type.name.value);
    }
    case Kind.LIST_TYPE: {
      return listTypeGen(userTypes)(fieldName, node.type);
    }
    default: {
      return () => null;
    }
  }
};

const valueForType = (userTypes: Record<string, any>) => (fieldName: string, typeVal: NamedTypeNode['name']['value']) => {
  switch (typeVal) {
    case 'String': {
      if (fieldName.endsWith('_at') || fieldName.endsWith('At') || fieldName.includes('date')) {
        return () => faker.date.past().toISOString();;
      }
      if (fieldName.endsWith('_url') || fieldName.endsWith('Url')) {
        return () => faker.internet.url();
      }
      if (fieldName.includes('email')) {
        return () => faker.internet.email();
      }
      if (fieldName.includes('password')) {
        return () => faker.internet.password();
      }
      if (/first_*name/i.test(fieldName)) {
        return () => faker.name.firstName();
      }
      if (/last_*name/i.test(fieldName)) {
        return () => faker.name.lastName();
      }
      if(/user|name/i.test(fieldName)) {
        return () => faker.internet.userName();
      }
      if(/price|cost/i.test(fieldName)) {
        return () => faker.commerce.price(1, 1000, 2, '$');
      }
      if (/phone/i.test(fieldName)) {
        return () => faker.phone.number();
      }
      return () => faker.random.word();
    }
    case 'Int': {
      if (fieldName.toLowerCase() === 'id') {
        return () => faker.datatype.number();
      }
      if (fieldName.includes('age')) {
        return () => faker.datatype.number({ min: 1, max: 110 });
      }
      return () => faker.datatype.number();
    }
    case 'Boolean': {
      return () => Math.random() > 0.5;
    }
    case 'Float': {
      return () => faker.datatype.float();
    }
    case 'ID': {
      return () => faker.database.mongodbObjectId();
    }
    default: {
      const flattenedTypeVal = Array.isArray(typeVal) ? typeVal[0] : typeVal;
      const type = userTypes[flattenedTypeVal];
      if (!type) {
        throw new Error(`Unknown type ${typeVal}`);
      }
      return () => Object.entries<any>(type)
        .reduce<Record<string, any>>((fields, [fieldName, fieldType]) => {
          if (Array.isArray(fieldType)) {
            fields[fieldName] = [valueForType(userTypes)(fieldName, fieldType[0])];
          } else if (userTypes[fieldType]) {
            fields[fieldName] = valueForType(userTypes)(fieldName, fieldType);
          } else {
            fields[fieldName] = valueForType(userTypes)(fieldName, fieldType)();
          }
          return fields;
        }, {});
    }
  }
};

const listTypeGen = (userTypes: Record<string, any>) => (fieldName: string, node: ListTypeNode): any => {
  switch (node.type.kind) {
    case Kind.NAMED_TYPE: {
      const t = node.type as NamedTypeNode;
      return () => [valueForType(userTypes)(fieldName, t.name.value)()];
    }
    case Kind.LIST_TYPE: {
      const t = node.type as ListTypeNode;
      return () => [listTypeGen(userTypes)(fieldName, t)()];
    }
    default: {
      return () => null;
    }
  }
};
