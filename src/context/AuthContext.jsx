import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const USERS_STORAGE_KEY = 'lms_users_db';
const ACTIVE_USER_KEY = 'lms_active_user';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading] = useState(false);

  useEffect(() => {
    try {
      // Seed default accounts if DB is empty
      const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (!existingUsers) {
        const initialUsers = [
          {
            id: 'u-1',
            name: 'Manikanta',
            email: 'admin@library.com',
            password: 'Password@123',
            role: 'Admin',
            joinedDate: new Date().toISOString().split('T')[0],
          },
          {
            id: 'u-2',
            name: 'Demo Student',
            email: 'student@library.com',
            password: 'Password@123',
            role: 'Student',
            joinedDate: new Date().toISOString().split('T')[0],
          }
        ];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      }
    } catch (err) {
      console.error('Error seeding localStorage:', err);
    }
  }, []);

  const getUsers = () => {
    try {
      const users = localStorage.getItem(USERS_STORAGE_KEY);
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  };

  const register = (userData) => {
    const users = getUsers();
    const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      throw new Error('User with this email already exists!');
    }

    const newUser = {
      id: 'u-' + Date.now(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'Member',
      joinedDate: new Date().toISOString().split('T')[0],
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const { password: _pw, ...safeUser } = newUser;
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(safeUser));
    setCurrentUser(safeUser);
    return safeUser;
  };

  const login = (email, password) => {
    const users = getUsers();
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!foundUser) {
      throw new Error('Invalid email or password combination');
    }

    const { password: _pw, ...safeUser } = foundUser;
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(safeUser));
    setCurrentUser(safeUser);
    return safeUser;
  };

  const resetPassword = (email, newPassword) => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      throw new Error('No account found with this email address.');
    }

    users[userIndex].password = newPassword;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  };

  const logout = () => {
    localStorage.removeItem(ACTIVE_USER_KEY);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        register,
        resetPassword,
        logout,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
