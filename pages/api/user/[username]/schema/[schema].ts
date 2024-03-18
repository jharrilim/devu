import { NextApiHandler } from 'next';
import { prisma } from '../../../../../db';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '../../../auth/[...nextauth]';

const handler: NextApiHandler = async (req, res) => {
    const schemaName = req.query.schema! as string;
    const username = req.query.username! as string;
    const session = await getServerSession(req, res, nextAuthOptions);
    if (!session || !session.user || !session.user.name || session.user.name !== username) {
        return res.status(401);
    }

    const user = await prisma.user.findFirst({
        where: {
            name: session.user.name.toString(),
        },
    });

    if (!user) {
        return res.status(404);
    }

    if (req.method === 'PUT') {
        const schema = await prisma.apiSchema.update({
            where: {
                id: undefined,
                name: schemaName,
                userId: user?.id,
            },
            include: {
                user: true,
            },
            data: {
                source: req.body.source,
                name: schemaName,
                updatedAt: new Date(),
            }
        });
        return res.json(schema);
    }
};

export default handler;