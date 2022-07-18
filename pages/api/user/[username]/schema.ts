import { NextApiHandler } from 'next';
import { prisma } from '../../../../db';
import { unstable_getServerSession } from 'next-auth/next';
import authOptions from '../../auth/[...nextauth]';

const handler: NextApiHandler = async (req, res) => {
  if (!req.query.username) {
    return res.status(400);
  }

  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401);
  }

  const source = req.body.source;
  const name = req.query.username;

  try {
    const user = await prisma.user.findFirst({
      where: {
        name: name.toString(),
      },
    });

    if (!user) {
      return res.status(404);
    }

    const schema = await prisma.apiSchema.update({
      data: {
        source,
      },
      where: {
        userId: user.id,
      },
    });
    return res.json(schema);
  } catch (e) {
    return res.status(400);
  }
};

export default handler;
