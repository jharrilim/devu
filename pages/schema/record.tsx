import { NextPage } from 'next';
import { useState } from 'react';
import { Box, Button, Flex, FormLabel, Heading, IconButton, Input, Select, Textarea } from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';

const RecordSchemaPage: NextPage = () => {
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [headers, setHeaders] = useState<[string, string][]>([]);
  const record = () => {
    fetch('/api/schema/record', {
      body: JSON.stringify({ method, url, headers }),
      method: 'POST',
    });
  };

  return (
    <>

      <Heading>Record</Heading>

      <Flex>
        <Box flex="1">
          <FormLabel>Name</FormLabel>
          <Input type="text" placeholder="name" value={name} onChange={e => setName(e.target.value)} />
        </Box>        
        <Box>
          <FormLabel>Method</FormLabel>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </Select>
        </Box>
      </Flex>

      <FormLabel>URL</FormLabel>
      <Input
        type="text"
        placeholder="https://example.com/api/123"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <FormLabel>Body</FormLabel>
      <Textarea />
      <FormLabel>Headers</FormLabel>
      {headers.map(([key, value], i) => (
        <Flex key={i}>
          <Input type="text" placeholder="key" value={key}
            onChange={(e) => {
              const newHeaders = [...headers];
              newHeaders[i] = [e.target.value, newHeaders[i][1]];
              setHeaders(newHeaders);
            }}
          />
          <Input type="text" placeholder="value" value={value}
            onChange={(e) => {
              const newHeaders = [...headers];
              newHeaders[i] = [newHeaders[i][0], e.target.value];
              setHeaders(newHeaders);
            }}
          />
          <IconButton aria-label="delete header" color={'red'} icon={<CloseIcon />} variant="outline"
            onClick={() => {
              const newHeaders = [...headers];
              newHeaders.splice(i, 1);
              setHeaders(newHeaders);
            }}
          />
        </Flex>
      ))}
      <IconButton
        aria-label="add header"
        color={'green'}
        icon={<AddIcon />}
        isRound
        onClick={() => {
          setHeaders([...headers, ['', '']]);
        }}
      />
      <Button onClick={record}>Record</Button>
    </>
  );
};

export default RecordSchemaPage;
