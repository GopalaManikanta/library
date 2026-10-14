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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 6;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Book</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
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

              <div className="md:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-3 focus:ring-teal-500/15 transition cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {categoriesList
                    .filter((c) => c !== 'All')
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
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
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-3 focus:ring-teal-500/15 transition cursor-pointer"
                >
                  <option value="All">All Authors</option>
                  {authorsList
                    .filter((a) => a !== 'All')
                    .map((auth) => (
                      <option key={auth} value={auth}>
                        {auth}
                      </option>
                    ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-3 focus:ring-teal-500/15 transition cursor-pointer"
                >
                  <option value="newest">Recently Added (First)</option>
                  <option value="title-asc">Title (A - Z)</option>
                  <option value="title-desc">Title (Z - A)</option>
                  <option value="year-desc">Year (Newest)</option>
                  <option value="year-asc">Year (Oldest)</option>
                  <option value="copies-desc">Most Available</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Found <strong className="text-slate-900">{filteredAndSortedBooks.length}</strong> matching books in catalog
              </span>

              {(searchQuery || selectedCategory !== 'All' || selectedAuthor !== 'All' || sortBy !== 'newest') && (
                <button
                  onClick={handleResetFilters}
                  className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse">
                  <div className="w-full h-48 bg-slate-200 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : paginatedBooks.length === 0 ? (
            isSearchingOnline ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
                <h3 className="text-base font-extrabold text-slate-900">Searching Open Library Database...</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Searching live global catalog for "{searchQuery}"
                </p>
              </div>
            ) : onlineResults.length > 0 ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-teal-900">
                      Found {onlineResults.length} books in Open Library API matching "{searchQuery}"
                    </span>
                  </div>
                  <span className="text-[11px] text-teal-700 font-semibold">Click + Add to Library to import</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {onlineResults.map((obook) => (
                    <div
                      key={obook.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:border-teal-300 shadow-2xs hover:shadow-md transition space-y-3"
                    >
                      <div className="flex gap-3">
                        <img
                          src={obook.coverImage || getVerifiedCover(obook.title, obook.isbn, obook.author, obook.category)}
                          alt={obook.title}
                          className="w-16 h-24 object-cover rounded-xl shadow-sm shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = generateFallbackCover(obook.title, obook.author, obook.category);
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                            {obook.category || 'Open Library'}
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
                    onClick={() => setIsAddModalOpen(true)}
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
                          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-125 pointer-events-none"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />

                        <div className="relative z-10 h-50 max-w-[155px] aspect-[2/3] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1">
                          <img
                            src={book.coverImage || getVerifiedCover(book.title, book.isbn, book.author, book.category)}
                            alt={book.title}
                            className="h-full w-auto max-w-full object-contain rounded-md shadow-2xl ring-1 ring-white/20"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = generateFallbackCover(book.title, book.author, book.category);
                            }}
                          />
                        </div>

                        <div className="absolute top-2.5 left-2.5 z-20">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-black/60 backdrop-blur-md text-teal-300 border border-teal-500/20 shadow-sm">
                            {book.category}
                          </span>
                        </div>

                        <div className="absolute top-2.5 right-2.5 z-20">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-slate-300 border border-white/10">
                            {book.publishedYear}
                          </span>
                        </div>

                        <div className="absolute bottom-2.5 inset-x-0 flex justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <span className="px-3 py-1 rounded-full bg-teal-600/95 text-white text-[11px] font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
                            <ExternalLink className="w-3 h-3" />
                            View Details
                          </span>
                        </div>
                      </Link>

                      <div className="p-4 space-y-3">
                        <div>
                          <Link
                            to={`/books/${book.id}`}
                            className="font-extrabold text-sm text-slate-900 line-clamp-1 hover:text-teal-700 transition block"
                            title={book.title}
                          >
                            {book.title}
                          </Link>
                          <p className="text-xs text-teal-700 font-semibold mt-0.5 truncate">
                            By {book.author}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span className="truncate max-w-[150px]">
                            Pub: <strong className="text-slate-700">{book.publisher}</strong>
                          </span>
                          <span className="font-mono text-slate-400">
                            ISBN: {book.isbn ? book.isbn.slice(-8) : 'N/A'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-600">Stock Availability</span>
                            <span className={avail > 0 ? 'text-teal-700' : 'text-rose-600'}>
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
                          onClick={() => setEditingBook(book)}
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

          {totalPages > 1 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <p className="text-slate-500">
                Showing{' '}
                <strong className="text-slate-800">
                  {(currentPage - 1) * booksPerPage + 1}-
                  {Math.min(currentPage * booksPerPage, filteredAndSortedBooks.length)}
                </strong>{' '}
                of <strong className="text-slate-800">{filteredAndSortedBooks.length}</strong> books
              </p>

              <div className="flex items-center gap-1 self-center sm:self-auto">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                        currentPage === pg
                          ? 'bg-teal-600 text-white shadow-xs'
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
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {onlineResults.length > 0 && paginatedBooks.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-extrabold text-slate-900">
                    More Results from Open Library API ({onlineResults.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Click + Add to Library to import</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {onlineResults.map((obook) => (
                  <div
                    key={obook.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:border-teal-300 shadow-2xs hover:shadow-md transition space-y-3"
                  >
                    <div className="flex gap-3">
                      <img
                        src={obook.coverImage || getVerifiedCover(obook.title, obook.isbn, obook.author, obook.category)}
                        alt={obook.title}
                        className="w-16 h-24 object-cover rounded-xl shadow-sm shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = generateFallbackCover(obook.title, obook.author, obook.category);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                          {obook.category || 'Open Library'}
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
          )}
        </main>
      </div>

      {isAddModalOpen && (
        <BookFormModal
          title="Add New Book to Catalog"
          searchGoogleBooks={searchGoogleBooks}
          searchLocalBooks={searchLocalBooks}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            try {
              await addBook(data);
              toast.success(`"${data.title}" added to catalog successfully!`);
              setIsAddModalOpen(false);
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

      {editingBook && (
        <BookFormModal
          title="Edit Book Details"
          searchGoogleBooks={searchGoogleBooks}
          searchLocalBooks={searchLocalBooks}
          defaultValues={editingBook}
          onClose={() => setEditingBook(null)}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            try {
              await updateBook(editingBook.id, data);
              toast.success(`"${data.title}" updated successfully!`);
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

      {deletingBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Delete Book?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-800">"{deletingBook.title}"</strong> from the library catalog? This action will sync with the API and update the inventory.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBook(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CURRENT_YEAR = new Date().getFullYear();

const BookFormModal = ({
  title,
  defaultValues,
  searchGoogleBooks,
  searchLocalBooks,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [searchInput, setSearchInput] = useState(defaultValues?.title || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(defaultValues || null);

  const dropdownRef = useRef(null);

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

    toast.info(`Selected "${book.title}"`);
  };

  const handleResetSelection = () => {
    setSelectedBook(null);
    setSearchInput('');
    setValue('title', '');
    setSuggestions([]);
    setIsDropdownOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
            <p className="text-[11px] text-slate-500">
              Type any letter to search books, then click to select and save
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Search Book Title (Single Letter Instant Search) *</span>
              </label>
              {isSearching && (
                <span className="text-[11px] text-teal-600 font-semibold animate-pulse">
                  Searching books...
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
                placeholder="Type even 1 letter (e.g. H for Harry Potter, W for Wings of Fire)..."
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
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-slate-100">
                <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 flex items-center justify-between">
                  <span>Suggested Books ({suggestions.length})</span>
                  <span>Click to select</span>
                </div>

                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectBook(item)}
                    className="flex items-center gap-3 p-2.5 hover:bg-teal-50 transition cursor-pointer group"
                  >
                    <img
                      src={item.coverImage || getVerifiedCover(item.title, item.isbn, item.author, item.category)}
                      alt={item.title}
                      className="w-8 h-11 object-cover rounded shadow-2xs shrink-0 group-hover:scale-105 transition"
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

          {selectedBook && (
            <div className="p-3.5 bg-teal-50/80 rounded-2xl border border-teal-200 flex items-start gap-3.5">
              <img
                src={selectedBook.coverImage || getVerifiedCover(selectedBook.title, selectedBook.isbn, selectedBook.author, selectedBook.category)}
                alt={selectedBook.title}
                className="w-14 h-20 object-cover rounded-xl shadow-md border border-teal-200/80 shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = generateFallbackCover(selectedBook.title, selectedBook.author, selectedBook.category);
                }}
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-600 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Selected Book
                  </span>
                  <button
                    type="button"
                    onClick={handleResetSelection}
                    className="text-[11px] font-bold text-teal-800 hover:underline cursor-pointer"
                  >
                    Change Book
                  </button>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 truncate">
                  {selectedBook.title}
                </h4>
                <p className="text-[11px] text-slate-600 font-medium">
                  Author: <strong className="text-slate-800">{selectedBook.author}</strong> | Year: {selectedBook.publishedYear}
                </p>
                <p className="text-[10px] text-slate-500 font-mono truncate">
                  ISBN: {selectedBook.isbn} | Pub: {selectedBook.publisher}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Author Name *</label>
              <input
                type="text"
                placeholder="e.g. J.K. Rowling"
                {...register('author', { required: 'Author is required' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              />
              {errors.author && <p className="text-rose-500 mt-1">{errors.author.message}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Publisher *</label>
              <input
                type="text"
                placeholder="e.g. Scholastic"
                {...register('publisher', { required: 'Publisher is required' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              />
              {errors.publisher && <p className="text-rose-500 mt-1">{errors.publisher.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ISBN Number *</label>
              <input
                type="text"
                placeholder="e.g. 978-0439708180"
                {...register('isbn', { required: 'ISBN is required' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 font-mono"
              />
              {errors.isbn && <p className="text-rose-500 mt-1">{errors.isbn.message}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                placeholder="e.g. Fantasy & Fiction"
                {...register('category', { required: 'Category is required' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              />
              {errors.category && <p className="text-rose-500 mt-1">{errors.category.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Published Year *</label>
              <input
                type="number"
                min="1800"
                max="2030"
                {...register('publishedYear', { required: true })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Copies *</label>
              <input
                type="number"
                min="1"
                {...register('totalCopies', { required: true, min: 1 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Available Copies *</label>
              <input
                type="number"
                min="0"
                {...register('availableCopies', { required: true, min: 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cover Image URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              {...register('coverImage')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Book Description</label>
            <textarea
              rows={3}
              placeholder="Enter synopsis or summary..."
              {...register('description')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Book'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
