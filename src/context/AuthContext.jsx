import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AuthContext = createContext(null);

const USERS_STORAGE_KEY = 'lms_users_db_v2';
const ACTIVE_USER_KEY = 'lms_active_user_v2';

const DEFAULT_STUDENT_MEMBERS = [
  {
    id: 'mem-student',
    membershipId: 'LIB-STU-2026',
    fullName: 'Demo Student',
    name: 'Demo Student',
    email: 'student@library.com',
    department: 'Computer Science & Engineering',
    semester: '6th Semester',
    avatar: 'https://dummyjson.com/icon/michaelw/128',
    status: 'Active',
  },
  {
    id: 'mem-1',
    membershipId: 'LIB-MEM-1001',
    fullName: 'Emily Johnson',
    name: 'Emily Johnson',
    email: 'emily.johnson@x.dummyjson.com',
    department: 'Information Science & Engineering',
    semester: '4th Semester',
    avatar: 'https://dummyjson.com/icon/emilys/128',
    status: 'Active',
  },
  {
    id: 'mem-2',
    membershipId: 'LIB-MEM-1002',
    fullName: 'Michael Williams',
    name: 'Michael Williams',
    email: 'michael.williams@x.dummyjson.com',
    department: 'Computer Science & Engineering',
    semester: '6th Semester',
    avatar: 'https://dummyjson.com/icon/michaelw/128',
    status: 'Active',
  },
  {
    id: 'mem-3',
    membershipId: 'LIB-MEM-1003',
    fullName: 'Sophia Brown',
    name: 'Sophia Brown',
    email: 'sophia.brown@x.dummyjson.com',
    department: 'Electronics & Communication',
    semester: '8th Semester',
    avatar: 'https://dummyjson.com/icon/sophiab/128',
    status: 'Active',
  },
  {
    id: 'mem-4',
    membershipId: 'LIB-MEM-1004',
    fullName: 'James Smith',
    name: 'James Smith',
    email: 'james.smith@x.dummyjson.com',
    department: 'Electrical Engineering',
    semester: '4th Semester',
    avatar: 'https://dummyjson.com/icon/jamesd/128',
    status: 'Active',
  },
  {
    id: 'mem-5',
    membershipId: 'LIB-MEM-1005',
    fullName: 'Emma Miller',
    name: 'Emma Miller',
    email: 'emma.miller@x.dummyjson.com',
    department: 'Artificial Intelligence & Data Science',
    semester: '2nd Semester',
    avatar: 'https://dummyjson.com/icon/emmaj/128',
    status: 'Active',
  },
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const loading = false;

  useEffect(() => {
    try {
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
            membershipId: 'LIB-STU-2026',
            studentId: 'STU-2026-8841',
            department: 'Computer Science & Engineering',
            semester: '6th Semester',
            avatar: 'https://dummyjson.com/icon/michaelw/128',
            joinedDate: '2024-08-15',
          }
        ];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      }
    } catch {
    }
  }, []);

  const getUsers = useCallback(() => {
    try {
      const users = localStorage.getItem(USERS_STORAGE_KEY);
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }, []);

  const getRegisteredMembers = useCallback(() => {
    try {
      const stored = localStorage.getItem('lms_members_dummyjson_data_v2') || localStorage.getItem('lms_members_dummyjson_cache_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = parsed.map((m, idx) => ({
            id: String(m.id || `mem-${idx + 1}`),
            membershipId: m.membershipId || `LIB-MEM-${1000 + idx + 1}`,
            fullName: (m.fullName && m.fullName.trim()) || (m.name && m.name.trim()) || `Library Member ${idx + 1}`,
            name: (m.fullName && m.fullName.trim()) || (m.name && m.name.trim()) || `Library Member ${idx + 1}`,
            email: (m.email || `member${idx + 1}@library.com`).toLowerCase(),
            status: m.status || 'Active',
            avatar: m.avatar || m.image || `https://dummyjson.com/icon/emilys/128`,
            department: m.department || 'Computer Science & Engineering',
            semester: m.semester || '6th Semester',
            joinedDate: m.membershipDate || '2024-01-15',
          }));
          if (!list.some(m => String(m.id) === 'mem-student' || m.email === 'student@library.com')) {
            list.unshift(DEFAULT_STUDENT_MEMBERS[0]);
          }
          return list;
        }
      }
      return DEFAULT_STUDENT_MEMBERS;
    } catch {
      return DEFAULT_STUDENT_MEMBERS;
    }
  }, []);

  const register = useCallback((userData) => {
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
      role: userData.role || 'Student',
      membershipId: userData.role === 'Admin' ? `LIB-ADM-${Math.floor(1000 + Math.random() * 9000)}` : `LIB-STU-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: userData.role === 'Student' ? `STU-2026-${Math.floor(1000 + Math.random() * 9000)}` : null,
      department: userData.department || 'Computer Science & Engineering',
      semester: userData.semester || '6th Semester',
      avatar: 'https://dummyjson.com/icon/michaelw/128',
      joinedDate: new Date().toISOString().split('T')[0],
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const { password: _pw, ...safeUser } = newUser;
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(safeUser));
    setCurrentUser(safeUser);
    return safeUser;
  }, [getUsers]);

  const login = useCallback((identifier, password) => {
    if (!identifier || !password) {
      throw new Error('Please enter institutional email/ID and security passkey');
    }
    const cleanId = String(identifier).trim().toLowerCase();
    const users = getUsers();
    const foundUser = users.find(
      u => (u.email.toLowerCase() === cleanId || u.name.toLowerCase() === cleanId || (u.membershipId && u.membershipId.toLowerCase() === cleanId)) && u.password === password
    );

    if (foundUser) {
      const { password: _pw, ...safeUser } = foundUser;
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(safeUser));
      setCurrentUser(safeUser);
      return safeUser;
    }

    const regMembers = getRegisteredMembers();
    const foundMember = regMembers.find(
      m =>
        m.email.toLowerCase() === cleanId ||
        m.fullName.toLowerCase() === cleanId ||
        (m.membershipId && m.membershipId.toLowerCase() === cleanId) ||
        String(m.id).toLowerCase() === cleanId
    );

    if (foundMember) {
      if (foundMember.status === 'Inactive') {
        throw new Error('Account suspended: This library membership is currently Inactive.');
      }
      if (password !== 'Password@123' && (!foundMember.password || foundMember.password !== password)) {
        throw new Error('Invalid passkey. Default passkey for members is Password@123');
      }

      const safeMemberUser = {
        id: String(foundMember.id),
        name: foundMember.fullName,
        email: foundMember.email,
        role: 'Student',
        membershipId: foundMember.membershipId,
        studentId: foundMember.membershipId,
        department: foundMember.department || 'Computer Science & Engineering',
        semester: foundMember.semester || '6th Semester',
        avatar: foundMember.avatar,
        joinedDate: foundMember.joinedDate || '2024-01-15',
        status: foundMember.status,
      };

      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(safeMemberUser));
      setCurrentUser(safeMemberUser);
      return safeMemberUser;
    }

    throw new Error('Invalid email or password combination');
  }, [getUsers, getRegisteredMembers]);

  const resetPassword = useCallback((email, newPassword) => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      throw new Error('No account found with this email address.');
    }

    users[userIndex].password = newPassword;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  }, [getUsers]);

  const logout = useCallback(() => {
    localStorage.removeItem(ACTIVE_USER_KEY);
    setCurrentUser(null);
  }, []);

  const value = useMemo(() => ({
    currentUser,
    loading,
    login,
    register,
    resetPassword,
    logout,
    getRegisteredMembers,
    isAuthenticated: !!currentUser,
  }), [currentUser, login, register, resetPassword, logout, getRegisteredMembers]);

  return (
    <AuthContext.Provider value={value}>
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
