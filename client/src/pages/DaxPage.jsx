import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DaxApp } from '../dax';
import { createDaxChatAdapter } from '../api/daxChatAdapter';
import { useAuth } from '../context/AuthContext';
import { DAX, DAX_WELCOME } from '../utils/dax';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function DaxPage() {
  useDocumentTitle(DAX);
  const { user } = useAuth();
  const adapter = useMemo(() => createDaxChatAdapter(), []);
  const [searchParams] = useSearchParams();
  const isHome = searchParams.has('home');

  return (
    <DaxApp
      adapter={adapter}
      config={{
        brandName: DAX,
        greeting: DAX_WELCOME.split('\n\n')[0],
        subtitle: DAX_WELCOME.split('\n\n')[1],
        userName: user?.name,
        userId: user?.id,
        exitHref: '/dashboard',
        defaultMode: isHome ? 'home' : 'workspace',
      }}
    />
  );
}
