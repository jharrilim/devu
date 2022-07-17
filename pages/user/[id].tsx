import { GetServerSideProps, NextPage } from 'next';
import Editor from '@monaco-editor/react';
import { prisma } from '../../db';
import { useState } from 'react';
import useSWR from 'swr';
import Error from 'next/error';
import styles from './[id].module.css';

interface ServerProps {
  errorCode?: number;
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
  const id = ctx.params?.id;
  if (id === undefined) {
    return {
      props: {
        errorCode: 404,
      }
    };
  }

  const user = await prisma.user.findFirst({
    where: {
      id: +id,
    },
    include: {
      apiSchema: true,
    }
  });

  if (!user) {
    return {
      props: {
        errorCode: 404,
      }
    };
  }

  const apiSchema = user.apiSchema
    ? user.apiSchema
    : await prisma.apiSchema.create({
      data: { userId: user.id, source: '' },
    });

  return {
    props: {
      user: {
        id: user.id,
        name: user.name,
      },
      apiSchema: {
        id: apiSchema.id,
        source: apiSchema.source,
      },
    },
  };
};


interface UserPageProps {
  user: NonNullable<ServerProps['user']>;
  apiSchema: NonNullable<ServerProps['apiSchema']>;
}

const UserPage: NextPage<UserPageProps> = ({
  user,
  apiSchema,
}) => {
  const [saveDisabled, setSaveDisabled] = useState(true);
  const [code, setCode] = useState(apiSchema?.source ?? '');
  const [savedText, setSavedText] = useState('');

  const save = () => {
    setSaveDisabled(true);
    fetch(`/api/user/${user.id}/schema`, {
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

  return (
    <main className={styles.root}>
      <div className={styles.container}>
        <h2>{user?.name}</h2>
        <div className={styles.editorHeader}>
          <div className={styles.editorHeaderLeft}>
            <button onClick={save} disabled={saveDisabled}>Save</button>
            <span className={styles.savedText}>{savedText}</span>
          </div>
          <div className={styles.editorHeaderRight}>
            <a href={`http://localhost:3000/user/${user.id}/graphql`}>GraphiQL</a>
          </div>
        </div>
        <Editor
          height="500px"
          language="graphql"
          theme="vs-dark"
          onChange={onEditorChange}
          value={code}
        />
        <blockquote>
          Note: Currently only supports queries, no mutations or subscriptions.
        </blockquote>
      </div>
    </main>
  );
};

export default function Page({ apiSchema, user, errorCode }: ServerProps) {
  if (errorCode) {
    return <Error statusCode={errorCode} title="User does not exist" />;
  }
  return <UserPage user={user!} apiSchema={apiSchema!} />;
};
