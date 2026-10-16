import React, { useState } from 'react';
import {
  Globe,
  BookOpen,
  User,
  Hash,
  Layers,
  Code,
  Terminal,
  Cpu,
  Database,
  Bookmark,
  Sparkles,
  ArrowLeft,
  Plus,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const SEARCH_SCOPES = [
  {
    id: 'global',
    label: 'Global Search',
    icon: Globe,
    placeholder: 'Search catalog across Titles, Authors, ISBNs, Categories, Publishers...',
  },
  {
    id: 'title',
    label: 'Book Title',
    icon: BookOpen,
    placeholder: 'Search specifically by Book Title (e.g. Code, Clean Code)...',
  },
  {
    id: 'author',
    label: 'Author',
    icon: User,
    placeholder: 'Search specifically by Author Name (e.g. Charles Petzold)...',
  },
  {
    id: 'isbn',
    label: 'ISBN Number',
    icon: Hash,
    placeholder: 'Search by ISBN-10 or ISBN-13 (e.g. 9780735605053)...',
  },
];

export const CATEGORY_COLORS = [
  { id: 'teal', label: 'Teal', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-800 border-teal-300', dot: 'bg-teal-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', dot: 'bg-indigo-500' },
  { id: 'sky', label: 'Sky', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-800 border-sky-300', dot: 'bg-sky-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800 border-purple-300', dot: 'bg-purple-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500' },
  { id: 'slate', label: 'Slate', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-200 text-slate-800 border-slate-300', dot: 'bg-slate-500' },
];

export const CATEGORY_ICONS = [
  { id: 'Layers', label: 'Layers' },
  { id: 'Code', label: 'Code' },
  { id: 'Terminal', label: 'Terminal' },
  { id: 'Cpu', label: 'Processor' },
  { id: 'Database', label: 'Database' },
  { id: 'BookOpen', label: 'Book' },
  { id: 'Bookmark', label: 'Bookmark' },
  { id: 'Sparkles', label: 'Sparkles' },
];

export const getCategoryColorClasses = (colorName) => {
  const found = CATEGORY_COLORS.find((c) => c.id === colorName);
  if (found) return found;
  return CATEGORY_COLORS[0];
};

export const renderCategoryIcon = (iconName, className = 'w-4 h-4') => {
  switch (iconName) {
    case 'Layers':
      return <Layers className={className} />;
    case 'Code':
      return <Code className={className} />;
    case 'Terminal':
      return <Terminal className={className} />;
    case 'Cpu':
      return <Cpu className={className} />;
    case 'Database':
      return <Database className={className} />;
    case 'Bookmark':
      return <Bookmark className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'BookOpen':
    default:
      return <BookOpen className={className} />;
  }
};

export const CategoryAddFullPage = ({ onBack, onAdd, isSubmitting }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('teal');
  const [icon, setIcon] = useState('Layers');
  const [error, setError] = useState('');

  const colorStyles = getCategoryColorClasses(color);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    setError('');
    onAdd({
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back to Catalog</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Add New Category
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Create a new subject classification to organize and group library volumes
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. Artificial Intelligence, Cloud Computing, Cyber Security"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-semibold text-slate-900"
                />
                {error && <p className="text-rose-500 text-[11px] mt-1">{error}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">Description & Scope</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what kinds of books and subjects belong in this category..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2 text-xs">Badge Color Theme</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`h-9 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                        color === c.id
                          ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-400'
                      } ${c.bg}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.dot}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2 text-xs">Category Icon</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {CATEGORY_ICONS.map((ic) => {
                    const isSelected = icon === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setIcon(ic.id)}
                        className={`h-10 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title={ic.label}
                      >
                        {renderCategoryIcon(ic.id, 'w-4 h-4')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Live Preview</h3>
                <div className={`p-4 rounded-2xl border ${colorStyles.border} ${colorStyles.bg} space-y-3`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-800">
                      {renderCategoryIcon(icon, 'w-4 h-4 text-teal-600')}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {name.trim() || 'Category Title'}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorStyles.badge}`}>
                        0 Books Assigned
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {description.trim() || 'No description provided yet.'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 cursor-pointer flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating Category...' : 'Save New Category'}</span>
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

export const CategoryEditFullPage = ({
  category,
  assignedCount,
  onBack,
  onUpdate,
  isSubmitting,
}) => {
  const [name, setName] = useState(category.name || '');
  const [description, setDescription] = useState(category.description || '');
  const [color, setColor] = useState(category.color || 'teal');
  const [icon, setIcon] = useState(category.icon || 'Layers');
  const [error, setError] = useState('');

  const colorStyles = getCategoryColorClasses(color);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    setError('');
    onUpdate({
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back to Categories</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Edit Category: {category.name}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Update name, description, and visual theme for this subject classification
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-0.5">
            <p className="font-extrabold">Real-Time Catalog Sync Notice</p>
            <p>
              Renaming this category will automatically update all <strong>{assignedCount}</strong> books
              currently assigned to this classification across the entire library.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs font-semibold text-slate-900"
                />
                {error && <p className="text-rose-500 text-[11px] mt-1">{error}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">Description & Scope</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/15 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2 text-xs">Badge Color Theme</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`h-9 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                        color === c.id
                          ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-400'
                      } ${c.bg}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.dot}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2 text-xs">Category Icon</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {CATEGORY_ICONS.map((ic) => {
                    const isSelected = icon === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setIcon(ic.id)}
                        className={`h-10 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        title={ic.label}
                      >
                        {renderCategoryIcon(ic.id, 'w-4 h-4')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Live Preview</h3>
                <div className={`p-4 rounded-2xl border ${colorStyles.border} ${colorStyles.bg} space-y-3`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-800">
                      {renderCategoryIcon(icon, 'w-4 h-4 text-teal-600')}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {name.trim() || 'Category Title'}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorStyles.badge}`}>
                        {assignedCount} Books Assigned
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {description.trim() || 'No description provided yet.'}
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
                  <span>{isSubmitting ? 'Updating Category...' : 'Save Category Changes'}</span>
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

export const CategoryDeleteFullPage = ({
  category,
  assignedCount,
  onBack,
  onDelete,
  isSubmitting,
}) => {
  return (
    <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            <span>Back to Categories</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Delete Category Confirmation
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Remove subject classification and review reassignment safeguards
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-2xl w-full mx-auto space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Delete "{category.name}" Category?
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove the <strong>{category.name}</strong> classification?
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs text-rose-900">
            <p className="font-extrabold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              Automatic Volume Safeguard
            </p>
            <p>
              There are currently <strong>{assignedCount}</strong> books assigned to this category.
              Deleting this category will safely reassign all <strong>{assignedCount}</strong> books to the{' '}
              <strong>"General"</strong> category so no records are lost.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onDelete}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-2 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Deleting Category...' : 'Confirm & Delete Category'}</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Cancel & Keep Category
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
