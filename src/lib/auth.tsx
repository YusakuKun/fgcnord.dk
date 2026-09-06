import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface MePlayer {
  id: string;
  gamertag: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface MeState {
  authenticated: boolean;
  isMember: boolean;
  isAdmin: boolean;
  player?: MePlayer;
}

interface AuthContextValue {
  me: MeState | null;
  loading: boolean;
  /** Hent /api/me igen (fx efter login-redirect eller rolle-ændring) */
  refresh: () => Promise<void>;
  /** Log ud og nulstil state */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  me: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

async function fetchMe(): Promise<MeState> {
  const res = await fetch("/api/me", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as MeState;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setMe(await fetchMe());
    } catch {
      setMe({ authenticated: false, isMember: false, isAdmin: false });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Selv hvis kaldet fejler, rydder vi lokal state — cookien udløber af sig selv
    }
    setMe({ authenticated: false, isMember: false, isAdmin: false });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ me, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
