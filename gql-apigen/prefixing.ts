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

  const rootPrefixes = {
    query: '',
    mutation: '',
  };

  if (prefixedSource.includes(`type ${name}_Query`)) {
    rootPrefixes.query = `
      """
      This is the root query for [${name}](http://localhost:3000/user/${name}).
      """
      ${name}_query: ${name}_Query
    `;
  }

  if (prefixedSource.includes(`type ${name}_Mutation`)) {
    rootPrefixes.mutation = `
      """
      This is the root mutation for [${name}](http://localhost:3000/user/${name}).
      """
      ${name}_mutation: ${name}_Mutation
    `;
  }
  return { prefixedSource, rootPrefixes };
};

export const groupPrefixer = (group: { source: string; name: string }[]) => {
  const prefixedSources = group.map(({ source, name }) => {
    return prefixer(source, name);
  });
  const rootPrefixes = prefixedSources.reduce(
    (acc, { rootPrefixes }) => {
      if (rootPrefixes.query) acc.query.push(rootPrefixes.query);
      if (rootPrefixes.mutation) acc.mutation.push(rootPrefixes.mutation);

      return acc;
    },
    { query: [] as string[], mutation: [] as string[] } as {
      query: string[];
      mutation: string[];
    },
  );

  let roots = '';

  if (rootPrefixes.query.length) {
    roots += `
      type Query {
        ${rootPrefixes.query.join('\n')}
      }
    `;
  }
  console.log('mutations: ', rootPrefixes.mutation);
  if (rootPrefixes.mutation.length) {
    roots += `
      type Mutation {
        ${rootPrefixes.mutation.join('\n')}
      }
    `;
  }
  const types = prefixedSources.map(({ prefixedSource }) => prefixedSource);

  return `${types.join('\n')}\n${roots}`;
};
