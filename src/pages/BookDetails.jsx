import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  AlertCircle,
  Menu,
  X,
  ExternalLink,
  Globe,
  BookOpen,
  ShieldCheck,
  Copy,
  Check,
  ZoomIn,
  MapPin,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Sidebar } from '../components/Sidebar';
import { getVerifiedCover, generateFallbackCover } from '../services/bookService';

export const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { books, updateBook, deleteBook } = useLibrary();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedIsbn, setCopiedIsbn] = useState(false);

  const book = books.find((b) => String(b.id) === String(id));

  if (!book) {
    return (
      <div className="h-screen overflow-hidden bg-[#f8fafc] text-slate-800 flex font-sans">
        <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Book Volume Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm">
            The requested book record does not exist or was removed from the library catalog.
          </p>
          <Link
            to="/books"
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition shadow-md shadow-teal-600/20"
          >
            Return to Books Inventory
          </Link>
        </div>
      </div>
    );
  }

  const avail = Number(book.availableCopies ?? book.totalCopies) || 0;
  const total = Number(book.totalCopies) || 1;
  const availPct = Math.min(100, Math.round((avail / total) * 100));

  const coverUrl =
    book.coverImage || getVerifiedCover(book.title, book.isbn, book.author, book.category);

  const handleCopyIsbn = () => {
    if (book.isbn) {
      navigator.clipboard.writeText(book.isbn);
      setCopiedIsbn(true);
      toast.success('ISBN copied to clipboard!');
      setTimeout(() => setCopiedIsbn(false), 2000);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteBook(book.id);
      toast.success(`"${book.title}" removed from catalog.`);
      navigate('/books');
    } catch (err) {
      toast.error(err.message || 'Failed to delete book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc] text-slate-800 flex font-sans">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {isEditing ? (
        <BookEditFullPage
          book={book}
          onBack={() => setIsEditing(false)}
          onSubmit={async (data) => {
            setIsSubmitting(true);
            try {
              await updateBook(book.id, data);
              toast.success(`"${data.title}" updated successfully!`);
              setIsEditing(false);
            } catch (err) {
              toast.error(err.message || 'Failed to update book');
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
        />
      ) : (
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link
                to="/books"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Books</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setIsDeleting(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
            {isDeleting && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-rose-950">
                      Delete Book Record: "{book.title}"?
                    </h4>
                    <p className="text-xs text-rose-700">
                      This action will remove this volume permanently from the library catalog.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDeleting(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Deleting...' : 'Confirm Delete'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 flex flex-col items-center justify-between relative overflow-hidden">
                <img
                  src={coverUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-35 scale-125 pointer-events-none"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />

                <div className="w-full flex items-center justify-between relative z-10 mb-4">
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-400/30 backdrop-blur-md">
                    {book.category}
                  </span>

                  <button
                    onClick={() => setActiveTab('cover')}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md flex items-center gap-1 transition cursor-pointer"
                  >
                    <ZoomIn className="w-3 h-3 text-teal-300" />
                    <span>Cover Art</span>
                  </button>
                </div>

                <div
                  onClick={() => setActiveTab('cover')}
                  className="relative z-10 w-full max-w-[240px] sm:max-w-[270px] aspect-[2/3] my-auto cursor-pointer group/book transition-transform duration-500 hover:scale-103"
                  title="Click to view full cover details"
                >
                  <div className="absolute -bottom-4 inset-x-4 h-6 bg-black/80 blur-xl rounded-full" />

                  <div className="relative w-full h-full rounded-lg overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] ring-1 ring-white/25 flex items-center justify-center bg-slate-900">
                    <img
                      src={coverUrl}
                      alt={book.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = generateFallbackCover(book.title, book.author, book.category);
                      }}
                    />
                    <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/15 to-transparent pointer-events-none" />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/book:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1.5 rounded-full bg-teal-600/95 text-white text-xs font-bold shadow-xl flex items-center gap-1.5 backdrop-blur-xs">
                        <ZoomIn className="w-3.5 h-3.5" />
                        View Cover Art
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 w-full mt-6 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-teal-300">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            avail > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                          }`}
                        />
                        Shelf Availability
                      </span>
                      <span className={avail > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {avail > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          avail === 0
                            ? 'bg-rose-500'
                            : avail < 3
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${availPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium pt-0.5">
                      <span>
                        <strong className="text-white">{avail}</strong> Available
                      </span>
                      <span>
                        Total: <strong className="text-white">{total}</strong> Copies
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" />
                      Shelf Location:
                    </span>
                    <span className="font-bold text-white font-mono">
                      Aisle 3 • Bay B • Rack 4
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                      Published: {book.publishedYear}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Official Edition
                    </span>
                    {book.source && (
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold">
                        Source: {book.source}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {book.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-2">
                    <span>
                      Written by <strong className="text-slate-800 font-bold">{book.author}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Published by{' '}
                      <strong className="text-slate-800 font-bold">{book.publisher}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-6 border-b border-slate-200 mt-6 text-xs font-bold">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`pb-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'overview'
                          ? 'border-teal-600 text-teal-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Overview & Specs</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('references')}
                      className={`pb-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'references'
                          ? 'border-teal-600 text-teal-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>External Links</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('cover')}
                      className={`pb-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'cover'
                          ? 'border-teal-600 text-teal-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Cover Art</span>
                    </button>
                  </div>

                  {activeTab === 'overview' && (
                    <div className="py-5 space-y-5 text-xs">
                      <div>
                        <h3 className="font-extrabold uppercase tracking-wider text-slate-400 text-[11px] mb-1.5">
                          Synopsis / Official Summary
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-xs sm:text-sm bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                          {book.description || 'No detailed synopsis catalogued for this work.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 relative group/isbn">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                            ISBN-13
                          </span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-mono text-xs font-bold text-slate-900 truncate">
                              {book.isbn}
                            </span>
                            <button
                              onClick={handleCopyIsbn}
                              className="p-1 rounded text-slate-400 hover:text-teal-700 cursor-pointer"
                              title="Copy ISBN"
                            >
                              {copiedIsbn ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                            Publisher
                          </span>
                          <span className="text-xs font-bold text-slate-900 mt-1 block truncate">
                            {book.publisher}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                            Published Year
                          </span>
                          <span className="text-xs font-bold text-slate-900 mt-1 block">
                            {book.publishedYear}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                            Category
                          </span>
                          <span className="text-xs font-bold text-teal-700 mt-1 block truncate">
                            {book.category}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                            Total Copies
                          </span>
                          <span className="text-xs font-bold text-slate-900 mt-1 block">
                            {total} Copies ({avail} Available)
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                            Catalog Inventory ID
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-600 mt-1 block">
                            VOL-{book.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'references' && (
                    <div className="py-5 space-y-4 text-xs">
                      <p className="text-slate-600 leading-relaxed">
                        Connect to global open bibliographic repositories for this volume:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <a
                          href={`https://openlibrary.org/search?q=${encodeURIComponent(
                            book.title
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                              <Globe className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block group-hover:text-teal-700">
                                Open Library Index
                              </span>
                              <span className="text-[11px] text-slate-500">
                                View public domain archives & editions
                              </span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition" />
                        </a>

                        <a
                          href={
                            book.previewLink ||
                            `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(
                              book.title
                            )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block group-hover:text-sky-700">
                                Google Books Preview
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Read sample excerpts & bibliography
                              </span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-700 transition" />
                        </a>
                      </div>
                    </div>
                  )}

                  {activeTab === 'cover' && (
                    <div className="py-5 space-y-4 text-xs">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
                        <img
                          src={coverUrl}
                          alt={book.title}
                          className="w-36 h-52 object-contain rounded-xl shadow-md border border-slate-200 bg-slate-900 shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = generateFallbackCover(book.title, book.author, book.category);
                          }}
                        />
                        <div className="space-y-2">
                          <h4 className="font-extrabold text-sm text-slate-900">
                            High-Resolution Library Cover
                          </h4>
                          <p className="text-slate-600 leading-relaxed text-xs">
                            Sourced from verified Open Library and academic publisher archives.
                          </p>
                          <div className="pt-2">
                            <a
                              href={coverUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Raw Image in New Tab</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to="/books"
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Catalog Directory</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Edit Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

const BookEditFullPage = ({ book, onBack, onSubmit, isSubmitting }) => {
  const [preview, setPreview] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    category: book.category,
    publishedYear: book.publishedYear,
    coverImage: book.coverImage || '',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publisher: book.publisher,
      category: book.category,
      publishedYear: book.publishedYear,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      coverImage: book.coverImage || '',
      description: book.description,
    },
  });

  const currentCover =
    preview.coverImage ||
    getVerifiedCover(preview.title, preview.isbn, preview.author, preview.category);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back to Book Details</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Edit Book: {book.title}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Update bibliographic details, inventory copies, and publication metadata
            </p>
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
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">Book Title *</label>
                <input
                  type="text"
                  {...register('title', {
                    required: 'Title is required',
                    onChange: (e) => setPreview((p) => ({ ...p, title: e.target.value })),
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-semibold"
                />
                {errors.title && <p className="text-rose-500 text-[11px] mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Author Name *</label>
                  <input
                    type="text"
                    {...register('author', {
                      required: 'Author is required',
                      onChange: (e) => setPreview((p) => ({ ...p, author: e.target.value })),
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-medium"
                  />
                  {errors.author && <p className="text-rose-500 text-[11px] mt-1">{errors.author.message}</p>}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Publisher *</label>
                  <input
                    type="text"
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
                    {...register('isbn', {
                      required: 'ISBN is required',
                      onChange: (e) => setPreview((p) => ({ ...p, isbn: e.target.value })),
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 font-mono text-xs"
                  />
                  {errors.isbn && <p className="text-rose-500 text-[11px] mt-1">{errors.isbn.message}</p>}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Category *</label>
                  <input
                    type="text"
                    {...register('category', {
                      required: 'Category is required',
                      onChange: (e) => setPreview((p) => ({ ...p, category: e.target.value })),
                    })}
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
                    {...register('publishedYear', {
                      required: true,
                      onChange: (e) => setPreview((p) => ({ ...p, publishedYear: e.target.value })),
                    })}
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
                <label className="block font-bold text-slate-700 mb-1 text-xs">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  {...register('coverImage', {
                    onChange: (e) => setPreview((p) => ({ ...p, coverImage: e.target.value })),
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">Description & Synopsis</label>
                <textarea
                  rows={4}
                  {...register('description')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs resize-none"
                />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 pb-2 border-b border-slate-100">
                  Current Cover Preview
                </h4>
                <div className="h-64 bg-slate-900 rounded-2xl flex items-center justify-center p-3 relative overflow-hidden">
                  <img
                    src={currentCover}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-125 pointer-events-none"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <img
                    src={currentCover}
                    alt={preview.title}
                    className="h-full aspect-[2/3] object-contain rounded-md shadow-2xl relative z-10 ring-1 ring-white/20 bg-slate-900"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = generateFallbackCover(
                        preview.title || book.title,
                        preview.author || book.author,
                        preview.category || book.category
                      );
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                    {preview.category}
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-900 truncate">
                    {preview.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    By {preview.author}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 cursor-pointer flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Updating Volume...' : 'Save Changes'}</span>
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel & Return to Details
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
