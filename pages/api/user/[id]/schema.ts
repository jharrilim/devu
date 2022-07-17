import { NextApiHandler } from 'next';
import { prisma } from '../../../../db';

const handler: NextApiHandler = async (req, res) => {
  if (!req.query.id) {
    return res.status(400);
  }
  const source = req.body.source;
  const userId = +req.query.id;

  try {
    const schema = await prisma.apiSchema.update({
      data: {
        source,
      },
      where: {
        userId,
      },
    });
    return res.json(schema);
  } catch (e) {
    return res.status(400);
  }
};

export default handler;
