import { NextApiHandler } from 'next';
import { prisma } from '../../../../db';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '../../auth/[...nextauth]';

const handler: NextApiHandler = async (req, res) => {
  if (!req.query.username) {
    return res.status(400);
  }

  const session = await getServerSession(req, res, nextAuthOptions);

  if (!session || !session.user) {
    return res.status(401).end('Unauthorized');
  }

  const source = req.body.source;
  const name = req.body.name;
  const username = req.query.username;

  try {
    const user = await prisma.user.findFirst({
      where: {
        name: username.toString(),
      },
    });

    if (!user || user.name !== session.user.name) {
      return res.status(404).end('User not found');
    }

    const schema = await prisma.apiSchema.create({
      data: {
        source,
        name,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });
    return res.json(schema);
  } catch (e) {
    return res.status(400).end(e.message);
  }
};

export default handler;
