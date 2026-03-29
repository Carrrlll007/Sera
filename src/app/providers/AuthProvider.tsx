import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../../services/firebase";
import { householdService } from "../../services/householdService";
import { Household, HouseholdMember, MemberRole } from "../../types";

interface AuthContextType {
  user: FirebaseUser | null;
  household: Household | null;
  members: HouseholdMember[];
  userRole: MemberRole;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  household: null,
  members: [],
  userRole: "member",
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubMembers: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // 1. Find existing household
        let h = await householdService.findHouseholdByMember(u.uid);
        
        // 2. Create if not found (bootstrapping)
        if (!h) {
          const result = await householdService.createHousehold(
            `${u.displayName || "My"}'s Household`,
            u.uid,
            u.email || "",
            u.displayName || "Owner"
          );
          if (result) {
            h = await householdService.getHousehold(result.householdId);
          }
        }
        
        if (h) {
          setHousehold(h);
          // Subscribe to members
          unsubMembers?.();
          unsubMembers = householdService.subscribeToHouseholdMembers(h.id, (m) => {
            setMembers(m);
          });
        }
      } else {
        setHousehold(null);
        setMembers([]);
        unsubMembers?.();
        unsubMembers = null;
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubMembers?.();
    };
  }, []);

  const userRole = members.find(m => m.uid === user?.uid)?.role || "member";

  return (
    <AuthContext.Provider value={{ user, household, members, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
