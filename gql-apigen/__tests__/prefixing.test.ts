import { groupPrefixer } from '../prefixing';

const source = `
type User {
  name: String!
  createdAt: String
  age: Int
  friends: [User]
}

type Query {
  hello: String
  person: User
}

type Mutation {
  createUser(name: String!): User
}
`;

describe(groupPrefixer.name, () => {
  it('prefixes', () => {
    const prefixedSource = groupPrefixer([{ source, name: 'test' }]);
    expect(prefixedSource).toMatchSnapshot();
  });
});
