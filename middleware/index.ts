import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';

// Initializing the cors middleware
const cors = Cors({
  methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
  origin: '*',
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
const runMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  fn: (...args: any[]) => any,
) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
};

export const corsMiddleware = (req: NextApiRequest, res: NextApiResponse) => {
  return runMiddleware(req, res, cors);
};
