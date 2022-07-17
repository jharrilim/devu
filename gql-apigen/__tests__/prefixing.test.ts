import { prefixer } from '../prefixing';

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

describe(prefixer.name, () => {
  it('prefixes', () => {
    const prefixedSource = prefixer(source, 'test', 1);
    expect(prefixedSource).toMatchSnapshot();
  });
});
