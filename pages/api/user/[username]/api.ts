import { ApolloServer, gql } from 'apollo-server-micro';
import { NextApiHandler } from 'next';
import { prisma } from '../../../../db';
import { mockResolvers } from '../../../../gql-apigen';
import { prefixer } from '../../../../gql-apigen/prefixing';
import { corsMiddleware } from '../../../../middleware';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler: NextApiHandler = async (req, res) => {
  await corsMiddleware(req, res);

  if (!req.query.username) {
    return res.status(400).end('This is impossible');
  }

  const username = req.query.username;

  const user = await prisma.user.findFirst({
    where: {
      name: {
        equals: username.toString(),
        mode: 'insensitive',
      }
    },
    include: {
      apiSchema: true,
      following: {
        include: {
          following: {
            include: {
              apiSchema: true,
            }
          },
        }
      },
    }
  });

  const apiSchema = user?.apiSchema;

  if (!apiSchema || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const name = user.name;

  const prefixedSource = prefixer(apiSchema.source, name);

  const followerSources = user.following
    .map(following => {
      return {
        name: following.following.name,
        source: following.following.apiSchema?.source ?? '',
      };
    })
    .filter(following => following.source)
    .map(following => prefixer(following.source, following.name));

    const typeDefs = gql`${[prefixedSource, ...followerSources].join('\n')}`;
  const server = new ApolloServer({
    typeDefs,
    resolvers: mockResolvers(typeDefs),
  });

  await server.start();

  const handler = server.createHandler({
    path: `/api/user/${user.name}/api`,
  });
  try {
    return await handler(req, res);
  } catch (e) {
    console.log('wtf', e);
    return res.status(500).end('something treacherous happened');
  }
};

export default handler;
