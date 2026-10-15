import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  IdCard,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  RefreshCw,
  BookOpen,
  Printer,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Sidebar } from '../components/Sidebar';
import { MEMBER_AVATARS } from '../services/memberService';

export const MemberList = () => {
  const { members, loading, refreshMembers, addMember, updateMember, deleteMember } = useLibrary();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage, setMembersPerPage] = useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const filteredMembers = useMemo(() => {
    return members
      .map((m, idx) => {
        const fullName = (m.fullName && m.fullName.trim()) || (m.name && m.name.trim()) || `Library Member ${idx + 1}`;
        const mobileNumber = m.mobileNumber || m.phone || '9876543210';
        const address =
          typeof m.address === 'object' && m.address !== null
            ? `${m.address.address || m.address.suite || ''} ${m.address.street || ''}, ${m.address.city || ''} - ${m.address.postalCode || m.address.zipcode || ''}`.trim()
            : (m.address || 'Central Library Campus');
        const membershipId =
          m.membershipId ||
          (m.id && String(m.id).startsWith('LIB') ? m.id : `LIB-MEM-${1000 + idx + 1}`);
        const membershipDate = m.membershipDate || m.joinedDate || '2024-01-15';
        const role = m.role || 'Student';
        const status = m.status || 'Active';
        const avatar = m.avatar || m.image || MEMBER_AVATARS[idx % MEMBER_AVATARS.length];

        return {
          ...m,
          id: String(m.id || `mem-${idx + 1}`),
          fullName,
          name: fullName,
          mobileNumber,
          phone: mobileNumber,
          address,
          membershipId,
          membershipDate,
          role,
          status,
          avatar,
          image: avatar,
          booksIssuedCount: Number(m.booksIssuedCount) || 0,
        };
      })
      .filter((m) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          m.fullName.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.mobileNumber.toLowerCase().includes(q) ||
          m.membershipId.toLowerCase().includes(q) ||
          m.address.toLowerCase().includes(q);

        const matchesRole = selectedRole === 'All' || m.role === selectedRole;
        const matchesStatus = selectedStatus === 'All' || m.status === selectedStatus;

        return matchesSearch && matchesRole && matchesStatus;
      });
  }, [members, searchQuery, selectedRole, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / membersPerPage));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * membersPerPage;
    return filteredMembers.slice(start, start + membersPerPage);
  }, [filteredMembers, currentPage, membersPerPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRole('All');
    setSelectedStatus('All');
    setCurrentPage(1);
  };

  const handleCopyId = (idStr) => {
    if (idStr) {
      navigator.clipboard.writeText(idStr);
      setCopiedId(true);
      toast.success('Membership ID copied!');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    setIsSubmitting(true);
    try {
      await deleteMember(deletingMember.id);
      toast.success(`Member "${deletingMember.fullName}" deleted successfully!`);
      if (viewingMember?.id === deletingMember.id) {
        setViewingMember(null);
      }
      setDeletingMember(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-800 flex font-sans">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Member Management
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  {filteredMembers.length} Members
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                View, search, register, and update library patrons
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshMembers}
              disabled={loading}
              title="Refresh Members from API"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
              <span className="hidden sm:inline">Sync API</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by name, email, mobile, ID, address..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/15 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {(searchQuery || selectedRole !== 'All' || selectedStatus !== 'All') && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">
                  Found <strong className="text-slate-900">{filteredMembers.length}</strong> matching members
                </span>
                <button
                  onClick={handleResetFilters}
                  className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>
            )}
          </div>

          {paginatedMembers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No members found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No member profiles matched your search or filters. Try adjusting your query or enroll a new member.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  + Add Member
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => setViewingMember(member)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group cursor-pointer"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 ring-2 ring-slate-100 group-hover:ring-teal-500/20 overflow-hidden shrink-0 flex items-center justify-center relative">
                          <img
                            src={member.avatar}
                            alt={member.fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="w-full h-full hidden items-center justify-center text-teal-800 font-black text-sm absolute inset-0 bg-teal-50">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-extrabold text-sm text-slate-900 truncate group-hover:text-teal-700 transition"
                            title={member.fullName}
                          >
                            {member.fullName}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {member.role}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                member.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  member.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              {member.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingMember(member);
                          }}
                          title="View Profile"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMember(member);
                          }}
                          title="Edit Member"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingMember(member);
                          }}
                          title="Delete Member"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <IdCard className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        {member.membershipId}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyId(member.membershipId);
                        }}
                        className="text-[10px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-teal-50"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-700">{member.mobileNumber}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-slate-500 text-[11px] leading-relaxed">
                          {member.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>Joined: <strong className="text-slate-700">{member.membershipDate}</strong></span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingMember(member);
                      }}
                      className="text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-slate-500">
                Showing{' '}
                <strong className="text-slate-800">
                  {filteredMembers.length === 0 ? 0 : (currentPage - 1) * membersPerPage + 1}-
                  {Math.min(currentPage * membersPerPage, filteredMembers.length)}
                </strong>{' '}
                of <strong className="text-slate-800">{filteredMembers.length}</strong> members
              </p>

              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span className="text-slate-400">Per Page:</span>
                <select
                  value={membersPerPage}
                  onChange={(e) => {
                    setMembersPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition cursor-pointer ${
                        currentPage === pg
                          ? 'bg-teal-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {isAddModalOpen && (
        <MemberFormModal
          title="Enroll New Member"
          existingMembers={members}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            try {
              await addMember(data);
              toast.success(`Member "${data.fullName}" enrolled successfully!`);
              setIsAddModalOpen(false);
              setCurrentPage(1);
              setSearchQuery('');
            } catch (err) {
              toast.error(err.message || 'Failed to add member');
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {editingMember && (
        <MemberFormModal
          title="Edit Member Profile"
          defaultValues={editingMember}
          existingMembers={members.filter((m) => m.id !== editingMember.id)}
          onClose={() => setEditingMember(null)}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            try {
              const updated = await updateMember(editingMember.id, data);
              toast.success(`Member "${data.fullName}" updated successfully!`);
              if (viewingMember?.id === editingMember.id) {
                setViewingMember(updated);
              }
              setEditingMember(null);
            } catch (err) {
              toast.error(err.message || 'Failed to update member');
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {viewingMember && (
        <MemberProfileModal
          member={viewingMember}
          onClose={() => setViewingMember(null)}
          onEdit={() => {
            setEditingMember(viewingMember);
            setViewingMember(null);
          }}
          onCopyId={handleCopyId}
          copiedId={copiedId}
        />
      )}

      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Remove Member?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-800">"{deletingMember.fullName}"</strong> ({deletingMember.membershipId})?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MemberFormModal = ({
  title,
  defaultValues,
  existingMembers = [],
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [initialDefaults] = useState(() => {
    if (defaultValues) {
      const addr =
        typeof defaultValues.address === 'object' && defaultValues.address !== null
          ? `${defaultValues.address.address || defaultValues.address.suite || ''} ${defaultValues.address.street || ''}, ${defaultValues.address.city || ''} - ${defaultValues.address.postalCode || defaultValues.address.zipcode || ''}`.trim()
          : (defaultValues.address || '');
      return {
        fullName: (defaultValues.fullName && defaultValues.fullName.trim()) || (defaultValues.name && defaultValues.name.trim()) || '',
        email: defaultValues.email || '',
        mobileNumber: defaultValues.mobileNumber || defaultValues.phone || '',
        address: addr,
        membershipId: defaultValues.membershipId || `LIB-MEM-${Math.floor(1000 + Math.random() * 9000)}`,
        membershipDate: defaultValues.membershipDate || new Date().toISOString().split('T')[0],
        role: defaultValues.role || 'Student',
        status: defaultValues.status || 'Active',
      };
    }
    return {
      fullName: '',
      email: '',
      mobileNumber: '',
      address: '',
      membershipId: `LIB-MEM-${Math.floor(1000 + Math.random() * 9000)}`,
      membershipDate: new Date().toISOString().split('T')[0],
      role: 'Student',
      status: 'Active',
    };
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialDefaults,
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
            <p className="text-[11px] text-slate-500">
              Provide complete member credentials and contact details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 overflow-y-auto space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Manikanta Kumar"
              {...register('fullName', {
                required: 'Full name is required',
                minLength: { value: 3, message: 'Minimum 3 characters required' },
              })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
            />
            {errors.fullName && (
              <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.fullName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="e.g. member@library.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Enter a valid email address',
                  },
                  validate: (val) => {
                    const duplicate = existingMembers.some(
                      (m) => m.email?.toLowerCase() === val.toLowerCase()
                    );
                    return !duplicate || 'Email already exists';
                  },
                })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              />
              {errors.email && (
                <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                {...register('mobileNumber', {
                  required: 'Mobile number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Enter 10-digit number',
                  },
                })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 font-mono"
              />
              {errors.mobileNumber && (
                <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.mobileNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Membership ID *
              </label>
              <input
                type="text"
                placeholder="e.g. LIB-MEM-1001"
                {...register('membershipId', {
                  required: 'Membership ID is required',
                  validate: (val) => {
                    const duplicate = existingMembers.some(
                      (m) => m.membershipId?.toLowerCase() === val.toLowerCase()
                    );
                    return !duplicate || 'ID already exists';
                  },
                })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 font-mono font-bold"
              />
              {errors.membershipId && (
                <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.membershipId.message}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Membership Date *
              </label>
              <input
                type="date"
                {...register('membershipDate', { required: 'Date is required' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 font-mono"
              />
              {errors.membershipDate && (
                <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.membershipDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Role *
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none cursor-pointer"
              >
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Address *
            </label>
            <textarea
              rows={2}
              placeholder="Enter complete postal or residential address..."
              {...register('address', {
                required: 'Address is required',
                minLength: { value: 5, message: 'Minimum 5 characters required' },
              })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 resize-none"
            />
            {errors.address && (
              <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.address.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MemberProfileModal = ({
  member,
  onClose,
  onEdit,
  onCopyId,
  copiedId,
}) => {
  if (!member) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 p-6 text-white relative border-b border-teal-500/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono tracking-wider uppercase text-teal-300 font-bold px-2 py-0.5 rounded bg-white/10 border border-white/15">
              Official Library Pass
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-xl shrink-0 bg-slate-800">
              <img
                src={member.avatar}
                alt={member.fullName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white truncate" title={member.fullName}>
                  {member.fullName}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white">
                  {member.role}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    member.status === 'Active'
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                      : 'bg-rose-500/30 text-rose-300 border border-rose-400/30'
                  }`}
                >
                  {member.status}
                </span>
              </div>
              <p className="text-xs text-teal-200/80 mt-0.5 truncate">{member.email}</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-teal-300/80 font-bold block">
                Membership ID
              </span>
              <span className="font-mono text-sm font-black text-white tracking-wider block">
                {member.membershipId}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onCopyId(member.membershipId)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border border-white/20"
            >
              {copiedId ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-teal-300" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Mobile Number
              </span>
              <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                {member.mobileNumber}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Joined Date
              </span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                {member.membershipDate}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Address
            </span>
            <span className="text-slate-700 leading-relaxed flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
              <span>{member.address}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-teal-950">Active Book Loans</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-black text-xs">
              {member.booksIssuedCount} Volumes
            </span>
          </div>
        </div>

        <div className="p-4 px-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
