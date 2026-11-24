import { useCallback, useEffect, useState } from 'react';

export function useRequest<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({
    loading: true,
  });
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    void load().then(
      (data) => {
        if (active) setState({ data, loading: false });
      },
      (error: unknown) => {
        if (active)
          setState({
            loading: false,
            error: error instanceof Error ? error.message : 'Məlumat yüklənmədi.',
          });
      },
    );
    return () => {
      active = false;
    };
  }, [load, revision]);
  return { ...state, retry };
}
