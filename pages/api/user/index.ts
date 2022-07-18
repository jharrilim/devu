import { NextApiHandler } from 'next';
import { prisma } from '../../../db';


const handler: NextApiHandler = async (req, res) => {
  if (req.method === 'POST') {
    const { username, email } = req.body;
    if (username && email) {
      const user = await prisma.user.findFirst({
        where: {
          name: {
            equals: username,
            mode: 'insensitive',
          },
          email: {
            equals: email,
            mode: 'insensitive',
          },
        }
      });
      if (user) {
        return res.json(user);
      } else {
        return res.json(await prisma.user.create({
          data: {
            name: username,
            email,
          },
        }));
      }
    } else {
      return res.status(400).end('Missing username or email');
    }
  } else {
    return res.status(405).end('Method not allowed');
  }
};

export default handler;
