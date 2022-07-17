/* eslint-disable react/display-name */

import { DocumentNode, FieldDefinitionNode, Kind, ListTypeNode, NamedTypeNode, NonNullTypeNode, ObjectTypeDefinitionNode, TypeNode } from 'graphql';
import type { IResolvers } from '@graphql-tools/utils/typings';

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
  switch (node.type.kind) {
    case Kind.NON_NULL_TYPE: {
      const t = node.type as NonNullTypeNode;
      if (t.type.kind === Kind.NAMED_TYPE) {
        const namedType = t.type as NamedTypeNode;
        return valueForType(userTypes)(namedType.name.value);
      } else {
        const listType = t.type as ListTypeNode;
        return listTypeGen(userTypes)(listType);
      }
    }
    case Kind.NAMED_TYPE: {
      return valueForType(userTypes)(node.type.name.value);
    }
    case Kind.LIST_TYPE: {
      return listTypeGen(userTypes)(node.type);
    }
    default: {
      return () => null;
    }
  }
};

// Don't produce values pass this for now, need to make graph lazy later to avoid this
// and only query nested fields when asked for
const maxDepth = 2;

const valueForType = (userTypes: Record<string, any>) => (typeVal: NamedTypeNode['name']['value']) => {
  switch (typeVal) {
    case 'String': {
      return () => 'Hello world!';
    }
    case 'Int': {
      return () => 1;
    }
    case 'Boolean': {
      return () => true;
    }
    case 'Float': {
      return () => 1.1;
    }
    case 'ID': {
      return () => '1';
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
            fields[fieldName] = [valueForType(userTypes)(fieldType[0])];
          } else if (userTypes[fieldType]) {
            fields[fieldName] = valueForType(userTypes)(fieldType);
          } else {
            fields[fieldName] = valueForType(userTypes)(fieldType)();
          }
          return fields;
        }, {});
    }
  }
};

const listTypeGen = (userTypes: Record<string, any>) => (node: ListTypeNode): any => {
  switch (node.type.kind) {
    case Kind.NAMED_TYPE: {
      const t = node.type as NamedTypeNode;
      return () => [valueForType(userTypes)(t.name.value)()];
    }
    case Kind.LIST_TYPE: {
      const t = node.type as ListTypeNode;
      return () => [listTypeGen(userTypes)(t)()];
    }
    default: {
      return () => null;
    }
  }
};
