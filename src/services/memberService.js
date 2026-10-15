import axios from 'axios';

const DUMMY_JSON_API_URL = 'https://dummyjson.com/users?limit=10';
const MEMBERS_CACHE_KEY = 'lms_members_dummyjson_cache_v2';

export const MEMBER_AVATARS = [
  'https://dummyjson.com/icon/emilys/128',
  'https://dummyjson.com/icon/michaelw/128',
  'https://dummyjson.com/icon/sophiab/128',
  'https://dummyjson.com/icon/jamesd/128',
  'https://dummyjson.com/icon/emmaj/128',
  'https://dummyjson.com/icon/oliviaw/128',
  'https://dummyjson.com/icon/alexanderj/128',
  'https://dummyjson.com/icon/avat/128',
  'https://dummyjson.com/icon/ethanm/128',
  'https://dummyjson.com/icon/isabellad/128',
];

export const memberService = {
  async fetchMembers() {
    const response = await axios.get(DUMMY_JSON_API_URL, { timeout: 8000 });
    if (response.data && Array.isArray(response.data.users) && response.data.users.length > 0) {
      const liveMembers = response.data.users.slice(0, 10).map((u, idx) => {
        const rawDigits = (u.phone || '').replace(/\D/g, '');
        const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : (rawDigits + '9876543210').slice(0, 10);
        const street = u.address?.address || 'Campus Avenue';
        const city = u.address?.city || 'Metropolis';
        const state = u.address?.state || 'State';
        const post = u.address?.postalCode || '500001';
        const address = `${street}, ${city}, ${state} - ${post}`;
        const regDate = `2024-0${(idx % 9) + 1}-15`;
        const fullName = `${u.firstName || 'Member'} ${u.lastName || ''}`.trim();
        const avatarUrl = u.image || MEMBER_AVATARS[idx % MEMBER_AVATARS.length];

        return {
          id: `mem-${u.id || idx + 1}`,
          membershipId: `LIB-MEM-${1000 + (u.id || idx + 1)}`,
          fullName,
          name: fullName,
          email: (u.email || `member${idx + 1}@library.com`).toLowerCase(),
          mobileNumber: cleanPhone,
          phone: cleanPhone,
          address,
          membershipDate: regDate,
          status: 'Active',
          avatar: avatarUrl,
          image: avatarUrl,
          gender: u.gender || 'unspecified',
          booksIssuedCount: (idx % 3) + 1,
          source: 'DummyJSON API',
        };
      });

      localStorage.setItem(MEMBERS_CACHE_KEY, JSON.stringify(liveMembers));
      return liveMembers;
    }

    const cached = localStorage.getItem(MEMBERS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length >= 10) {
        return parsed;
      }
    }
    throw new Error('No user records returned from DummyJSON API');
  },

  async createMember(newMember) {
    const names = (newMember.fullName || '').split(' ');
    const res = await axios.post(
      'https://dummyjson.com/users/add',
      {
        firstName: names[0] || 'Member',
        lastName: names.slice(1).join(' ') || '',
        email: newMember.email,
        phone: newMember.mobileNumber,
      },
      { timeout: 7000 }
    );

    return {
      ...newMember,
      apiId: res.data?.id,
    };
  },

  async updateMember(id, updatedMember) {
    const numericId = String(id).replace(/\D/g, '') || '1';
    await axios.put(
      `https://dummyjson.com/users/${numericId}`,
      {
        email: updatedMember.email,
        phone: updatedMember.mobileNumber,
      },
      { timeout: 7000 }
    );
    return updatedMember;
  },

  async deleteMember(id) {
    const numericId = String(id).replace(/\D/g, '') || '1';
    await axios.delete(`https://dummyjson.com/users/${numericId}`, { timeout: 7000 });
    return id;
  },
};
