import { authContext, useProvideAuth } from "./auth";
import { fuego } from "@/shared/firebase";
import { FuegoProvider } from "swr-firestore-v9";
import { historyContext, useProvideHistory } from "./history";
import AuthSpinner from "@/components/AuthSpinner";
import { ReactNode } from "react";

type ProviderProps = {
  children: ReactNode | ReactNode[];
};

const AuthProvider = ({ children }: ProviderProps) => {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
};

const HistoryProvider = ({ children }: ProviderProps) => {
  const history = useProvideHistory();
  return (
    <historyContext.Provider value={history}>
      {children}
    </historyContext.Provider>
  );
};

export default function MainProvider({ children }: ProviderProps) {
  return (
    <FuegoProvider fuego={fuego}>
      <HistoryProvider>
        <AuthProvider>
          {children}
          <AuthSpinner />
        </AuthProvider>
      </HistoryProvider>
    </FuegoProvider>
  );
}
