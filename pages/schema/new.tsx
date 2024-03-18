import { NextPage } from 'next';
import {
  FormControl, FormLabel, Input,
} from '@chakra-ui/react';
import { GraphqlEditor } from '../../components/graphql-editor';
import { useSession } from 'next-auth/react';


const NewSchemaPage: NextPage = () => {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user?.name) {
    return <div>loading...</div>;
  }

  return (
    <div>
      <h1>New Schema</h1>

      <form>
        <GraphqlEditor user={user} apiSchema={{ source: '', name: 'new schema' }} />
      </form>
    </div>
  );
};

export default NewSchemaPage;
