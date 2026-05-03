import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  name: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  isApproved?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  favorites: string[];
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  toggleFavorite: (turfId: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("qt_token");
    const savedUser = localStorage.getItem("qt_user");

    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(parsedUser);
      
      // Load user-specific favorites
      const savedFavs = localStorage.getItem(`qt_favorites_${parsedUser.email}`);
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }

      // Pro-sync: Fetch latest profile data from server to ensure name/etc is correct
      fetch(`/api/user/profile?email=${encodeURIComponent(parsedUser.email)}`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          const freshUser = { ...parsedUser, ...data };
          setUser(freshUser);
          localStorage.setItem("qt_user", JSON.stringify(freshUser));
        }
      })
      .catch(err => console.error("Profile sync failed:", err));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("qt_token", authToken);
    localStorage.setItem("qt_user", JSON.stringify(userData));
    
    // Load favorites for this specific user
    const savedFavs = localStorage.getItem(`qt_favorites_${userData.email}`);
    setFavorites(savedFavs ? JSON.parse(savedFavs) : []);
  };

  const updateUser = (partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem("qt_user", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleFavorite = (turfId: string) => {
    if (!user) {
      alert("Please login to save your favorite turfs!");
      return;
    }

    setFavorites(prev => {
      const newFavs = prev.includes(turfId)
        ? prev.filter(id => id !== turfId)
        : [...prev, turfId];
      localStorage.setItem(`qt_favorites_${user.email}`, JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setFavorites([]);
    localStorage.removeItem("qt_token");
    localStorage.removeItem("qt_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, favorites, login, logout, updateUser, toggleFavorite, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
