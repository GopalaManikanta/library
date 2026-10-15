import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { memberService, MEMBER_AVATARS } from '../services/memberService';

const MemberContext = createContext(null);

const STORAGE_KEY = 'lms_members_dummyjson_data_v1';

const loadMembersFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length >= 10) {
      return parsed.map((m, idx) => ({
        ...m,
        id: String(m.id || `mem-${idx + 1}`),
        membershipId: m.membershipId || `LIB-MEM-${1000 + idx + 1}`,
        fullName: m.fullName || m.name || `Library Member ${idx + 1}`,
        name: m.fullName || m.name || `Library Member ${idx + 1}`,
        email: (m.email || `member${idx + 1}@library.com`).toLowerCase(),
        mobileNumber: m.mobileNumber || m.phone || '9876543210',
        phone: m.mobileNumber || m.phone || '9876543210',
        address:
          typeof m.address === 'object' && m.address !== null
            ? `${m.address.suite || ''} ${m.address.street || ''}, ${m.address.city || ''} - ${m.address.zipcode || ''}`.trim()
            : (m.address || 'Central Library Campus'),
        membershipDate: m.membershipDate || m.joinedDate || '2024-01-15',
        status: m.status || 'Active',
        avatar: m.avatar || m.image || MEMBER_AVATARS[idx % MEMBER_AVATARS.length],
        image: m.avatar || m.image || MEMBER_AVATARS[idx % MEMBER_AVATARS.length],
        booksIssuedCount: Number(m.booksIssuedCount) || 0,
        source: m.source || 'DummyJSON API',
      }));
    }
    return [];
  } catch {
    return [];
  }
};

export const MemberProvider = ({ children }) => {
  const [members, setMembers] = useState(loadMembersFromStorage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  const refreshMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiMembers = await memberService.fetchMembers();
      setMembers(apiMembers);
    } catch (err) {
      setError(err.message || 'Failed to fetch members from API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    memberService.fetchMembers().then((apiMembers) => {
      if (isMounted && Array.isArray(apiMembers) && apiMembers.length > 0) {
        setMembers((prev) => {
          if (
            !prev ||
            prev.length < 10 ||
            prev.some(
              (p) =>
                !p.fullName ||
                !p.fullName.trim() ||
                !p.name ||
                !p.avatar ||
                p.source !== 'DummyJSON API'
            )
          ) {
            return apiMembers;
          }
          return prev.map((m, idx) => {
            const resolved =
              (m.fullName && m.fullName.trim()) ||
              (m.name && m.name.trim()) ||
              'Library Member';
            const phone = m.mobileNumber || m.phone || '9876543210';
            const avatarUrl = m.avatar || m.image || MEMBER_AVATARS[idx % MEMBER_AVATARS.length];
            return {
              ...m,
              fullName: resolved,
              name: resolved,
              mobileNumber: phone,
              phone: phone,
              avatar: avatarUrl,
              image: avatarUrl,
              status: m.status || 'Active',
            };
          });
        });
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const addMember = useCallback(async (memberData) => {
    const resolvedName =
      (memberData.fullName && memberData.fullName.trim()) ||
      (memberData.name && memberData.name.trim()) ||
      'Library Member';
    const cleanPhone =
      (memberData.mobileNumber && memberData.mobileNumber.trim()) ||
      (memberData.phone && memberData.phone.trim()) ||
      '9876543210';
    const cleanAddr =
      typeof memberData.address === 'object' && memberData.address !== null
        ? `${memberData.address.suite || ''} ${memberData.address.street || ''}, ${memberData.address.city || ''} - ${memberData.address.zipcode || ''}`.trim()
        : (memberData.address?.trim() || 'Central Library Campus');
    const avatarUrl =
      memberData.avatar ||
      memberData.image ||
      MEMBER_AVATARS[Math.floor(Math.random() * MEMBER_AVATARS.length)];
    const newMember = {
      id: 'mem-' + Date.now(),
      membershipId:
        memberData.membershipId?.trim() || `LIB-MEM-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: resolvedName,
      name: resolvedName,
      email: (memberData.email?.trim() || 'member@library.com').toLowerCase(),
      mobileNumber: cleanPhone,
      phone: cleanPhone,
      address: cleanAddr,
      membershipDate: memberData.membershipDate || new Date().toISOString().split('T')[0],
      status: memberData.status || 'Active',
      avatar: avatarUrl,
      image: avatarUrl,
      booksIssuedCount: Number(memberData.booksIssuedCount) || 0,
      source: 'DummyJSON API',
    };

    await memberService.createMember(newMember);
    setMembers((prev) => [newMember, ...prev]);
    return newMember;
  }, []);

  const updateMember = useCallback(async (id, updatedData) => {
    const resolvedName =
      (updatedData.fullName && updatedData.fullName.trim()) ||
      (updatedData.name && updatedData.name.trim()) ||
      'Library Member';
    const cleanPhone =
      (updatedData.mobileNumber && updatedData.mobileNumber.trim()) ||
      (updatedData.phone && updatedData.phone.trim()) ||
      '9876543210';
    const cleanAddr =
      typeof updatedData.address === 'object' && updatedData.address !== null
        ? `${updatedData.address.suite || ''} ${updatedData.address.street || ''}, ${updatedData.address.city || ''} - ${updatedData.address.zipcode || ''}`.trim()
        : (updatedData.address?.trim() || 'Central Library Campus');
    const avatarUrl = updatedData.avatar || updatedData.image || MEMBER_AVATARS[0];
    const updatedMember = {
      ...updatedData,
      id: String(id),
      membershipId: updatedData.membershipId?.trim(),
      fullName: resolvedName,
      name: resolvedName,
      email: (updatedData.email?.trim() || 'member@library.com').toLowerCase(),
      mobileNumber: cleanPhone,
      phone: cleanPhone,
      address: cleanAddr,
      membershipDate: updatedData.membershipDate,
      status: updatedData.status || 'Active',
      avatar: avatarUrl,
      image: avatarUrl,
      booksIssuedCount: Number(updatedData.booksIssuedCount) || 0,
    };

    await memberService.updateMember(id, updatedMember);
    setMembers((prev) => prev.map((m) => (String(m.id) === String(id) ? updatedMember : m)));
    return updatedMember;
  }, []);

  const deleteMember = useCallback(async (id) => {
    setMembers((prev) => prev.filter((m) => String(m.id) !== String(id)));
    await memberService.deleteMember(id);
    return id;
  }, []);

  return (
    <MemberContext.Provider
      value={{
        members,
        setMembers,
        loading,
        error,
        refreshMembers,
        addMember,
        updateMember,
        deleteMember,
      }}
    >
      {children}
    </MemberContext.Provider>
  );
};

export const useMembers = () => {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error('useMembers must be used within a MemberProvider');
  }
  return context;
};
