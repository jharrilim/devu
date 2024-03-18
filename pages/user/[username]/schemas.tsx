import { GetServerSideProps, NextPage } from 'next';

import { prisma } from '../../../db';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '../../api/auth/[...nextauth]';

interface ServerProps {
  schemas: {
    id: number;
    name: string;
    source: string;
  }[];
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(
    ctx.req,
    ctx.res,
    nextAuthOptions
  );

  const user = await prisma.user.findFirst({
    where: {
      name: session?.user?.name as string,
    },
  });

  const schemas = await prisma.apiSchema.findMany({
    where: {
      userId: user!.id,
    },
  });

  return {
    props: {
      schemas: schemas.map((s) => ({
        id: s.id,
        name: s.name,
        source: s.source,
      })),
    },
  };
};


const SchemasPage: NextPage<ServerProps> = ({ schemas }) => {
  return (
    <>
      <h1>Schemas</h1>
      <ul>
        {schemas.map((schema) => (
          <li key={schema.id}>
            <h2>{schema.name}</h2>
            <p>{schema.source}</p>
          </li>
        ))}
      </ul>
    </>
  );
};

export default SchemasPage;