import axios from 'axios';

const DUMMY_JSON_API_URL = 'https://dummyjson.com/users?limit=10';
const MEMBERS_CACHE_KEY = 'lms_members_dummyjson_cache_v1';

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

const FALLBACK_MEMBERS = [
  { id: 'mem-1', membershipId: 'LIB-MEM-1001', fullName: 'Emily Johnson', name: 'Emily Johnson', email: 'emily.johnson@x.dummyjson.com', avatar: 'https://dummyjson.com/icon/emilys/128', image: 'https://dummyjson.com/icon/emilys/128', mobileNumber: '9654313024', phone: '9654313024', address: '626 Main Street, Phoenix, Mississippi - 29112', membershipDate: '2024-01-15', role: 'Faculty', status: 'Active', booksIssuedCount: 1, source: 'DummyJSON API' },
  { id: 'mem-2', membershipId: 'LIB-MEM-1002', fullName: 'Michael Williams', name: 'Michael Williams', email: 'michael.williams@x.dummyjson.com', avatar: 'https://dummyjson.com/icon/michaelw/128', image: 'https://dummyjson.com/icon/michaelw/128', mobileNumber: '2586276644', phone: '2586276644', address: '385 Fifth Street, Houston, Alabama - 38807', membershipDate: '2024-02-15', role: 'Admin', status: 'Active', booksIssuedCount: 2, source: 'DummyJSON API' },
  { id: 'mem-3', membershipId: 'LIB-MEM-1003', fullName: 'Sophia Brown', name: 'Sophia Brown', email: 'sophia.brown@x.dummyjson.com', avatar: 'https://dummyjson.com/icon/sophiab/128', image: 'https://dummyjson.com/icon/sophiab/128', mobileNumber: '2106522785', phone: '2106522785', address: '1642 Ninth Street, Washington, Alabama - 32822', membershipDate: '2024-03-15', role: 'Student', status: 'Active', booksIssuedCount: 1, source: 'DummyJSON API' },
  { id: 'mem-4', membershipId: 'LIB-MEM-1004', fullName: 'James Davis', name: 'James Davis', email: 'james.davis@x.dummyjson.com', avatar: 'https://dummyjson.com/icon/jamesd/128', image: 'https://dummyjson.com/icon/jamesd/128', mobileNumber: '6149589364', phone: '6149589364', address: '238 Jefferson Street, Seattle, Pennsylvania - 68354', membershipDate: '2024-04-15', role: 'Faculty', status: 'Active', booksIssuedCount: 3, source: 'DummyJSON API' },
  { id: 'mem-5', membershipId: 'LIB-MEM-1005', fullName: 'Emma Miller', name: 'Emma Miller', email: 'emma.miller@x.dummyjson.com', avatar: 'https://dummyjson.com/icon/emmaj/128', image: 'https://dummyjson.com/icon/emmaj/128', mobileNumber: '7597761614', phone: '7597761614', address: '607 Fourth Street, Jacksonville, Colorado - 26593', membershipDate: '2024-05-15', role: 'Student', status: 'Active', booksIssuedCount: 2, source: 'DummyJSON API' },
  { id: 'mem-6', membershipId: 'LIB-MEM-1006', fullName: 'Olivia Wilson', name: 'Olivia Wilson', email: 'olivia.wilson@x.dummyjson.com', avatar: 'https://dummyjson.com/icon/oliviaw/128', image: 'https://dummyjson.com/icon/oliviaw/128', mobileNumber: '6072956448', phone: '6072956448', address: '547 First Street, Fort Worth, Tennessee - 83843', membershipDate: '2024-06-15', role: 'Student', status: 'Active', booksIssuedCount: 1, source: 'DummyJSON API' },
  { id: 'mem-7', membershipId: 'LIB-MEM-1007', fullName: 'Alexander Jones', name: 'Alexander Jones', email: 'alexander.jones@x.dummyjson.com', avatar: 'https://dummyjson.com/icon/alexanderj/128', image: 'https://dummyjson.com/icon/alexanderj/128', mobileNumber: '2608244986', phone: '2608244986', address: '664 Maple Street, Indianapolis, Delaware - 86684', membershipDate: '2024-07-15', role: 'Faculty', status: 'Active', booksIssuedCount: 2, source: 'DummyJSON API' },
  { id: 'mem-8', membershipId: 'LIB-MEM-1008', fullName: 'Ava Taylor', name: 'Ava Taylor', email: 'ava.taylor@x.dummyjson.com', avatar: 'https://dummyjson.com/icon/avat/128', image: 'https://dummyjson.com/icon/avat/128', mobileNumber: '4588537877', phone: '4588537877', address: '1197 First Street, Fort Worth, Rhode Island - 24771', membershipDate: '2024-08-15', role: 'Student', status: 'Active', booksIssuedCount: 1, source: 'DummyJSON API' },
  { id: 'mem-9', membershipId: 'LIB-MEM-1009', fullName: 'Ethan Martinez', name: 'Ethan Martinez', email: 'ethan.martinez@x.dummyjson.com', avatar: 'https://dummyjson.com/icon/ethanm/128', image: 'https://dummyjson.com/icon/ethanm/128', mobileNumber: '9336085081', phone: '9336085081', address: '466 Pine Street, San Antonio, Louisiana - 72360', membershipDate: '2024-09-15', role: 'Student', status: 'Active', booksIssuedCount: 3, source: 'DummyJSON API' },
  { id: 'mem-10', membershipId: 'LIB-MEM-1010', fullName: 'Isabella Anderson', name: 'Isabella Anderson', email: 'isabella.anderson@x.dummyjson.com', avatar: 'https://dummyjson.com/icon/isabellad/128', image: 'https://dummyjson.com/icon/isabellad/128', mobileNumber: '7706584885', phone: '7706584885', address: '1964 Oak Street, New York, Utah - 89352', membershipDate: '2024-10-15', role: 'Student', status: 'Active', booksIssuedCount: 2, source: 'DummyJSON API' },
];

export const memberService = {
  async fetchMembers() {
    try {
      const response = await axios.get(DUMMY_JSON_API_URL, { timeout: 7000 });
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
          const role = u.role === 'admin' ? 'Admin' : idx % 3 === 0 ? 'Faculty' : 'Student';
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
            role,
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
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length >= 10) {
            return parsed;
          }
        } catch {
        }
      }
      return FALLBACK_MEMBERS;
    } catch {
      const cached = localStorage.getItem(MEMBERS_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length >= 10) {
            return parsed;
          }
        } catch {
        }
      }
      return FALLBACK_MEMBERS;
    }
  },

  async createMember(newMember) {
    return newMember;
  },

  async updateMember(id, updatedMember) {
    return updatedMember;
  },

  async deleteMember(id) {
    return id;
  },
};
