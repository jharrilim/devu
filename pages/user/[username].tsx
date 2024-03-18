import { GetServerSideProps, NextPage } from 'next';
import { prisma } from '../../db';
import { useState } from 'react';
import Error from 'next/error';
import styles from './[username].module.css';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '../api/auth/[...nextauth]';
import { useSession } from 'next-auth/react';
import { GraphqlEditor } from '../../components/graphql-editor';
import { Flex, Heading } from '@chakra-ui/react';

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

export const getServerSideProps: GetServerSideProps<ServerProps> = async (
  ctx,
) => {
  const session = await getServerSession(
    ctx.req,
    ctx.res,
    nextAuthOptions,
  );

  const username = ctx.params?.username;
  if (username === undefined) {
    // should be impossible
    return {
      props: {
        errorCode: 404,
      },
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
      apiSchemas: {
        where: {
          name: 'default',
        },
      },
    },
  });

  if (!pageUser) {
    // user doesn't exist
    return {
      props: {
        errorCode: 404,
      },
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
        },
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

  const apiSchema = pageUser.apiSchemas.length > 0
    ? pageUser.apiSchemas[0]
    : await prisma.apiSchema.create({
        data: { userId: pageUser.id, source: '', name: 'default' },
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

  const onFollowChange = () => {
    const action = followingState ? 'unfollow' : 'follow';
    fetch(`/api/user/${user.name}/${action}`).then(() => {
      console.log(`${session?.user?.name} ${action}ed ${user.name}`);
      setFollowing((followingState) => !followingState);
    });
  };

  return (
    <Flex flexDirection={'column'} gap="4">
      <Heading as="h2" size="lg" className={styles.usernameHeader}>
        {user?.name}
        {sameUser ? (
          <span className={styles.sameUser}> (You)</span>
        ) : (
          <>
            {session && (
              <button onClick={onFollowChange}>
                {followingState ? 'unfollow' : 'follow'}
              </button>
            )}
          </>
        )}
      </Heading>
      <GraphqlEditor apiSchema={apiSchema} user={user} />
    </Flex>
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
  return (
    <UserPage
      following={following}
      user={user!}
      apiSchema={apiSchema!}
      sameUser={sameUser}
    />
  );
}
