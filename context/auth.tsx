import {
  GoogleAuthProvider,
  User,
  browserSessionPersistence,
  getRedirectResult,
  setPersistence,
  signInWithRedirect,
} from "firebase/auth";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { useRouter } from "next/router";
import { Document } from "swr-firestore-v9";
import { auth } from "../shared/firebase";

export type UserMetadata = {
  studentId: number;
  studentNo: number;
  nameTitle: string;
  name: string;
  class: number;
  level: number;
  pendingEdit?: boolean;
  surveyAnswered?: boolean;
};

interface IAuthContext {
  ready: boolean;
  user: User | null;
  metadata: Document<UserMetadata> | null | undefined;
  signInWithGoogle: (teacher?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export const authContext = createContext<IAuthContext | undefined>(undefined);

export const useAuth = (): IAuthContext => {
  const ctx = useContext(authContext);
  if (!ctx) throw new Error("Outside context");
  return ctx;
};

// Provider hook that creates auth object and handles state
export function useProvideAuth(): IAuthContext {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const signInWithGoogle = async (teacher?: boolean): Promise<void> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: teacher ? "pnru.ac.th" : "wpm.pnru.ac.th",
    });
    await signInWithRedirect(auth, provider);
  };

  const signOut = async (): Promise<void> => {
    await auth.signOut();
    setUser(null);
    router.replace("/");
  };

  const [ready, setReady] = useState(false);
  const readyRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (!router.isReady) return;
    if (readyRef.current) clearTimeout(readyRef.current);
    readyRef.current = setTimeout(() => {
      if (user && !router.pathname.includes("/admin")) {
        if (!user && router.pathname !== "/") {
          router.replace("/");
        } else if (user && router.pathname == "/") {
          router.replace("/home");
        }
      }
      setReady(true);
    }, 2000);
  }, [router, user]);

  useEffect(() => {
    setPersistence(auth, browserSessionPersistence);
    return auth.onIdTokenChanged(async (curUser) => {
      if (curUser) {
        setUser(curUser);
      } else {
        setUser(null);
      }
    });
  }, [user, router]);

  useEffect(() => {
    getRedirectResult(auth);
  }, []);

  return {
    user,
    metadata: null,
    signInWithGoogle,
    signOut,
    ready,
  };
}
