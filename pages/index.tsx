import { prisma } from '../db';
import type { GetServerSideProps, NextPage } from 'next';
import Header from '../components/header';
import { useSession } from 'next-auth/react';
import styles from './index.module.css';

interface ServerSideProps {
}

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async () => {
  return {
    props: {

    }
  };
};

const Home: NextPage<ServerSideProps> = ({
}) => {
  const { data: session } = useSession();
  return (
    <div className={styles.root}>
      <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <h1>devu</h1>
        {session ? (
          <a href={`/user/${session?.user?.name}`}>Your Page</a>
        ) : (
          <></>
        )}
      </main>
      </div>
    </div>
  );
};

export default Home;
