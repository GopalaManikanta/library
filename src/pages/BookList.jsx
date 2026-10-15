import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  Search,
  Plus,
  BookOpen,
  Edit3,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Sidebar } from '../components/Sidebar';
import { getVerifiedCover, generateFallbackCover } from '../services/bookService';

export const BookList = () => {
  const {
    books,
    loading,
    error,
    refreshBooks,
    searchGoogleBooks,
    searchLocalBooks,
    addBook,
    updateBook,
    deleteBook,
  } = useLibrary();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [editingBook, setEditingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 6;

  const [onlineResults, setOnlineResults] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [isAddingOnlineId, setIsAddingOnlineId] = useState(null);

  useEffect(() => {
    const term = searchQuery.trim();
    let isCancelled = false;

    const timer = setTimeout(async () => {
      if (term.length < 3) {
        if (!isCancelled) {
          setOnlineResults([]);
          setIsSearchingOnline(false);
        }
        return;
      }

      setIsSearchingOnline(true);
      try {
        const res = await searchGoogleBooks(term, 6);
        if (!isCancelled) {
          const localTitles = new Set(books.map((b) => (b.title || '').toLowerCase().trim()));
          const distinct = (res || []).filter(
            (r) => !localTitles.has((r.title || '').toLowerCase().trim())
          );
          setOnlineResults(distinct);
        }
      } catch {
      } finally {
        if (!isCancelled) setIsSearchingOnline(false);
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, books, searchGoogleBooks]);

  const categoriesList = useMemo(() => {
    const set = new Set(books.map((b) => b.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [books]);

  const authorsList = useMemo(() => {
    const set = new Set(books.map((b) => b.author).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [books]);

  const filteredAndSortedBooks = useMemo(() => {
    return books
      .filter((b) => {
        const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
        const matchesAuthor = selectedAuthor === 'All' || b.author === selectedAuthor;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.isbn?.toLowerCase().includes(q) ||
          b.publisher?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q);

        return matchesCategory && matchesAuthor && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          const timeA = Number(a.createdAt) || Number(a.id) || 0;
          const timeB = Number(b.createdAt) || Number(b.id) || 0;
          return timeB - timeA;
        }
        if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'title-desc') return (b.title || '').localeCompare(a.title || '');
        if (sortBy === 'year-desc') return (Number(b.publishedYear) || 0) - (Number(a.publishedYear) || 0);
        if (sortBy === 'year-asc') return (Number(a.publishedYear) || 0) - (Number(b.publishedYear) || 0);
        if (sortBy === 'copies-desc') return (Number(b.availableCopies) || 0) - (Number(a.availableCopies) || 0);
        return 0;
      });
  }, [books, searchQuery, selectedCategory, selectedAuthor, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedBooks.length / booksPerPage));
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * booksPerPage;
    return filteredAndSortedBooks.slice(start, start + booksPerPage);
  }, [filteredAndSortedBooks, currentPage, booksPerPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedAuthor('All');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBook) return;
    setIsSubmitting(true);
    try {
      await deleteBook(deletingBook.id);
      toast.success(`"${deletingBook.title}" deleted successfully!`);
      setDeletingBook(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc] text-slate-800 flex font-sans">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {viewMode === 'add' && (
        <BookFormFullPage
          title="Add New Book to Catalog"
          subtitle="Catalog a new volume or search Google Books & Open Library with instant autocomplete"
          searchGoogleBooks={searchGoogleBooks}
          searchLocalBooks={searchLocalBooks}
          onBack={() => setViewMode('list')}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            try {
              await addBook(data);
              toast.success(`"${data.title}" added to catalog successfully!`);
              setViewMode('list');
              setSortBy('newest');
              setCurrentPage(1);
              setSearchQuery('');
            } catch (err) {
              toast.error(err.message || 'Failed to add book');
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {viewMode === 'edit' && editingBook && (
        <BookFormFullPage
          title="Edit Book Details"
          subtitle={`Update bibliographic records and inventory stock for "${editingBook.title}"`}
          searchGoogleBooks={searchGoogleBooks}
          searchLocalBooks={searchLocalBooks}
          defaultValues={editingBook}
          onBack={() => {
            setViewMode('list');
            setEditingBook(null);
          }}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            try {
              await updateBook(editingBook.id, data);
              toast.success(`"${data.title}" updated successfully!`);
              setViewMode('list');
              setEditingBook(null);
            } catch (err) {
              toast.error(err.message || 'Failed to update book');
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {viewMode === 'list' && (
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Book Management
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                    Library Catalog
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Manage, catalog, filter, and inspect your library books repository
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={refreshBooks}
                disabled={loading}
                title="Refresh Catalog Data"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setViewMode('add')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Book</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {deletingBook && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-rose-950">
                      Confirm Catalog Deletion: "{deletingBook.title}"?
                    </h4>
                    <p className="text-xs text-rose-700">
                      Are you sure you want to remove this book from the library catalog? This action will permanently delete the record.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setDeletingBook(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Deleting...' : 'Confirm Delete'}</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={refreshBooks}
                  className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-bold hover:bg-rose-100 transition cursor-pointer"
                >
                  Retry API Call
                </button>
              </div>
            )}

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by Title, Author, ISBN, Publisher..."
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-teal-500/15 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="md:col-span-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-600 focus:outline-none transition cursor-pointer"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        Category: {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <select
                    value={selectedAuthor}
                    onChange={(e) => {
                      setSelectedAuthor(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-600 focus:outline-none transition cursor-pointer"
                  >
                    {authorsList.map((auth) => (
                      <option key={auth} value={auth}>
                        Author: {auth}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-600 focus:outline-none transition cursor-pointer"
                  >
                    <option value="newest">Sort: Newly Added</option>
                    <option value="title-asc">Title: A to Z</option>
                    <option value="title-desc">Title: Z to A</option>
                    <option value="year-desc">Year: Newest to Oldest</option>
                    <option value="year-asc">Year: Oldest to Newest</option>
                    <option value="copies-desc">Available: High to Low</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <span>
                    Showing <strong className="text-slate-800">{filteredAndSortedBooks.length}</strong> of{' '}
                    <strong className="text-slate-800">{books.length}</strong> catalogued volumes
                  </span>
                  {(searchQuery || selectedCategory !== 'All' || selectedAuthor !== 'All') && (
                    <button
                      onClick={handleResetFilters}
                      className="text-teal-700 font-semibold hover:underline cursor-pointer"
                    >
                      Clear active filters
                    </button>
                  )}
                </div>
                {isSearchingOnline && (
                  <span className="text-teal-600 font-semibold flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Querying live Google Books catalog...
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="h-80 bg-white rounded-2xl border border-slate-200/80 animate-pulse p-5 space-y-4"
                  >
                    <div className="h-44 bg-slate-100 rounded-xl" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : filteredAndSortedBooks.length === 0 ? (
              onlineResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-teal-900">
                        No local match, but found online titles for "{searchQuery}"!
                      </h4>
                      <p className="text-xs text-teal-700">
                        Click "+ Add to Library" to catalog any of these live volumes into your collection immediately.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {onlineResults.map((obook) => (
                      <div
                        key={obook.id}
                        className="bg-white rounded-2xl border border-teal-200/90 p-4 shadow-sm flex flex-col justify-between space-y-3"
                      >
                        <div className="flex gap-3">
                          <img
                            src={obook.coverImage}
                            alt={obook.title}
                            className="w-16 h-24 object-cover rounded-lg shadow-sm shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = generateFallbackCover(obook.title, obook.author, obook.category);
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                              {obook.category}
                            </span>
                            <h4 className="font-extrabold text-xs text-slate-900 mt-1 line-clamp-2">
                              {obook.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">By {obook.author}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Year: {obook.publishedYear}</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            setIsAddingOnlineId(obook.id);
                            try {
                              await addBook(obook);
                              toast.success(`"${obook.title}" added to your catalog!`);
                              setOnlineResults((prev) => prev.filter((b) => b.id !== obook.id));
                            } catch (err) {
                              toast.error(err.message || 'Failed to add book');
                            } finally {
                              setIsAddingOnlineId(null);
                            }
                          }}
                          disabled={isAddingOnlineId === obook.id}
                          className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isAddingOnlineId === obook.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          <span>+ Add to Library</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">No books found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No volumes match your current search or filter criteria. Try adjusting your query or add a new volume.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => setViewMode('add')}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      + Add Book
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedBooks.map((book) => {
                  const avail = Number(book.availableCopies) || 0;
                  const total = Number(book.totalCopies) || 1;
                  const availPct = Math.min(100, Math.round((avail / total) * 100));

                  return (
                    <div
                      key={book.id}
                      className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-300 shadow-2xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
                    >
                      <div>
                        <Link
                          to={`/books/${book.id}`}
                          className="relative h-60 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-3 overflow-hidden cursor-pointer group/cover block"
                          title={`View Details for ${book.title}`}
                        >
                          <img
                            src={book.coverImage || getVerifiedCover(book.title, book.isbn, book.author, book.category)}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />

                          <div className="relative z-10 h-full max-h-[220px] aspect-[2/3] transition-transform duration-300 group-hover/cover:scale-105 flex items-center justify-center">
                            <img
                              src={book.coverImage || getVerifiedCover(book.title, book.isbn, book.author, book.category)}
                              alt={book.title}
                              className="w-full h-full object-contain rounded-md shadow-2xl ring-1 ring-white/20 bg-slate-900"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = generateFallbackCover(book.title, book.author, book.category);
                              }}
                            />
                            <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none rounded-l-md" />
                          </div>

                          <div className="absolute top-3 left-3 z-20">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900/80 text-white border border-white/15 backdrop-blur-md">
                              {book.category}
                            </span>
                          </div>

                          <div className="absolute bottom-3 right-3 z-20">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold backdrop-blur-md shadow-sm border ${
                                avail > 0
                                  ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500/40'
                                  : 'bg-rose-900/80 text-rose-200 border-rose-500/40'
                              }`}
                            >
                              {avail > 0 ? `${avail} In Stock` : 'Out of Stock'}
                            </span>
                          </div>
                        </Link>

                        <div className="p-4 space-y-2">
                          <div>
                            <Link
                              to={`/books/${book.id}`}
                              className="font-extrabold text-sm text-slate-900 hover:text-teal-700 transition line-clamp-1 cursor-pointer block"
                            >
                              {book.title}
                            </Link>
                            <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                              By {book.author}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <span className="font-mono text-slate-400 truncate max-w-[130px]">
                              ISBN: {book.isbn || 'N/A'}
                            </span>
                            <span>Year: {book.publishedYear}</span>
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>Availability</span>
                              <span className="font-bold text-slate-700">
                                {avail} / {total} copies
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  avail === 0 ? 'bg-rose-500' : avail < 3 ? 'bg-amber-500' : 'bg-teal-600'
                                }`}
                                style={{ width: `${availPct}%` }}
                              />
                            </div>
                          </div>

                          <p
                            className="text-xs text-slate-600 line-clamp-2 leading-relaxed"
                            title={book.description}
                          >
                            {book.description || 'No summary provided.'}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                        <Link
                          to={`/books/${book.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition group/link border border-teal-200/80"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-3.5 h-3.5 transition-transform group/link:translate-x-0.5" />
                        </Link>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingBook(book);
                              setViewMode('edit');
                            }}
                            title="Edit Book Details"
                            className="p-2 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingBook(book)}
                            title="Delete Book"
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredAndSortedBooks.length > booksPerPage && (
              <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
                  <strong className="text-slate-800">{totalPages}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                          currentPage === i + 1
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

const CURRENT_YEAR = new Date().getFullYear();

const BookFormFullPage = ({
  title,
  subtitle,
  defaultValues,
  searchGoogleBooks,
  searchLocalBooks,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  const [searchInput, setSearchInput] = useState(defaultValues?.title || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(defaultValues || null);

  const dropdownRef = useRef(null);

  const [previewData, setPreviewData] = useState({
    title: defaultValues?.title || '',
    author: defaultValues?.author || '',
    isbn: defaultValues?.isbn || '',
    category: defaultValues?.category || 'General',
    publishedYear: defaultValues?.publishedYear || 2024,
    totalCopies: defaultValues?.totalCopies || 10,
    availableCopies: defaultValues?.availableCopies || 10,
    coverImage: defaultValues?.coverImage || '',
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues || {
      title: '',
      author: '',
      isbn: '',
      publisher: '',
      category: 'General',
      publishedYear: 2024,
      totalCopies: 10,
      availableCopies: 10,
      coverImage: '',
      description: '',
    },
  });

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    setValue('title', val);
    setPreviewData((prev) => ({ ...prev, title: val }));

    if (selectedBook && selectedBook.title !== val) {
      setSelectedBook(null);
    }

    if (!val.trim()) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    if (searchLocalBooks) {
      const instant = searchLocalBooks(val, 8);
      if (instant.length > 0) {
        setSuggestions(instant);
        setIsDropdownOpen(true);
      }
    }
  };

  useEffect(() => {
    if (selectedBook && selectedBook.title === searchInput) {
      return;
    }

    const term = searchInput.trim();
    if (!term) return;

    let isCancelled = false;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (searchGoogleBooks) {
          const results = await searchGoogleBooks(term, 8);
          if (!isCancelled && results && results.length > 0) {
            setSuggestions(results);
            setIsDropdownOpen(true);
          }
        }
      } catch {
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchInput, selectedBook, searchGoogleBooks]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setSearchInput(book.title);
    setIsDropdownOpen(false);

    setValue('title', book.title, { shouldValidate: true });
    setValue('author', book.author, { shouldValidate: true });
    setValue('isbn', book.isbn, { shouldValidate: true });
    setValue('publisher', book.publisher || 'Independent Press', { shouldValidate: true });
    setValue('category', book.category || 'General', { shouldValidate: true });
    setValue('publishedYear', Number(book.publishedYear) || CURRENT_YEAR, {
      shouldValidate: true,
    });
    setValue('coverImage', book.coverImage || '', { shouldValidate: true });
    setValue('description', book.description || '', { shouldValidate: true });
    setValue('totalCopies', Number(book.totalCopies) || 10, { shouldValidate: true });
    setValue('availableCopies', Number(book.availableCopies) || 10, { shouldValidate: true });

    setPreviewData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publisher: book.publisher || 'Independent Press',
      category: book.category || 'General',
      publishedYear: Number(book.publishedYear) || CURRENT_YEAR,
      coverImage: book.coverImage || '',
      description: book.description || '',
      totalCopies: Number(book.totalCopies) || 10,
      availableCopies: Number(book.availableCopies) || 10,
    });

    toast.info(`Selected "${book.title}"`);
  };

  const handleResetSelection = () => {
    setSelectedBook(null);
    setSearchInput('');
    setValue('title', '');
    setSuggestions([]);
    setIsDropdownOpen(false);
    setPreviewData({
      title: '',
      author: '',
      isbn: '',
      publisher: '',
      category: 'General',
      publishedYear: CURRENT_YEAR,
      coverImage: '',
      description: '',
      totalCopies: 10,
      availableCopies: 10,
    });
  };

  const previewCover =
    previewData.coverImage ||
    getVerifiedCover(previewData.title, previewData.isbn, previewData.author, previewData.category);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back to Books</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {title}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">{subtitle}</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="relative" ref={dropdownRef}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>Search & Select Book Title (Instant Single-Letter Search) *</span>
                    </label>
                    {isSearching && (
                      <span className="text-[11px] text-teal-600 font-semibold animate-pulse">
                        Searching online & catalog...
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (searchInput.trim() && !selectedBook) {
                          if (searchLocalBooks) {
                            const instant = searchLocalBooks(searchInput.trim(), 8);
                            if (instant.length > 0) {
                              setSuggestions(instant);
                              setIsDropdownOpen(true);
                            }
                          }
                        }
                      }}
                      placeholder="Type any letter (e.g. H for Harry Potter, A for Atomic Habits, W for Wings of Fire)..."
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-teal-600 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-teal-500/15 transition"
                    />

                    {searchInput && (
                      <button
                        type="button"
                        onClick={handleResetSelection}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isDropdownOpen && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-slate-100">
                      <div className="px-3.5 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 flex items-center justify-between">
                        <span>Suggested Matches ({suggestions.length})</span>
                        <span>Click to auto-fill</span>
                      </div>

                      {suggestions.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectBook(item)}
                          className="flex items-center gap-3 p-3 hover:bg-teal-50 transition cursor-pointer group"
                        >
                          <img
                            src={item.coverImage || getVerifiedCover(item.title, item.isbn, item.author, item.category)}
                            alt={item.title}
                            className="w-9 h-12 object-cover rounded shadow-2xs shrink-0 group-hover:scale-105 transition"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = generateFallbackCover(item.title, item.author, item.category);
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-xs text-slate-900 truncate group-hover:text-teal-700">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">
                              By {item.author} • {item.publishedYear}
                            </p>
                            <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Author Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. J.K. Rowling"
                      {...register('author', { required: 'Author is required' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-medium"
                    />
                    {errors.author && <p className="text-rose-500 text-[11px] mt-1">{errors.author.message}</p>}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Publisher *</label>
                    <input
                      type="text"
                      placeholder="e.g. Scholastic"
                      {...register('publisher', { required: 'Publisher is required' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-medium"
                    />
                    {errors.publisher && <p className="text-rose-500 text-[11px] mt-1">{errors.publisher.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">ISBN-13 Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 978-0439708180"
                      {...register('isbn', { required: 'ISBN is required' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 font-mono text-xs"
                    />
                    {errors.isbn && <p className="text-rose-500 text-[11px] mt-1">{errors.isbn.message}</p>}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Category *</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science, Fiction, Science"
                      {...register('category', { required: 'Category is required' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-medium"
                    />
                    {errors.category && <p className="text-rose-500 text-[11px] mt-1">{errors.category.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Published Year *</label>
                    <input
                      type="number"
                      min="1800"
                      max="2030"
                      {...register('publishedYear', { required: true })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Total Copies *</label>
                    <input
                      type="number"
                      min="1"
                      {...register('totalCopies', { required: true, min: 1 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Available Copies *</label>
                    <input
                      type="number"
                      min="0"
                      {...register('availableCopies', { required: true, min: 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Cover Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    {...register('coverImage')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Book Description & Synopsis</label>
                  <textarea
                    rows={4}
                    placeholder="Enter academic synopsis or summary..."
                    {...register('description')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" />
                    Live Catalog Preview
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    Real-time
                  </span>
                </div>

                <div className="h-64 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden">
                  <img
                    src={previewCover}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <img
                    src={previewCover}
                    alt="Cover preview"
                    className="h-full aspect-[2/3] object-contain rounded-lg shadow-2xl relative z-10 ring-1 ring-white/20 bg-slate-900"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = generateFallbackCover(
                        previewData.title || 'Preview Title',
                        previewData.author || 'Author',
                        previewData.category || 'General'
                      );
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                      {previewData.category || 'General'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {previewData.publishedYear || CURRENT_YEAR}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 truncate">
                    {previewData.title || 'Untitled Volume'}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    By {previewData.author || 'Unknown Author'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    ISBN: {previewData.isbn || '000-0000000000'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Stock Availability</span>
                  <span className="font-extrabold text-emerald-700">
                    {previewData.availableCopies || 0} / {previewData.totalCopies || 10} Copies
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 cursor-pointer flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving to Catalog...' : 'Save Book to Catalog'}</span>
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel & Return to Books
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
