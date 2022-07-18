import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './header.module.css';

const Header = () => {
  const { data: session } = useSession();
  return (
    <header className={styles.header}>
      <Link href="/">Home</Link>
      {session ? (
        <button onClick={() => signOut()}>Sign out</button>
      ) : (
        <button onClick={() => signIn()}>Sign in</button>
      )}
    </header>
  );
};

export default Header;
