import { gql } from 'apollo-server-micro'; 
import { mockResolvers } from '..';

const mockSchema = gql`
  type Person {
    name: String
    friends: [Person]
  }
  type Droid {
    name: String
    built_at: String!
  }
  type Query {
    name(person: Person): String
    droid(id: ID!): Droid
    rando: Int
    started: String!
    person: Person
  }
`;

describe(mockResolvers.name, () => {
  it('handles a query without arguments', () => {
    const r = mockResolvers(mockSchema);

    expect(r.Query).toBeTruthy();
    expect(r.Query.rando).toBeInstanceOf(Function);
    expect(typeof r.Query.rando()).toBe('number');
  });

  it('handles a query with a complex argument', () => {
    const r = mockResolvers(mockSchema);

    expect(r.Query.name).toBeInstanceOf(Function);
    expect(typeof r.Query.name({})).toEqual('string');
  });

  it('handles a query with a complex return type', () => {
    const r = mockResolvers(mockSchema);

    expect(r.Query.droid).toBeInstanceOf(Function);
    const droid = r.Query.droid({ id: '1' });
    expect(typeof droid.built_at).toEqual('string');
  });

  it('handles a query with a non null return type', () => {
    const r = mockResolvers(mockSchema);

    expect(r.Query.started).toBeInstanceOf(Function);
    expect(typeof r.Query.started()).toEqual('string');
  });

  it('handles types with array fields', () => {
    const r = mockResolvers(mockSchema);
    const person = r.Query.person();

    expect(typeof person.friends[0]().name).toEqual('string');
  });
});
