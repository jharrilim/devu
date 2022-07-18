export const prefixer = (source: string, name: string) => {
  const prefixedSource = source
    .replace(/:\s*(\[*)(\w+)/gm, (m, p1, p2) => {
      if (['Int', 'Float', 'String', 'Boolean', 'ID'].includes(p2)) {
        return m;
      }
      return `: ${p1}${name}_${p2}`;
    })
    .replace(/type\s+(\w+)/gm, (m, p1) => {
      return `type ${name}_${p1}`;
    });

  let userRoot = '';

  if (prefixedSource.includes(`type ${name}_Query`)) {
    userRoot += `
type Query {
  """
  This is the root query for [${name}](http://localhost:3000/user/${name}).
  """
  ${name}_query: ${name}_Query
}
`;
  }

  if (prefixedSource.includes(`type ${name}_Mutation`)) {
    userRoot += `
type Mutation {
  """
  This is the root mutation for [${name}](http://localhost:3000/user/${name}).
  """
  ${name}_mutation: ${name}_Mutation
}`;
  }
  const combined = `${prefixedSource}\n${userRoot}`;
  return combined;
};
