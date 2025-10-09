import { createContext, useContext, useState } from 'react';
import { getCurrentUserRole } from '../utils/useCurrentUserRole.js';
// lay role tu jwt localstorage
const UserRoleContext = createContext();

export const UserRoleProvider = ({ children }) => {
  const [role, setRoleState] = useState(() => {
    return getCurrentUserRole();
  });

  const setRole = (newRole) => {
    setRoleState(newRole);
  };

  return (
    <UserRoleContext.Provider value={{ role, setRole }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => useContext(UserRoleContext);
