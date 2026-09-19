'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { User } from '@supabase/supabase-js';
import type { Company } from '@/types';
import { authenticatedFetch, getBrowserClient } from '@/lib/supabase/browser';

export interface SavedList {
  id: number;
  name: string;
  companies: Company[];
  companyCount: number;
}
const AccountContext = createContext<{
  user: User | null;
  ready: boolean;
  configured: boolean;
  lists: SavedList[];
  error: string | null;
  refreshLists: () => Promise<void>;
}>({
  user: null,
  ready: false,
  configured: false,
  lists: [],
  error: null,
  refreshLists: async () => {},
});
export const useAccount = () => useContext(AccountContext);

export default function AccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [lists, setLists] = useState<SavedList[]>([]);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useRef<string | null>(null);
  const generation = useRef(0);
  const client = getBrowserClient();
  useEffect(() => {
    if (!client) return;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      if (currentUser.current !== (nextUser?.id ?? null)) {
        currentUser.current = nextUser?.id ?? null;
        generation.current++;
        setLists([]);
        setError(null);
      }
      setUser(nextUser);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [client]);
  const refreshLists = useCallback(async () => {
    if (!currentUser.current) return;
    const version = ++generation.current;
    try {
      const data: SavedList[] = await authenticatedFetch('/api/watchlists');
      if (version === generation.current) {
        setLists(data);
        setError(null);
      }
    } catch (err) {
      if (version === generation.current)
        setError(
          err instanceof Error ? err.message : 'Unable to load watchlists.',
        );
    }
  }, []);
  useEffect(() => {
    if (user?.id) {
      // Starts async I/O; updates below occur only after the request resolves.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refreshLists();
    }
  }, [user?.id, refreshLists]);
  return (
    <AccountContext.Provider
      value={{
        user,
        ready: !client || ready,
        configured: Boolean(client),
        lists,
        error,
        refreshLists,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}
