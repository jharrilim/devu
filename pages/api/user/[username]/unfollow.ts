import { NextApiHandler } from 'next';
import { unstable_getServerSession } from 'next-auth';
import { prisma } from '../../../../db';
import { nextAuthOptions } from '../../auth/[...nextauth]';

const handler: NextApiHandler = async (req, res) => {
  const session = await unstable_getServerSession(req, res, nextAuthOptions);
  if (!session?.user?.name) {
    return res.status(401).end('Unauthorized');
  }
  if (!req.query?.username) {
    return res.status(400).end('Bad Request');
  }

  const currentUser = await prisma.user.findFirst({
    where: {
      name: {
        equals: session.user.name.toString(),
        mode: 'insensitive',
      },
    },
  });

  const user = await prisma.user.findFirst({
    where: {
      name: {
        equals: req.query.username.toString(),
        mode: 'insensitive',
      },
    },
  });

  if (!user || !currentUser) {
    return res.status(404).end('Not Found');
  }

  res.json(await prisma.follows.delete({
    where: {
      followerId_followingId: {
        followerId: currentUser.id,
        followingId: user.id,
      },
    },
  }));
};

export default handler;
