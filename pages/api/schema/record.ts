import { NextApiHandler } from 'next';

const recordHandler: NextApiHandler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).end('Method not allowed');
    }

    const { url, method, headers, body } = JSON.parse(req.body);

    const recordRes = await fetch(url, {
        method,
        headers,
        body,
    });
    res.status(recordRes.status).json({ r: await recordRes.text() });
};

export default recordHandler;