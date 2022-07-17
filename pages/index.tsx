import { prisma } from '../db';
import type { GetServerSideProps, NextPage } from 'next';
import type { User } from '@prisma/client';

interface ServerSideProps {
  users: {
    id: number;
    name: string;
  }[];
}

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async () => {
  const users = await prisma.user.findMany({});
  return { props: { users: users.map(u => ({
    id: u.id,
    name: u.name,
  })) } };
};

const Home: NextPage<ServerSideProps> = ({
  users,
}) => {
  return (
    <main>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <a href={`/user/${user.id}`}>
              {user.name}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
};

export default Home;
