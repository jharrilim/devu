import { useState } from 'react';
import styles from './graphql-editor.module.css';
import { Link } from '@chakra-ui/next-js';

import Editor from '@monaco-editor/react';
import { Editable, EditableInput, EditablePreview, useColorMode } from '@chakra-ui/react';
import clsx from 'clsx';

interface GraphqlEditorProps {
  user: {
    name: string;
  };
  apiSchema: {
    id?: string | number;
    name: string;
    source: string;
  };
}

export const GraphqlEditor = ({ apiSchema, user }: GraphqlEditorProps) => {
  const { colorMode } = useColorMode();

  const [saveDisabled, setSaveDisabled] = useState(true);
  const [code, setCode] = useState(apiSchema?.source ?? '');
  const [name, setName] = useState(apiSchema?.name ?? 'default');
  const [savedText, setSavedText] = useState('');

  const save = () => {
    setSaveDisabled(true);
    const url = apiSchema.id !== undefined
      ? `/api/user/${user.name}/schema/${apiSchema.name}`
      : `/api/user/${user.name}/schema`;
    fetch(url, {
      method: apiSchema.id !== undefined ? 'PUT' : 'POST',
      body: JSON.stringify({ source: code, name }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((_) => {
        setSavedText('🟢 Saved');
      })
      .catch((_) => {
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
    <div className={styles.editor}>
      <div className={clsx(styles.editorHeader, colorMode === 'dark' && styles.dark)}>
        <div className={styles.editorHeaderLeft}>
          <button
            className={styles.saveButton}
            onClick={save}
            disabled={saveDisabled}
          >
            Save
          </button>
          <span className={styles.savedText}>{savedText}</span>
        </div>
        <Editable defaultValue="default" value={name} onChange={e => setName(e)} onBlur={e => setName(name || e)}>
          <EditablePreview />
          <EditableInput textAlign={'center'} letterSpacing={'0.05em'} />
        </Editable>
        <div className={styles.editorHeaderRight}>
          <Link
            className={styles.graphqlLink}
            href={`/user/${user.name}/graphql`}
          >
            GraphiQL
          </Link>
        </div>
      </div>
      <Editor
        height="500px"
        language="graphql"
        theme={colorMode === 'dark' ? 'vs-dark' : 'vs-light'}
        onChange={onEditorChange}
        options={
          {
            // meh, seems like a hindrance to add this
            // readOnly: !sameUser,
          }
        }
        value={code}
      />
      <blockquote>
        Note: Currently only supports queries, no mutations or subscriptions.
      </blockquote>
    </div>
  );
};
