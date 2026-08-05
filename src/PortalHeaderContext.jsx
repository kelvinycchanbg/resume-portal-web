import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const PortalHeaderContext = createContext({
  headerAction: null,
  setHeaderAction: () => {},
});

export function PortalHeaderProvider({ children }) {
  const [headerAction, setHeaderActionState] = useState(null);

  const setHeaderAction = useCallback((action) => {
    setHeaderActionState(action);
  }, []);

  const value = useMemo(
    () => ({
      headerAction,
      setHeaderAction,
    }),
    [headerAction, setHeaderAction],
  );

  return (
    <PortalHeaderContext.Provider value={value}>
      {children}
    </PortalHeaderContext.Provider>
  );
}

export function usePortalHeader() {
  return useContext(PortalHeaderContext);
}
