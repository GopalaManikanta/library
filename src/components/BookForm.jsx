import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Search, X, CheckCircle2 } from 'lucide-react';
import { getVerifiedCover, generateFallbackCover } from '../services/bookService';

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_EMPTY_CATEGORIES = [];

export const BookForm = ({
  title,
  subtitle,
  defaultValues,
  categories = DEFAULT_EMPTY_CATEGORIES,
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
    publishedYear: defaultValues?.publishedYear || CURRENT_YEAR,
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
      publishedYear: CURRENT_YEAR,
      totalCopies: 10,
      availableCopies: 10,
      coverImage: '',
      description: '',
    },
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const term = searchInput.trim();
    if (!term || selectedBook) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (searchLocalBooks) {
          const instant = searchLocalBooks(term, 6);
          if (instant && instant.length > 0) {
            setSuggestions(instant);
            setIsDropdownOpen(true);
          }
        }

        if (term.length >= 3 && searchGoogleBooks) {
          const external = await searchGoogleBooks(term, 8);
          if (external && external.length > 0) {
            setSuggestions((prev) => {
              const prevTitles = new Set(prev.map((p) => p.title.toLowerCase().trim()));
              const filteredExternal = external.filter(
                (e) => !prevTitles.has(e.title.toLowerCase().trim())
              );
              return [...prev, ...filteredExternal].slice(0, 8);
            });
            setIsDropdownOpen(true);
          }
        }
      } catch {
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchInput, selectedBook, searchLocalBooks, searchGoogleBooks]);

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setSearchInput(book.title);
    setSuggestions([]);
    setIsDropdownOpen(false);

    setValue('title', book.title);
    setValue('author', book.author);
    setValue('isbn', book.isbn);
    setValue('publisher', book.publisher || 'Independent Press');
    setValue('category', book.category || 'General');
    setValue('publishedYear', Number(book.publishedYear) || CURRENT_YEAR);
    setValue('description', book.description || `${book.title} by ${book.author}`);
    setValue('coverImage', book.coverImage || '');

    setPreviewData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category || 'General',
      publishedYear: Number(book.publishedYear) || CURRENT_YEAR,
      totalCopies: 10,
      availableCopies: 10,
      coverImage: book.coverImage || '',
    });
  };

  const handleResetSelection = () => {
    setSelectedBook(null);
    setSearchInput('');
    setSuggestions([]);
    setIsDropdownOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    setValue('title', val);
    setPreviewData((prev) => ({ ...prev, title: val }));
    if (!val.trim()) {
      setSuggestions([]);
      setIsDropdownOpen(false);
    }
    if (selectedBook && val !== selectedBook.title) {
      setSelectedBook(null);
    }
  };

  const displayCover =
    previewData.coverImage ||
    getVerifiedCover(
      previewData.title,
      previewData.isbn,
      previewData.author,
      previewData.category
    );

  return (
    <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {title}
            </h1>
            {subtitle && <p className="text-[11px] text-slate-500 hidden sm:block">{subtitle}</p>}
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
            <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 text-xs">
                    Book Title / Quick Autocomplete *
                  </label>
                  {isSearching && (
                    <span className="text-[11px] text-teal-600 font-semibold animate-pulse">
                      Searching online & catalog...
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    placeholder="Type book title or author (e.g. Code, Clean Code, Python)..."
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
                          src={
                            item.coverImage ||
                            getVerifiedCover(item.title, item.isbn, item.author, item.category)
                          }
                          alt={item.title}
                          className="w-9 h-12 object-cover rounded shadow-2xs shrink-0 group-hover:scale-105 transition"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = generateFallbackCover(
                              item.title,
                              item.author,
                              item.category
                            );
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
                    placeholder="e.g. Charles Petzold"
                    {...register('author', {
                      required: 'Author is required',
                      onChange: (e) =>
                        setPreviewData((prev) => ({ ...prev, author: e.target.value })),
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-medium"
                  />
                  {errors.author && (
                    <p className="text-rose-500 text-[11px] mt-1">{errors.author.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Publisher *</label>
                  <input
                    type="text"
                    placeholder="e.g. Microsoft Press"
                    {...register('publisher', { required: 'Publisher is required' })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-medium"
                  />
                  {errors.publisher && (
                    <p className="text-rose-500 text-[11px] mt-1">{errors.publisher.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">ISBN-13 Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 978-0735605053"
                    {...register('isbn', {
                      required: 'ISBN is required',
                      onChange: (e) => setPreviewData((prev) => ({ ...prev, isbn: e.target.value })),
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 font-mono text-xs"
                  />
                  {errors.isbn && (
                    <p className="text-rose-500 text-[11px] mt-1">{errors.isbn.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Category *</label>
                  <select
                    {...register('category', {
                      required: 'Category is required',
                      onChange: (e) =>
                        setPreviewData((prev) => ({ ...prev, category: e.target.value })),
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-semibold bg-white cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {previewData.category &&
                      !categories.some(
                        (c) => c.name.toLowerCase() === previewData.category.toLowerCase()
                      ) && (
                        <option value={previewData.category}>{previewData.category}</option>
                      )}
                  </select>
                  {errors.category && (
                    <p className="text-rose-500 text-[11px] mt-1">{errors.category.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Published Year *</label>
                  <input
                    type="number"
                    min="1800"
                    max="2030"
                    {...register('publishedYear', {
                      required: 'Year is required',
                      valueAsNumber: true,
                      onChange: (e) =>
                        setPreviewData((prev) => ({ ...prev, publishedYear: e.target.value })),
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Total Copies *</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    {...register('totalCopies', {
                      required: 'Total copies is required',
                      valueAsNumber: true,
                      onChange: (e) =>
                        setPreviewData((prev) => ({ ...prev, totalCopies: e.target.value })),
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Available Copies *</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    {...register('availableCopies', {
                      required: 'Available copies is required',
                      valueAsNumber: true,
                      onChange: (e) =>
                        setPreviewData((prev) => ({ ...prev, availableCopies: e.target.value })),
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">Cover Image URL</label>
                <input
                  type="text"
                  placeholder="https://covers.openlibrary.org/b/id/123-L.jpg"
                  {...register('coverImage', {
                    onChange: (e) =>
                      setPreviewData((prev) => ({ ...prev, coverImage: e.target.value })),
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">Synopsis & Details</label>
                <textarea
                  rows={3}
                  placeholder="Detailed description of the book volume..."
                  {...register('description')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Catalog Card Preview
                </h3>

                <div className="aspect-[3/4] w-full max-h-64 bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center p-2">
                  <img
                    src={displayCover}
                    alt={previewData.title || 'Preview'}
                    className="w-full h-full object-contain rounded-xl"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = generateFallbackCover(
                        previewData.title,
                        previewData.author,
                        previewData.category
                      );
                    }}
                  />
                </div>

                <div className="space-y-1.5 pt-2">
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
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export const BookFormFullPage = BookForm;
export const BookEditFullPage = BookForm;
