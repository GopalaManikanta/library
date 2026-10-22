import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  IdCard,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  RefreshCw,
  BookOpen,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Sidebar } from '../components/Sidebar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MEMBER_AVATARS } from '../services/memberService';

export const MemberList = () => {
  const { members, loading, refreshMembers, addMember, updateMember, deleteMember, transactions } = useLibrary();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedMember, setSelectedMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage, setMembersPerPage] = useState(10);
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
        const status = m.status || 'Active';
        const avatar = m.avatar || m.image || MEMBER_AVATARS[idx % MEMBER_AVATARS.length];
        const memberLoans = (transactions || []).filter(
          (t) =>
            (String(t.memberId) === String(m.id) ||
              (m.email && t.memberEmail && t.memberEmail.toLowerCase() === m.email.toLowerCase()) ||
              (m.membershipId && t.memberId === m.membershipId) ||
              (fullName && t.memberName && t.memberName.toLowerCase() === fullName.toLowerCase())) &&
            t.status === 'Active'
        );
        const booksIssuedCount = transactions ? memberLoans.length : (Number(m.booksIssuedCount) || 0);

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
          status,
          avatar,
          image: avatar,
          booksIssuedCount,
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

        const matchesStatus = selectedStatus === 'All' || m.status === selectedStatus;

        return matchesSearch && matchesStatus;
      });
  }, [members, searchQuery, selectedStatus, transactions]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / membersPerPage));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * membersPerPage;
    return filteredMembers.slice(start, start + membersPerPage);
  }, [filteredMembers, currentPage, membersPerPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
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
      if (selectedMember?.id === deletingMember.id) {
        setSelectedMember(null);
        setViewMode('list');
      }
      setDeletingMember(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedMember(null);
    setViewMode('add');
  };

  const handleOpenEdit = (member) => {
    setSelectedMember(member);
    setViewMode('edit');
  };

  const handleOpenView = (member) => {
    setSelectedMember(member);
    setViewMode('view');
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-800 flex font-sans">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {viewMode === 'list' && (
          <>
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
                  onClick={handleOpenAdd}
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
                  <div className="sm:col-span-8 relative">
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

                  <div className="sm:col-span-4">
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

                {(searchQuery || selectedStatus !== 'All') && (
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
                      onClick={handleOpenAdd}
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
                      onClick={() => handleOpenView(member)}
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
                                handleOpenView(member);
                              }}
                              title="View Full Profile"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(member);
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
                        <Link
                          to={`/circulation?action=issue&memberId=${member.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition border border-teal-200"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Assign Book</span>
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenView(member);
                          }}
                          className="text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>Full Profile</span>
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

                  <div className="flex items-center gap-2 text-slate-500">
                    <span>Per page:</span>
                    <select
                      value={membersPerPage}
                      onChange={(e) => {
                        setMembersPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value={6}>6</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
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
          </>
        )}

        {viewMode === 'view' && selectedMember && (
          <FullPageMemberView
            member={selectedMember}
            transactions={transactions}
            onBack={() => {
              setSelectedMember(null);
              setViewMode('list');
            }}
            onEdit={() => setViewMode('edit')}
            onDelete={() => {
              setDeletingMember(selectedMember);
            }}
            onCopyId={handleCopyId}
            copiedId={copiedId}
          />
        )}

        {(viewMode === 'add' || viewMode === 'edit') && (
          <FullPageMemberForm
            title={viewMode === 'add' ? 'Enroll New Library Member' : `Edit Member: ${selectedMember?.fullName}`}
            submitText={viewMode === 'add' ? 'Register Member' : 'Save Changes'}
            defaultValues={selectedMember}
            onBack={() => {
              setViewMode('list');
            }}
            onSubmit={async (data) => {
              setIsSubmitting(true);
              try {
                if (viewMode === 'add') {
                  await addMember(data);
                  toast.success(`Member "${data.fullName}" enrolled successfully!`);
                } else {
                  const updated = await updateMember(selectedMember.id, data);
                  toast.success(`Member "${updated.fullName}" updated successfully!`);
                  setSelectedMember(updated);
                }
                setViewMode('list');
              } catch (err) {
                toast.error(err.message || 'Failed to save member details');
              } finally {
                setIsSubmitting(false);
              }
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deletingMember)}
        title="Confirm Member Removal"
        itemName={deletingMember?.fullName}
        message="Are you sure you want to remove this member from the library patron directory? Active loan histories and account records will be affected."
        confirmLabel="Remove Member"
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingMember(null)}
      />
    </div>
  );
};

const FullPageMemberView = ({
  member,
  transactions,
  onBack,
  onEdit,
  onDelete,
  onCopyId,
  copiedId,
}) => {
  const [todayDate] = useState(() => new Date().toISOString().split('T')[0]);

  const activeLoansList = useMemo(() => {
    return (transactions || []).filter(
      (t) =>
        (String(t.memberId) === String(member.id) ||
          (member.email && t.memberEmail && t.memberEmail.toLowerCase() === member.email.toLowerCase()) ||
          (member.membershipId && t.memberId === member.membershipId) ||
          (member.fullName && t.memberName && t.memberName.toLowerCase() === member.fullName.toLowerCase())) &&
        t.status === 'Active'
    );
  }, [transactions, member]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back to Members</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              Member Profile: {member.fullName}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Patron account credentials, contact records, and active library borrowings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/circulation?action=issue&memberId=${member.id}`}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Assign Book</span>
          </Link>

          <button
            type="button"
            onClick={onEdit}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-600" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
        <div className="p-6 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl shadow-md relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 overflow-hidden ring-4 ring-white/20 shrink-0 shadow-xl">
              <img
                src={member.avatar}
                alt={member.fullName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-white truncate" title={member.fullName}>
                  {member.fullName}
                </h2>
                <span
                  className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                    member.status === 'Active'
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                      : 'bg-rose-500/30 text-rose-300 border border-rose-400/30'
                  }`}
                >
                  {member.status}
                </span>
              </div>
              <p className="text-xs text-teal-200/90">{member.email}</p>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl border border-white/15 flex flex-col sm:items-end">
              <span className="text-[10px] uppercase tracking-wider text-teal-300 font-bold">
                Membership ID
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-base font-black text-white">
                  {member.membershipId}
                </span>
                <button
                  type="button"
                  onClick={() => onCopyId(member.membershipId)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Copy ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-teal-300" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Contact Phone
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
              {member.mobileNumber}
            </span>
            <span className="text-slate-400 text-[11px]">Direct mobile line for circulation notifications</span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Membership Enrolled
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm block mt-1">
              {member.membershipDate}
            </span>
            <span className="text-slate-400 text-[11px]">Official registration date with Central Library</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Registered Campus Address
          </span>
          <p className="text-slate-800 font-medium text-sm leading-relaxed">
            {member.address}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-teal-50 border border-teal-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-teal-950 text-sm">Active Book Borrowings</p>
              <p className="text-xs text-teal-700">Currently issued volumes across catalog</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-teal-900 bg-white px-4 py-1.5 rounded-2xl border border-teal-200 shadow-2xs">
              {member.booksIssuedCount} / 5 Loans
            </span>
            <Link
              to={`/circulation?action=issue&memberId=${member.id}`}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Issue Book</span>
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Issued Books & Circulation Records</h3>
              <p className="text-[11px] text-slate-500">Live borrowings synchronized across Student & Admin Portals</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {activeLoansList.length} Active Volumes
            </span>
          </div>

          {activeLoansList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
              <p>No active books currently issued to this member.</p>
              <Link
                to={`/circulation?action=issue&memberId=${member.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 font-bold"
              >
                <span>Issue a book now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeLoansList.map((loan) => (
                <div key={loan.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {loan.bookCover ? (
                      <img src={loan.bookCover} alt={loan.bookTitle} className="w-10 h-14 object-cover rounded-lg shadow-2xs shrink-0" />
                    ) : (
                      <div className="w-10 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-black text-slate-900 line-clamp-1">{loan.bookTitle}</p>
                      <p className="text-[11px] text-slate-500">{loan.bookAuthor} • {loan.bookCategory}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                        <span>Issued: {loan.issueDate}</span>
                        <span>•</span>
                        <span className={loan.dueDate < todayDate ? 'text-rose-600 font-bold' : 'text-teal-700 font-bold'}>
                          Due: {loan.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${loan.dueDate < todayDate ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {loan.dueDate < todayDate ? 'Overdue' : 'Active Loan'}
                    </span>
                    <Link
                      to={`/circulation?search=${encodeURIComponent(loan.bookTitle || '')}`}
                      className="text-xs font-bold px-3 py-1 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                    >
                      Circulation Desk
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const FullPageMemberForm = ({
  title,
  submitText,
  defaultValues,
  onBack,
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
    <div className="flex-1 flex flex-col min-w-0">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back to Members</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Register or update library member credentials, contact numbers, and campus address
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 text-xs">
              Full Legal Name *
            </label>
            <input
              type="text"
              {...register('fullName', { required: 'Full name is required' })}
              placeholder="e.g. Eleanor Vance"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-sm"
            />
            {errors.fullName && (
              <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.fullName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                Email Address *
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                placeholder="patron@library.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-sm"
              />
              {errors.email && (
                <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                Mobile Number *
              </label>
              <input
                type="tel"
                {...register('mobileNumber', {
                  required: 'Mobile is required',
                  pattern: {
                    value: /^[0-9+\s()-]{7,15}$/,
                    message: 'Valid phone number required',
                  },
                })}
                placeholder="9876543210"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 font-mono text-sm"
              />
              {errors.mobileNumber && (
                <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.mobileNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                Membership ID *
              </label>
              <input
                type="text"
                {...register('membershipId', { required: 'ID is required' })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 font-mono text-sm"
              />
              {errors.membershipId && (
                <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.membershipId.message}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                Membership Date *
              </label>
              <input
                type="date"
                {...register('membershipDate', { required: 'Date is required' })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 font-mono text-sm"
              />
              {errors.membershipDate && (
                <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.membershipDate.message}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none cursor-pointer text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5 text-xs">
              Campus Address *
            </label>
            <textarea
              rows={3}
              {...register('address', { required: 'Address is required' })}
              placeholder="Suite / Street Name, City, State - Zipcode"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-sm"
            />
            {errors.address && (
              <p className="text-rose-500 mt-1 font-semibold">⚠ {errors.address.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Saving...' : submitText}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
