import { FC, PropsWithChildren } from 'react';
import Header from './header';
import styles from './layout.module.css';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div>
      <Header />
      <main className={styles.root}>
        <div className={styles.container}>{children}</div>
      </main>
    </div>
  );
};
