import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Sparkles,
  Tag,
  BookCopy,
  FolderPlus,
  Layers,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Sidebar } from '../components/Sidebar';
import {
  SEARCH_SCOPES,
  getCategoryColorClasses,
  renderCategoryIcon,
  CategoryAddFullPage,
  CategoryEditFullPage,
  CategoryDeleteFullPage,
} from '../components/CategoryManager';
import { BookFormFullPage } from '../components/BookForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
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
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useLibrary();

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() =>
    searchParams.get('tab') === 'categories' ? 'categories' : 'books'
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [editingBook, setEditingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchScope, setSearchScope] = useState('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
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

  const categoryBookCounts = useMemo(() => {
    const map = {};
    books.forEach((b) => {
      const norm = (b.category || 'General').toLowerCase().trim();
      map[norm] = (map[norm] || 0) + 1;
    });
    return map;
  }, [books]);

  const categoriesList = useMemo(() => {
    const fromCtx = (categories || []).map((c) => c.name);
    const fromBooks = books.map((b) => b.category).filter(Boolean);
    const set = new Set([...fromCtx, ...fromBooks]);
    return ['All', ...Array.from(set)];
  }, [categories, books]);

  const authorsList = useMemo(() => {
    const set = new Set(books.map((b) => b.author).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [books]);

  const filteredCategories = useMemo(() => {
    const q = categorySearchQuery.toLowerCase().trim();
    if (!q) return categories || [];
    return (categories || []).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, categorySearchQuery]);

  const filteredAndSortedBooks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cleanDigitsQ = searchQuery.replace(/[-\s]/g, '').toLowerCase().trim();

    return books
      .filter((b) => {
        const matchesCategory =
          selectedCategory === 'All' ||
          (b.category || '').toLowerCase().trim() === selectedCategory.toLowerCase().trim();
        const matchesAuthor = selectedAuthor === 'All' || b.author === selectedAuthor;

        if (!q) {
          return matchesCategory && matchesAuthor;
        }

        let matchesSearch = false;
        if (searchScope === 'title') {
          matchesSearch = (b.title || '').toLowerCase().includes(q);
        } else if (searchScope === 'author') {
          matchesSearch = (b.author || '').toLowerCase().includes(q);
        } else if (searchScope === 'isbn') {
          const cleanBookIsbn = (b.isbn || '').replace(/[-\s]/g, '').toLowerCase();
          matchesSearch =
            cleanBookIsbn.includes(cleanDigitsQ) || (b.isbn || '').toLowerCase().includes(q);
        } else {
          const cleanBookIsbn = (b.isbn || '').replace(/[-\s]/g, '').toLowerCase();
          matchesSearch =
            (b.title || '').toLowerCase().includes(q) ||
            (b.author || '').toLowerCase().includes(q) ||
            cleanBookIsbn.includes(cleanDigitsQ) ||
            (b.isbn || '').toLowerCase().includes(q) ||
            (b.publisher || '').toLowerCase().includes(q) ||
            (b.category || '').toLowerCase().includes(q) ||
            (b.description || '').toLowerCase().includes(q);
        }

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
        if (sortBy === 'year-desc')
          return (Number(b.publishedYear) || 0) - (Number(a.publishedYear) || 0);
        if (sortBy === 'year-asc')
          return (Number(a.publishedYear) || 0) - (Number(b.publishedYear) || 0);
        if (sortBy === 'copies-desc')
          return (Number(b.availableCopies) || 0) - (Number(a.availableCopies) || 0);
        return 0;
      });
  }, [books, searchQuery, searchScope, selectedCategory, selectedAuthor, sortBy]);

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

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      toast.success(`Category "${categoryToDelete.name}" deleted successfully!`);
      setCategoryToDelete(null);
      setActiveTab('categories');
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeScopeObj = SEARCH_SCOPES.find((s) => s.id === searchScope) || SEARCH_SCOPES[0];

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc] text-slate-800 flex font-sans">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {viewMode === 'add' && (
        <BookFormFullPage
          title="Add New Book to Catalog"
          subtitle="Catalog a new volume or search Google Books & Open Library with instant autocomplete"
          searchGoogleBooks={searchGoogleBooks}
          searchLocalBooks={searchLocalBooks}
          categories={categories}
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
          categories={categories}
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

      {viewMode === 'add-category' && (
        <CategoryAddFullPage
          onBack={() => setViewMode('list')}
          onAdd={async (catData) => {
            setIsSubmitting(true);
            try {
              const res = await addCategory(catData);
              toast.success(`Category "${res.name}" added successfully!`);
              setViewMode('list');
              setActiveTab('categories');
            } catch (err) {
              toast.error(err.message || 'Failed to add category');
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {viewMode === 'edit-category' && categoryToEdit && (
        <CategoryEditFullPage
          category={categoryToEdit}
          assignedCount={categoryBookCounts[categoryToEdit.name.toLowerCase().trim()] || 0}
          onBack={() => {
            setCategoryToEdit(null);
            setViewMode('list');
          }}
          onUpdate={async (catData) => {
            setIsSubmitting(true);
            try {
              const res = await updateCategory(categoryToEdit.id, catData);
              toast.success(`Category "${res.name}" updated successfully!`);
              setCategoryToEdit(null);
              setViewMode('list');
              setActiveTab('categories');
            } catch (err) {
              toast.error(err.message || 'Failed to update category');
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {viewMode === 'delete-category' && categoryToDelete && (
        <CategoryDeleteFullPage
          category={categoryToDelete}
          assignedCount={categoryBookCounts[categoryToDelete.name.toLowerCase().trim()] || 0}
          onBack={() => {
            setCategoryToDelete(null);
            setViewMode('list');
          }}
          onDelete={async () => {
            setIsSubmitting(true);
            try {
              await deleteCategory(categoryToDelete.id);
              toast.success(`Category "${categoryToDelete.name}" deleted! Books safely moved to General.`);
              setCategoryToDelete(null);
              setViewMode('list');
              setActiveTab('categories');
            } catch (err) {
              toast.error(err.message || 'Failed to delete category');
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
                className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Catalog & Categories
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                    Central LMS
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Search across titles, authors, and ISBNs, manage subject taxonomies, and filter catalog
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
                onClick={() => setViewMode('add-category')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Category</span>
              </button>

              <button
                onClick={() => setViewMode('add')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Book</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            <ConfirmDialog
              isOpen={Boolean(deletingBook)}
              title="Confirm Book Deletion"
              itemName={deletingBook?.title}
              message="Are you sure you want to remove this book from the library catalog? This action will permanently delete the record."
              confirmLabel="Confirm Delete"
              isSubmitting={isSubmitting}
              onConfirm={handleConfirmDelete}
              onClose={() => setDeletingBook(null)}
            />

            <ConfirmDialog
              isOpen={Boolean(categoryToDelete && viewMode !== 'delete-category')}
              title="Confirm Category Deletion"
              itemName={categoryToDelete?.name}
              message={`Are you sure you want to delete the "${categoryToDelete?.name}" category? Any assigned books will be safely moved to General.`}
              confirmLabel="Confirm Delete"
              isSubmitting={isSubmitting}
              onConfirm={handleConfirmDeleteCategory}
              onClose={() => setCategoryToDelete(null)}
            />

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

            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl text-xs w-fit overflow-x-auto shadow-2xs border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('books');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'books'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookCopy className="w-4 h-4 text-teal-600" />
                <span>Books Catalog ({books.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('categories');
                  setCategorySearchQuery('');
                }}
                className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'categories'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Category Management ({categories.length})</span>
              </button>
            </div>

            {activeTab === 'categories' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                        Total Categories
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{categories.length}</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                        Active Taxonomies
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Subject classifications</span>
                  </div>

                  <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                        Catalogued Volumes
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                        <BookCopy className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{books.length}</span>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                        Distributed
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Books in database</span>
                  </div>

                  <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/50 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                        Primary Classification
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-black text-slate-900 truncate">
                        {categories.reduce(
                          (max, c) =>
                            (categoryBookCounts[c.name.toLowerCase().trim()] || 0) >
                            (categoryBookCounts[max?.name?.toLowerCase()?.trim()] || 0)
                              ? c
                              : max,
                          categories[0]
                        )?.name || 'Computer Science'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Highest volume concentration</span>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      placeholder="Search categories by name or description..."
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-teal-500/15 transition"
                    />
                    {categorySearchQuery && (
                      <button
                        onClick={() => setCategorySearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewMode('add-category')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/20 transition cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Add New Category</span>
                  </button>
                </div>

                {filteredCategories.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">No categories found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No classification matched "{categorySearchQuery}". Try clearing search or add a new category.
                    </p>
                    <button
                      onClick={() => setCategorySearchQuery('')}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      Reset Category Search
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCategories.map((cat) => {
                      const count = categoryBookCounts[cat.name.toLowerCase().trim()] || 0;
                      const color = getCategoryColorClasses(cat.color);

                      return (
                        <div
                          key={cat.id || cat.name}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-300 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl ${color.bg} ${color.border} border flex items-center justify-center ${color.text} shrink-0`}
                                >
                                  {renderCategoryIcon(cat.icon, 'w-4 h-4')}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                    {cat.name}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                                    ID: {cat.id}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${color.badge}`}
                              >
                                {count} {count === 1 ? 'Volume' : 'Volumes'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                              {cat.description ||
                                'General subject taxonomy and classification for library volumes.'}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat.name);
                                setActiveTab('books');
                                setCurrentPage(1);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>View Books ({count})</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setCategoryToEdit(cat);
                                  setViewMode('edit-category');
                                }}
                                title="Edit Category"
                                className="p-1.5 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setCategoryToDelete(cat)}
                                title="Delete Category"
                                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
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
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      Search Scope:
                    </span>
                    {SEARCH_SCOPES.map((scope) => {
                      const ScopeIcon = scope.icon;
                      const isActive = searchScope === scope.id;
                      return (
                        <button
                          key={scope.id}
                          type="button"
                          onClick={() => {
                            setSearchScope(scope.id);
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                            isActive
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                          }`}
                        >
                          <ScopeIcon className="w-3.5 h-3.5" />
                          <span>{scope.label}</span>
                        </button>
                      );
                    })}
                  </div>

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
                        placeholder={activeScopeObj.placeholder}
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

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-teal-600" />
                        <span>Filter by Category ({categories.length})</span>
                      </span>
                      {selectedCategory !== 'All' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('All');
                            setCurrentPage(1);
                          }}
                          className="text-[11px] font-bold text-teal-600 hover:text-teal-800 cursor-pointer"
                        >
                          Reset Category Filter
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('All');
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          selectedCategory === 'All'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                        }`}
                      >
                        <span>All Volumes</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                            selectedCategory === 'All'
                              ? 'bg-teal-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {books.length}
                        </span>
                      </button>

                      {categories.map((cat) => {
                        const count = categoryBookCounts[cat.name.toLowerCase().trim()] || 0;
                        const isSelected =
                          selectedCategory.toLowerCase() === cat.name.toLowerCase();
                        const color = getCategoryColorClasses(cat.color);

                        return (
                          <button
                            key={cat.id || cat.name}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.name);
                              setCurrentPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : `${color.bg} ${color.text} ${color.border} hover:brightness-95`
                            }`}
                          >
                            {renderCategoryIcon(cat.icon, 'w-3 h-3')}
                            <span>{cat.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                                isSelected ? 'bg-slate-800 text-white' : 'bg-white/80 text-slate-800'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <span>
                        Showing <strong className="text-slate-800">{filteredAndSortedBooks.length}</strong>{' '}
                        of <strong className="text-slate-800">{books.length}</strong> catalogued volumes
                      </span>
                      {searchQuery && (
                        <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md font-bold text-[10px] border border-teal-200">
                          {activeScopeObj.label}: "{searchQuery}"
                        </span>
                      )}
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
                                  e.target.src = generateFallbackCover(
                                    obook.title,
                                    obook.author,
                                    obook.category
                                  );
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                                  {obook.category}
                                </span>
                                <h4 className="font-extrabold text-xs text-slate-900 mt-1 line-clamp-2">
                                  {obook.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  By {obook.author}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Year: {obook.publishedYear}
                                </p>
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
                      const verifiedCover =
                        book.coverImage ||
                        getVerifiedCover(book.title, book.isbn, book.author, book.category);

                      return (
                        <div
                          key={book.id}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-300 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                        >
                          <div className="space-y-4">
                            <div className="relative aspect-[3/4] w-full max-h-56 bg-slate-900 rounded-xl overflow-hidden shadow-xs flex items-center justify-center">
                              <img
                                src={verifiedCover}
                                alt={book.title}
                                className="w-full h-full object-contain group-hover:scale-102 transition duration-300"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = generateFallbackCover(
                                    book.title,
                                    book.author,
                                    book.category
                                  );
                                }}
                              />
                              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                                  {book.category}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h3
                                className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-teal-700 transition"
                                title={book.title}
                              >
                                {book.title}
                              </h3>
                              <p className="text-xs text-slate-500 font-medium truncate">
                                By {book.author}
                              </p>
                              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                                <span>ISBN: {book.isbn}</span>
                                <span>•</span>
                                <span>{book.publishedYear}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-xs">
                              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                                Available Copies
                              </span>
                              <span
                                className={`font-extrabold ${
                                  Number(book.availableCopies || 0) > 0
                                    ? 'text-teal-700'
                                    : 'text-rose-600'
                                }`}
                              >
                                {book.availableCopies || 0} / {book.totalCopies || 1}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {Number(book.availableCopies || 0) > 0 && (
                                <Link
                                  to={`/circulation?action=issue&bookId=${book.id}`}
                                  title="Issue Volume to Member"
                                  className="p-2 rounded-xl text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                </Link>
                              )}

                              <Link
                                to={`/books/${book.id}`}
                                title="View Details"
                                className="p-2 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                onClick={() => {
                                  setEditingBook(book);
                                  setViewMode('edit');
                                }}
                                title="Edit Book"
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
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};
