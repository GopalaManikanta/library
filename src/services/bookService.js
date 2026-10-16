import axios from 'axios';

const OPEN_LIBRARY_API = 'https://openlibrary.org';
const BOOKS_STORAGE_KEY = 'lms_books_api_data_v6';

const cleanCategory = (cat) => {
  if (!cat || typeof cat !== 'string') return 'Computer Science';
  if (cat.startsWith('nyt:') || cat.startsWith('Serie:')) return 'Study & Technology';
  if (cat.includes(',')) return cat.split(',')[0].trim();
  return cat.trim();
};

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=600',
];

export const generateFallbackCover = (title = '', _author = '', category = '') => {
  const seed = (String(title || '') + String(category || '')).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_COVERS[seed % FALLBACK_COVERS.length];
};

export const getVerifiedCover = (title = '', isbn = '', author = '', category = '', existingCover = '') => {
  if (existingCover && !existingCover.startsWith('data:')) {
    return existingCover;
  }
  const cleanIsbn = (isbn || '').replace(/\D/g, '');
  if (cleanIsbn && cleanIsbn.length >= 10) {
    return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
  }
  return generateFallbackCover(title, author, category);
};

export const bookService = {
  async fetchBooks(limit = 40) {
    try {
      const response = await axios.get(
        `${OPEN_LIBRARY_API}/search.json?q=computer+science+OR+programming+OR+algorithms+OR+database+OR+software+engineering&limit=${Math.max(limit, 40)}&fields=key,title,author_name,first_publish_year,cover_i,isbn,publisher,subject`,
        {
          timeout: 10000,
        }
      );

      if (response.data?.docs && Array.isArray(response.data.docs) && response.data.docs.length > 0) {
        const liveBooks = response.data.docs
          .filter((doc) => doc.title)
          .map((doc, idx) => {
            const rawIsbn = doc.isbn ? doc.isbn[0] : `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            const author = doc.author_name ? doc.author_name.join(', ') : 'Academic Author';
            const publisher = doc.publisher ? doc.publisher[0] : 'Academic Press';
            const category = cleanCategory(doc.subject ? doc.subject[0] : 'Computer Science');
            const cover = doc.cover_i
              ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
              : getVerifiedCover(doc.title, rawIsbn, author, category);

            return {
              id: String(doc.cover_edition_key || doc.key?.replace('/works/', '') || `ol-${idx + 1}`),
              title: doc.title,
              author,
              isbn: rawIsbn,
              publisher,
              category,
              publishedYear: doc.first_publish_year || 2021,
              totalCopies: 10 + (idx % 8),
              availableCopies: 8 + (idx % 5),
              coverImage: cover,
              description: `${doc.title} by ${author}. Catalogued from Open Library global database API.`,
              source: 'Open Library API',
            };
          });

        localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(liveBooks));
        return liveBooks;
      }

      const cached = localStorage.getItem(BOOKS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return [];
    } catch {
      const cached = localStorage.getItem(BOOKS_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {}
      }
      return [];
    }
  },

  async createBook(newBook) {
    try {
      const res = await axios.post(
        'https://jsonplaceholder.typicode.com/posts',
        {
          title: newBook.title,
          body: newBook.description,
          userId: 1,
        },
        { timeout: 7000 }
      );
      return {
        ...newBook,
        apiId: res.data?.id,
      };
    } catch {
      return newBook;
    }
  },

  async updateBook(id, updatedBook) {
    try {
      await axios.put(
        'https://jsonplaceholder.typicode.com/posts/1',
        {
          title: updatedBook.title,
          body: updatedBook.description,
        },
        { timeout: 7000 }
      );
      return updatedBook;
    } catch {
      return updatedBook;
    }
  },

  async deleteBook(id) {
    try {
      await axios.delete('https://jsonplaceholder.typicode.com/posts/1', { timeout: 7000 });
      return id;
    } catch {
      return id;
    }
  },

  searchLocalBooks(query, limit = 8) {
    if (!query || !query.trim()) return [];
    const clean = query.trim().toLowerCase();

    let books = [];
    const cached = localStorage.getItem(BOOKS_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          books = parsed;
        }
      } catch {}
    }

    const wordStart = (str) =>
      String(str || '').toLowerCase().split(/\s+/).some((w) => w.startsWith(clean));

    return books
      .filter((b) => {
        const t = (b.title || '').toLowerCase();
        const a = (b.author || '').toLowerCase();
        const i = (b.isbn || '').toLowerCase();
        const p = (b.publisher || '').toLowerCase();
        const c = (b.category || '').toLowerCase();
        return t.includes(clean) || a.includes(clean) || i.includes(clean) || p.includes(clean) || c.includes(clean);
      })
      .sort((a, b) => {
        const aStarts = (a.title || '').toLowerCase().startsWith(clean);
        const bStarts = (b.title || '').toLowerCase().startsWith(clean);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        const aWord = wordStart(a.title);
        const bWord = wordStart(b.title);
        if (aWord && !bWord) return -1;
        if (!aWord && bWord) return 1;

        return (a.title || '').localeCompare(b.title || '');
      })
      .slice(0, limit);
  },

  async searchGoogleBooks(query, maxResults = 10) {
    return this.searchBooks(query, maxResults);
  },

  async searchBooks(query, limit = 20) {
    if (!query || !query.trim()) {
      return [];
    }

    const cleanQuery = query.trim().toLowerCase();
    const localMatches = this.searchLocalBooks(cleanQuery, limit);

    if (cleanQuery.length < 3) {
      return localMatches;
    }

    try {
      const res = await axios.get(
        `${OPEN_LIBRARY_API}/search.json?q=${encodeURIComponent(cleanQuery)}&limit=${limit}&fields=key,title,author_name,first_publish_year,cover_i,isbn,publisher,subject`,
        { timeout: 7000 }
      );

      let externalResults = [];
      if (res.data?.docs && Array.isArray(res.data.docs)) {
        externalResults = res.data.docs.map((doc, idx) => {
          const title = doc.title || 'Untitled Work';
          const author = doc.author_name ? doc.author_name.join(', ') : 'Various Authors';
          const rawIsbn = doc.isbn ? doc.isbn[0] : `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
          const publisher = doc.publisher ? doc.publisher[0] : 'Open Library Publication';
          const year = doc.first_publish_year || 2022;
          const category = cleanCategory(doc.subject ? doc.subject[0] : 'Computer Science');
          const cover = doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            : getVerifiedCover(title, rawIsbn, author, category);

          return {
            id: `ol_${doc.cover_edition_key || doc.key?.replace('/works/', '') || idx}`,
            title,
            author,
            isbn: rawIsbn,
            publisher,
            category,
            publishedYear: year,
            totalCopies: 10,
            availableCopies: 10,
            coverImage: cover,
            description: `${title} by ${author}. Catalogued across world technical libraries in the Open Library index.`,
            source: 'Open Library API',
          };
        });
      }

      const seen = new Set();
      const merged = [];

      for (const book of [...localMatches, ...externalResults]) {
        const norm = (book.title || '').trim().toLowerCase();
        if (norm && !seen.has(norm)) {
          seen.add(norm);
          merged.push(book);
          if (merged.length >= limit) break;
        }
      }

      return merged;
    } catch {
      return localMatches;
    }
  },
};
