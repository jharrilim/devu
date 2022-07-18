import { prisma } from '../db';
import type { GetServerSideProps, NextPage } from 'next';
import Header from '../components/header';
import { useSession } from 'next-auth/react';

interface ServerSideProps {
  users: {
    id: number;
    name: string;
  }[];
}

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async () => {
  const users = await prisma.user.findMany({});
  return {
    props: {
      users: users.map(u => ({
        id: u.id,
        name: u.name,
      }))
    }
  };
};

const Home: NextPage<ServerSideProps> = ({
  users,
}) => {
  const { data: session } = useSession();
  return (
    <div>
      <Header />
      <main>
        <h1>Users</h1>

        {session ? (
          <a href={`/user/${session?.user?.name}`}>Your Page</a>
        ) : (
          <></>
        )}
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
    </div>
  );
};

export default Home;
