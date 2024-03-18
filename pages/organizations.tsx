import { GetServerSideProps, NextPage } from 'next';
import { prisma } from '../db';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from './api/auth/[...nextauth]';

interface Props {
  organizations: {
    id: number;
    name: string;
    description: string;
  }[];
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(
    ctx.req,
    ctx.res,
    nextAuthOptions
  );

  if (!session?.user?.name) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    };
  }

  const organizations = await prisma.organization.findMany({
    where: {
      OrganizationUser: {
        some: {
          user: {
            name: session?.user?.name,
          },
        },
      },
    },
  });

  return {
    props: {
      organizations,
    },
  };
};

const OrganizationsPage: NextPage<Props> = (props) => {
  return (
    <div>
      <h1>List of Organizations</h1>
      <ul>
        {props.organizations.map((org) => (
          <li key={org.id}>
            <h2>{org.name}</h2>
            <p>{org.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrganizationsPage;
