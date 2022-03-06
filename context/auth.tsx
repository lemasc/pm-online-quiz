import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
  useRef,
} from "react";
import { GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";

import { auth } from "../shared/firebase";
import { useRouter } from "next/router";
import { useDocument, Document } from "swr-firestore-v9";

type UserMetadata = {
  studentId: number;
  studentNo: number;
  nameTitle: string;
  name: string;
  class: number;
  level: number;
  pendingEdit?: boolean;
};

interface IAuthContext {
  ready: boolean;
  user: User | null;
  metadata: Document<UserMetadata> | null | undefined;
  signInWithGoogle: () => Promise<void>;
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
  const { data: metadata } = useDocument<UserMetadata>(
    user ? `/users/${user.uid}` : null,
    {
      listen: true,
    }
  );

  const signInWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: "wpm.pnru.ac.th",
    });
    await signInWithPopup(auth, provider);
  };

  const signOut = async (): Promise<void> => {
    await auth.signOut();
    setUser(null);
  };

  const [ready, setReady] = useState(false);
  const readyRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (!router.isReady) return;
    if (readyRef.current) clearTimeout(readyRef.current);
    readyRef.current = setTimeout(() => {
      const ready = !(
        (user && metadata && !metadata.exists) ||
        (user === undefined && metadata === undefined)
      );
      if (ready && !router.pathname.includes("/admin")) {
        if (!user && !metadata && router.pathname !== "/") {
          router.replace("/");
        } else if (user && metadata && router.pathname == "/") {
          router.replace("/home");
        }
      }
      setReady(ready);
    }, 2000);
  }, [metadata, router, user]);

  useEffect(() => {
    return auth.onIdTokenChanged(async (curUser) => {
      if (curUser) {
        setUser(curUser);
      } else {
        setUser(null);
      }
    });
  }, [user, router]);

  return {
    user,
    metadata,
    signInWithGoogle,
    signOut,
    ready,
  };
}
