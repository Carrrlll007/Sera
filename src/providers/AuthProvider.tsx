import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../firebase";
import { householdService } from "../services/householdService";
import { Household } from "../types";

interface AuthContextType {
  user: FirebaseUser | null;
  household: Household | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  household: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const h = await householdService.getOrCreateHousehold(u.uid, u.displayName || "My");
        if (h) setHousehold(h);
      } else {
        setHousehold(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, household, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
