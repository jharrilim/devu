import { ApolloServer, gql } from 'apollo-server-micro';
import { Kind } from 'graphql';
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

  if (!req.query.id) {
    return res.status(400);
  }

  const userId = +req.query.id;

  const apiSchema = await prisma.apiSchema.findFirst({
    where: {
      userId,
    },
    include: {
      user: true,
    }
  });

  if (!apiSchema) {
    return res.status(404);
  }

  const name = apiSchema.user.name;

  const prefixedSource = prefixer(apiSchema.source, name, userId);

  const typeDefs = gql`${prefixedSource}`;

  const server = new ApolloServer({
    typeDefs,
    resolvers: mockResolvers(typeDefs),
  });

  await server.start();

  const handler = server.createHandler({
    path: `/api/user/${userId}/api`,
  });

  return await handler(req, res);
};

export default handler;
