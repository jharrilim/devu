import { GetServerSideProps, NextPage } from 'next';
import Editor from '@monaco-editor/react';
import { prisma } from '../../db';
import { useState } from 'react';
import Error from 'next/error';
import styles from './[username].module.css';
import Header from '../../components/header';
import Link from 'next/link';
import { unstable_getServerSession } from 'next-auth';
import { nextAuthOptions } from '../api/auth/[...nextauth]';
import { useSession } from 'next-auth/react';

interface ServerProps {
  errorCode?: number;
  following?: boolean;
  sameUser?: boolean;
  user?: {
    id: number;
    name: string;
  };
  apiSchema?: {
    id: number;
    source: string;
  };
}

export const getServerSideProps: GetServerSideProps<ServerProps> = async (ctx) => {
  const session = await unstable_getServerSession(
    ctx.req,
    ctx.res,
    nextAuthOptions
  );

  const username = ctx.params?.username;
  if (username === undefined) {
    // should be impossible
    return {
      props: {
        errorCode: 404,
      }
    };
  }

  const pageUser = await prisma.user.findFirst({
    where: {
      name: {
        equals: `${username}`,
        mode: 'insensitive',
      },
    },
    include: {
      apiSchema: true,
    }
  });

  if (!pageUser) {
    // user doesn't exist
    return {
      props: {
        errorCode: 404,
      }
    };
  }

  const sameUser = session?.user?.name === pageUser.name;

  let following = false;
  if (!sameUser && session?.user?.name) {
    const currentUser = await prisma.user.findFirst({
      where: {
        name: {
          equals: session.user.name,
          mode: 'insensitive',
        }
      },
      include: {
        following: {
          where: {
            followingId: pageUser.id,
          },
        },
      },
    });
    following = (currentUser?.following?.length || 0) > 0;
  }

  const apiSchema = pageUser.apiSchema
    ? pageUser.apiSchema
    : await prisma.apiSchema.create({
      data: { userId: pageUser.id, source: '' },
    });

  // A logged in user viewing a user's page
  return {
    props: {
      following,
      sameUser,
      user: {
        id: pageUser.id,
        name: pageUser.name,
      },
      apiSchema: {
        id: apiSchema.id,
        source: apiSchema.source,
      },
    },
  };
};


interface UserPageProps {
  apiSchema: NonNullable<ServerProps['apiSchema']>;
  following: ServerProps['following'];
  sameUser: ServerProps['sameUser'];
  user: NonNullable<ServerProps['user']>;
}

const UserPage: NextPage<UserPageProps> = ({
  apiSchema,
  following,
  sameUser,
  user,
}) => {
  const { data: session } = useSession();
  const [followingState, setFollowing] = useState(following ?? false);
  const [saveDisabled, setSaveDisabled] = useState(true);
  const [code, setCode] = useState(apiSchema?.source ?? '');
  const [savedText, setSavedText] = useState('');

  const save = () => {
    setSaveDisabled(true);
    fetch(`/api/user/${user.name}/schema`, {
      method: 'POST',
      body: JSON.stringify({ source: code }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(_ => {
        setSavedText('🟢 Saved');
      })
      .catch(_ => {
        setSavedText('🔴 Error');
        setSaveDisabled(false);
      });
  };

  const onEditorChange = (newValue?: string) => {
    if (!newValue) {
      return;
    }
    setCode(newValue);
    setSaveDisabled(false);
    setSavedText('');
  };

  const onFollowChange = () => {
    const action = followingState ? 'unfollow' : 'follow';
    fetch(`/api/user/${user.name}/${action}`).then(() => {
      console.log(`${session?.user?.name} ${action}ed ${user.name}`);
      setFollowing(followingState => !followingState);
    });
  };

  return (
    <div>
      <Header />
      <main className={styles.root}>
        <div className={styles.container}>
          <h2 className={styles.usernameHeader}>
            {user?.name}
            {sameUser ? (
              <span className={styles.sameUser}> (You)</span>
            ) : (
              <>
                {session && (
                  <button onClick={onFollowChange}>{followingState ? 'unfollow' : 'follow'}</button>
                )}
              </>
            )}
          </h2>
          <div className={styles.editorHeader}>
            <div className={styles.editorHeaderLeft}>
              <button className={styles.saveButton} onClick={save} disabled={saveDisabled}>Save</button>
              <span className={styles.savedText}>{savedText}</span>
            </div>
            <div className={styles.editorHeaderRight}>
              <Link className={styles.graphqlLink} href={`/user/${user.name}/graphql`}>GraphiQL</Link>
            </div>
          </div>
          <Editor
            height="500px"
            language="graphql"
            theme="vs-dark"
            onChange={onEditorChange}
            options={{
              // meh, seems like a hindrance to add this
              // readOnly: !sameUser,
            }}
            value={code}
          />
          <blockquote>
            Note: Currently only supports queries, no mutations or subscriptions.
          </blockquote>
        </div>
      </main>
    </div>
  );
};

export default function Page({
  apiSchema,
  following,
  errorCode,
  sameUser,
  user,
}: ServerProps) {
  if (errorCode) {
    return <Error statusCode={errorCode} title="User does not exist" />;
  }
  return <UserPage following={following} user={user!} apiSchema={apiSchema!} sameUser={sameUser} />;
};
