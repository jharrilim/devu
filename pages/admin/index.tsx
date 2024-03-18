import { prisma } from '../../db';
import type { GetServerSideProps, NextPage } from 'next';
import Header from '../../components/header';
import { useSession } from 'next-auth/react';
import styles from './index.module.css';
import { nextAuthOptions } from '../api/auth/[...nextauth]';
import { getServerSession } from 'next-auth';

interface ServerSideProps {
  errorCode?: number;
  users?: {
    id: number;
    name: string;
  }[];
}

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  ctx,
) => {
  const session = await getServerSession(
    ctx.req,
    ctx.res,
    nextAuthOptions,
  );
  if (!session || !session.user || !session.user.email) {
    return {
      props: {
        errorCode: 404,
      },
    };
  }

  const currentUser = await prisma.user.findFirst({
    where: {
      email: session.user.email,
      admin: true,
    },
  });

  if (!currentUser) {
    return {
      props: {
        errorCode: 401,
      },
    };
  }

  const users = await prisma.user.findMany({});
  return {
    props: {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
      })),
    },
  };
};

const Admin: NextPage<ServerSideProps> = ({ errorCode, users }) => {
  const { data: session } = useSession();
  return (
    <>
      <h1>Admin</h1>
      {session ? <a href={`/user/${session?.user?.name}`}>Your Page</a> : <></>}
      <h2>Users</h2>
      <ul>
        {users?.map((user) => (
          <li key={user.id}>
            <a href={`/user/${user.name}`}>{user.name}</a>
          </li>
        ))}
      </ul>
    </>
  );
};

export default Admin;
