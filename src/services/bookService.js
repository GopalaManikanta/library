import axios from 'axios';

const OPEN_LIBRARY_API = 'https://openlibrary.org';
export const DEFAULT_BOOK_COVER = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400';

const cleanCategory = (cat) => {
  if (!cat || typeof cat !== 'string') return 'Computer Science';
  if (cat.startsWith('nyt:') || cat.startsWith('Serie:')) return 'Study & Technology';
  if (cat.includes(',')) return cat.split(',')[0].trim();
  return cat.trim();
};

export const generateFallbackCover = () => DEFAULT_BOOK_COVER;

export const getVerifiedCover = (title = '', isbn = '', author = '', category = '', existingCover = '') => {
  const normTitle = (title || '').toLowerCase().trim();
  const cleanIsbn = (isbn || '').replace(/\D/g, '');

  if (existingCover && !existingCover.startsWith('data:') && !existingCover.includes('9780439708180')) {
    return existingCover;
  }

  if (normTitle.includes('learning python')) return 'https://covers.openlibrary.org/b/id/1312568-L.jpg';
  if (normTitle.includes('core python')) return 'https://covers.openlibrary.org/b/id/13192647-L.jpg';
  if (normTitle.includes('fluent python')) return 'https://covers.openlibrary.org/b/id/8743408-L.jpg';
  if (normTitle.includes('black hat python')) return 'https://covers.openlibrary.org/b/id/8513526-L.jpg';
  if (normTitle.includes('python programming')) return 'https://covers.openlibrary.org/b/id/935554-L.jpg';
  if (normTitle.includes('think python')) return 'https://covers.openlibrary.org/b/id/14817169-L.jpg';
  if (normTitle.includes('python crash course') || normTitle.includes('python')) return 'https://covers.openlibrary.org/b/id/8800209-L.jpg';

  if (normTitle.includes('programming with java')) return 'https://covers.openlibrary.org/b/id/10487733-L.jpg';
  if (normTitle.includes('effective java')) return 'https://covers.openlibrary.org/b/id/8300262-L.jpg';
  if (normTitle.includes('java: the complete') || (normTitle.includes('java') && !normTitle.includes('script'))) return 'https://covers.openlibrary.org/b/id/62098-L.jpg';

  if (normTitle.includes('the c programming language') || normTitle === 'c programming') return 'https://covers.openlibrary.org/b/id/6684943-L.jpg';
  if (normTitle.includes('the c++ programming') || normTitle.includes('object-oriented programming with c++') || normTitle.includes('c++ primer') || normTitle.includes('c++')) return 'https://covers.openlibrary.org/b/id/135999-L.jpg';
  if (normTitle.includes('invitation to computer science')) return 'https://covers.openlibrary.org/b/id/8524066-L.jpg';
  if (normTitle.includes('computer science')) return 'https://covers.openlibrary.org/b/id/2378050-L.jpg';
  if (normTitle.includes('art of computer programming')) return 'https://covers.openlibrary.org/b/id/1487679-L.jpg';
  if (normTitle.includes('algorithms to live by')) return 'https://covers.openlibrary.org/b/id/14601429-L.jpg';
  if (normTitle.includes('data structures')) return 'https://covers.openlibrary.org/b/id/11067110-L.jpg';
  if (normTitle.includes('cracking the coding interview')) return 'https://covers.openlibrary.org/b/id/7949575-L.jpg';
  if (normTitle.includes('operating system')) return 'https://covers.openlibrary.org/b/id/302591-L.jpg';
  if (normTitle.includes('database')) return 'https://covers.openlibrary.org/b/id/54871-L.jpg';
  if (normTitle.includes('computer networking') || normTitle.includes('networking')) return 'https://covers.openlibrary.org/b/id/193126-L.jpg';
  if (normTitle.includes('clean code')) return 'https://covers.openlibrary.org/b/id/8065615-L.jpg';
  if (normTitle.includes('pragmatic programmer')) return 'https://covers.openlibrary.org/b/id/10143650-L.jpg';
  if (normTitle.includes('eloquent javascript') || normTitle.includes('javascript')) return 'https://covers.openlibrary.org/b/id/7082166-L.jpg';
  if (normTitle.includes('artificial intelligence')) return 'https://covers.openlibrary.org/b/id/92018-L.jpg';
  if (normTitle.includes('deep learning')) return 'https://covers.openlibrary.org/b/id/8086288-L.jpg';
  if (normTitle.includes('brief history of time') || (normTitle.includes('hawking') && normTitle.includes('time'))) return 'https://covers.openlibrary.org/b/id/10432365-L.jpg';

  const isbnMap = {
    '9780596516604': 'https://covers.openlibrary.org/b/id/1312568-L.jpg',
    '9782225800689': 'https://covers.openlibrary.org/b/id/6684943-L.jpg',
    '9780074635421': 'https://covers.openlibrary.org/b/id/10487733-L.jpg',
    '9781593279288': 'https://covers.openlibrary.org/b/id/8800209-L.jpg',
    '9781260440232': 'https://covers.openlibrary.org/b/id/62098-L.jpg',
    '9780131103627': 'https://covers.openlibrary.org/b/id/6684943-L.jpg',
    '9780321714114': 'https://covers.openlibrary.org/b/id/135999-L.jpg',
    '9780672324536': 'https://covers.openlibrary.org/b/id/11067110-L.jpg',
    '9780984782857': 'https://covers.openlibrary.org/b/id/7949575-L.jpg',
    '9781119800361': 'https://covers.openlibrary.org/b/id/302591-L.jpg',
    '9780078022159': 'https://covers.openlibrary.org/b/id/54871-L.jpg',
    '9780136681557': 'https://covers.openlibrary.org/b/id/193126-L.jpg',
    '9780132350884': 'https://covers.openlibrary.org/b/id/8065615-L.jpg',
    '9780135957059': 'https://covers.openlibrary.org/b/id/10143650-L.jpg',
    '9781593279509': 'https://covers.openlibrary.org/b/id/7082166-L.jpg',
    '9780134610993': 'https://covers.openlibrary.org/b/id/92018-L.jpg',
    '9780262035613': 'https://covers.openlibrary.org/b/id/8086288-L.jpg',
    '9780553380163': 'https://covers.openlibrary.org/b/id/10432365-L.jpg',
  };

  if (cleanIsbn && isbnMap[cleanIsbn]) {
    return isbnMap[cleanIsbn];
  }

  return DEFAULT_BOOK_COVER;
};

export const bookService = {
  async fetchBooks(limit = 20) {
    try {
      const response = await axios.get(
        `${OPEN_LIBRARY_API}/search.json?q=python+OR+java+OR+c%2B%2B+OR+computer+science+OR+programming&limit=${limit}&fields=key,title,author_name,first_publish_year,cover_i,isbn,publisher,subject`,
        { timeout: 8000 }
      );

      if (response.data?.docs && Array.isArray(response.data.docs) && response.data.docs.length > 0) {
        const liveBooks = response.data.docs.slice(0, limit).map((doc, idx) => {
          const rawIsbn = doc.isbn ? doc.isbn[0] : `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
          const author = doc.author_name ? doc.author_name.join(', ') : 'Various Authors';
          const publisher = doc.publisher ? doc.publisher[0] : 'Academic Computer Press';
          const category = cleanCategory(doc.subject ? doc.subject[0] : 'Computer Science');
          const cover = doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            : getVerifiedCover(doc.title, rawIsbn, author, category);

          return {
            id: String(doc.cover_edition_key || doc.key?.replace('/works/', '') || idx + 1),
            title: doc.title,
            author,
            isbn: rawIsbn,
            publisher,
            category,
            publishedYear: doc.first_publish_year || 2020,
            totalCopies: 12 + (idx % 6),
            availableCopies: 8 + (idx % 4),
            coverImage: cover,
            description: `${doc.title} by ${author}. A widely studied technical and computer science reference catalogued in the Open Library global database.`,
            source: 'Open Library API',
          };
        });

        localStorage.setItem('lms_study_books_v4', JSON.stringify(liveBooks));
        return liveBooks;
      }

      const cached = localStorage.getItem('lms_study_books_v4');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
        }
      }
      return [];
    } catch {
      const cached = localStorage.getItem('lms_study_books_v4');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
        }
      }
      return [];
    }
  },

  async createBook(newBook) {
    return newBook;
  },

  async updateBook(id, updatedBook) {
    return updatedBook;
  },

  async deleteBook(id) {
    return id;
  },

  searchLocalBooks(query, limit = 8) {
    if (!query || !query.trim()) return [];
    const clean = query.trim().toLowerCase();

    let books = [];
    const cached = localStorage.getItem('lms_study_books_v4');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          books = parsed;
        }
      } catch {
      }
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
        { timeout: 6000 }
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
