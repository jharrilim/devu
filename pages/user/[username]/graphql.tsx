import { createGraphiQLFetcher, Fetcher } from '@graphiql/toolkit';
import { GetServerSideProps, NextPage } from 'next';
import { useEffect, useState } from 'react';
import GraphiQL from 'graphiql';
import 'graphiql/graphiql.css';

interface ServerProps {
  apiUrl: string;
  backUrl: string;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return {
    props: {
      apiUrl: `/api/user/${ctx.params!.username}/api`,
      backUrl: `/user/${ctx.params!.username}`,
    },
  };
};

type GraphQlPageProps = ServerProps;

const GraphQLPage: NextPage<GraphQlPageProps> = ({ apiUrl, backUrl }) => {
  const [fetcher, setFetcher] = useState<null | Fetcher>(null);
  useEffect(() => {
    const fetcher = createGraphiQLFetcher({ url: apiUrl });
    setFetcher(() => fetcher);
  }, [apiUrl, setFetcher]);

  if (!fetcher) {
    return <span>Loading...</span>;
  }

  return (
    <div style={{ height: '100vh' }}>
      <GraphiQL
        fetcher={fetcher}
        toolbar={{
          additionalContent: (
            <a className="toolbar-button" href={backUrl}>
              Back
            </a>
          ),
        }}
      />
    </div>
  );
};

export default GraphQLPage;
