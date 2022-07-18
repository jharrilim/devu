import { NextApiHandler } from 'next';
import { prisma } from '../../../db';


const handler: NextApiHandler = async (req, res) => {
  if (req.method === 'POST') {
    const { username, email, password } = req.body;
    if (username && email && password) {
      const user = await prisma.user.findFirst({
        where: {
          name: username,
          email,
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
    }
  } else {
    return res.status(405).end('Method not allowed');
  }
};

export default handler;
