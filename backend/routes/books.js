const express = require('express');
const axios = require('axios');

const router = express.Router();

const prisma = require('../prisma');
const authenticateToken = require('../middleware/authMiddleware');

const GOOGLE_BOOKS_API_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const GOOGLE_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || '';

const CACHE_TTL_MS = 1000 * 60 * 15;
const cache = new Map();

const DEFAULT_MAX_RESULTS = 20;
const MAX_GOOGLE_RESULTS = 40;


const demoBooks = [
  {
    id: 'demo-clean-code',
    volumeInfo: {
      title: 'Clean Code',
      authors: ['Robert C. Martin'],
      description:
        'A practical book about writing readable, maintainable and professional code.',
      publishedDate: '2008',
      pageCount: 464,
      language: 'en',
      averageRating: 4.5,
      ratingsCount: 1200,
      categories: ['Programming'],
      imageLinks: {
        thumbnail:
          'https://books.google.com/books/content?id=_i6bDeoCQzsC&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      },
      infoLink: 'https://books.google.com/books?id=_i6bDeoCQzsC',
    },
  },
  {
    id: 'demo-effective-java',
    volumeInfo: {
      title: 'Effective Java',
      authors: ['Joshua Bloch'],
      description:
        'A guide to best practices and design patterns in Java programming.',
      publishedDate: '2018',
      pageCount: 416,
      language: 'en',
      averageRating: 4.6,
      ratingsCount: 900,
      categories: ['Programming'],
      imageLinks: {
        thumbnail:
          'https://books.google.com/books/content?id=ka2VUBqHiWkC&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      },
      infoLink: 'https://books.google.com/books?id=ka2VUBqHiWkC',
    },
  },
  {
    id: 'demo-design-patterns',
    volumeInfo: {
      title: 'Design Patterns',
      authors: ['Erich Gamma', 'Richard Helm', 'Ralph Johnson', 'John Vlissides'],
      description:
        'A classic book describing reusable object-oriented software design patterns.',
      publishedDate: '1994',
      pageCount: 395,
      language: 'en',
      averageRating: 4.4,
      ratingsCount: 700,
      categories: ['Programming'],
      imageLinks: {
        thumbnail:
          'https://books.google.com/books/content?id=6oHuKQe3TjQC&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      },
      infoLink: 'https://books.google.com/books?id=6oHuKQe3TjQC',
    },
  },
  {
    id: 'demo-python-crash-course',
    volumeInfo: {
      title: 'Python Crash Course',
      authors: ['Eric Matthes'],
      description:
        'A hands-on introduction to Python programming and practical projects.',
      publishedDate: '2019',
      pageCount: 544,
      language: 'en',
      averageRating: 4.7,
      ratingsCount: 850,
      categories: ['Programming'],
      imageLinks: {
        thumbnail:
          'https://books.google.com/books/content?id=w1v6DwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      },
      infoLink: 'https://books.google.com/books?id=w1v6DwAAQBAJ',
    },
  },
  {
    id: 'demo-django-for-beginners',
    volumeInfo: {
      title: 'Django for Beginners',
      authors: ['William S. Vincent'],
      description:
        'A beginner-friendly guide to building web applications with Django.',
      publishedDate: '2022',
      pageCount: 336,
      language: 'en',
      averageRating: 4.3,
      ratingsCount: 400,
      categories: ['Programming'],
      imageLinks: {
        thumbnail:
          'https://books.google.com/books/content?id=F5b3DwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      },
      infoLink: 'https://books.google.com/books?id=F5b3DwAAQBAJ',
    },
  },
  {
    id: 'demo-javascript-good-parts',
    volumeInfo: {
      title: 'JavaScript: The Good Parts',
      authors: ['Douglas Crockford'],
      description:
        'A concise book about the most reliable and elegant parts of JavaScript.',
      publishedDate: '2008',
      pageCount: 176,
      language: 'en',
      averageRating: 4.1,
      ratingsCount: 1000,
      categories: ['Programming'],
      imageLinks: {
        thumbnail:
          'https://books.google.com/books/content?id=PXa2bby0oQ0C&printsec=frontcover&img=1&zoom=1&source=gbs_api',
      },
      infoLink: 'https://books.google.com/books?id=PXa2bby0oQ0C',
    },
  },
];

function getDemoBooks(startIndex = 0, maxResults = 20) {
  return demoBooks.slice(startIndex, startIndex + maxResults);
}

function getSafeNumber(value, fallback) {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function normalizeMaxResults(value) {
  const parsed = getSafeNumber(value, DEFAULT_MAX_RESULTS);
  return Math.min(parsed, MAX_GOOGLE_RESULTS);
}

function getFromCache(key) {
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL_MS;

  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function saveToCache(key, data) {
  cache.set(key, {
    timestamp: Date.now(),
    data,
  });
}

function getGoogleParams(params = {}) {
  const result = { ...params };

  if (GOOGLE_API_KEY) {
    result.key = GOOGLE_API_KEY;
  }

  return result;
}

async function requestGoogleBooks(path = '', params = {}) {
  const url = path
    ? `${GOOGLE_BOOKS_API_BASE_URL}/${encodeURIComponent(path)}`
    : GOOGLE_BOOKS_API_BASE_URL;

  const response = await axios.get(url, {
    params: getGoogleParams(params),
    timeout: 8000,
  });

  return response.data;
}

function handleGoogleError(error, res, fallbackMessage) {
  const status = error.response?.status;

  console.error(fallbackMessage, error.message);

  if (status === 429) {
    return res.status(429).json({
      error: 'GOOGLE_BOOKS_RATE_LIMIT',
      message:
        'Google Books API chwilowo odrzuca zapytania z powodu limitu. Spróbuj ponownie za chwilę.',
    });
  }

  if (status === 503) {
    return res.status(503).json({
      error: 'GOOGLE_BOOKS_UNAVAILABLE',
      message:
        'Google Books API jest chwilowo niedostępne. Spróbuj ponownie za chwilę.',
    });
  }

  return res.status(500).json({
    error: 'GOOGLE_BOOKS_ERROR',
    message: fallbackMessage,
  });
}

async function findOrCreateBook(data) {
  const {
    googleBooksId,
    title,
    subtitle,
    description,
    publishedDate,
    pageCount,
    language,
    thumbnailUrl,
    previewLink,
    infoLink,
    averageRating,
    ratingsCount,
    isbn10,
    isbn13,
    authors,
    categories,
  } = data;

  let book = await prisma.book.findUnique({
    where: { googleBooksId },
  });

  if (!book) {
    book = await prisma.book.create({
      data: {
        googleBooksId,
        title,
        subtitle,
        description,
        publishedDate: publishedDate ? new Date(publishedDate) : null,
        pageCount,
        language,
        thumbnailUrl,
        previewLink,
        infoLink,
        averageRating,
        ratingsCount,
        isbn10,
        isbn13,
      },
    });

    for (const name of authors || []) {
      const author = await prisma.author.upsert({
        where: { name },
        update: {},
        create: { name },
      });

      await prisma.bookAuthor.create({
        data: {
          bookId: book.id,
          authorId: author.id,
        },
      });
    }

    for (const name of categories || []) {
      const category = await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });

      await prisma.bookCategory.create({
        data: {
          bookId: book.id,
          categoryId: category.id,
        },
      });
    }
  }

  return book;
}

/**
 * GET /api/books/search?q=...&startIndex=0&maxResults=20
 */
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const startIndex = getSafeNumber(req.query.startIndex, 0);
  const maxResults = normalizeMaxResults(req.query.maxResults);

  if (!q) {
    return res.status(400).json({
      error: 'Missing search query (q)',
    });
  }

  const cacheKey = `search:${q}:${startIndex}:${maxResults}`;
  const cached = getFromCache(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const data = await requestGoogleBooks('', {
      q,
      startIndex,
      maxResults,
      printType: 'books',
    });

    const result = {
      items: data.items || [],
      totalItems: data.totalItems || 0,
    };

    saveToCache(cacheKey, result);

    return res.json(result);
   } catch (error) {
    console.error('Failed to fetch books from Google Books API', error.message);

    if (error.response?.status === 429) {
      const fallbackBooks = getDemoBooks(startIndex, maxResults);

      return res.json({
        items: fallbackBooks,
        totalItems: demoBooks.length,
        source: 'demo-fallback',
        message:
          'Google Books API chwilowo odrzuca zapytania, dlatego wyświetlane są dane demonstracyjne.',
      });
    }

    return res.status(500).json({
      error: 'GOOGLE_BOOKS_ERROR',
      message: 'Nie udało się pobrać książek.',
    });
  }});
/**
 * GET /api/books/featured?startIndex=0&maxResults=20
 */
router.get('/featured', async (req, res) => {
  const startIndex = getSafeNumber(req.query.startIndex, 0);
  const maxResults = normalizeMaxResults(req.query.maxResults);

  const featuredQuery = 'subject:fiction';
  const cacheKey = `featured:${featuredQuery}:${startIndex}:${maxResults}`;
  const cached = getFromCache(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const data = await requestGoogleBooks('', {
      q: featuredQuery,
      startIndex,
      maxResults,
      printType: 'books',
    });

    const result = data.items || [];

    saveToCache(cacheKey, result);

    return res.json(result);
  } catch (error) {
    console.error('Failed to fetch featured books', error.message);

    if (error.response?.status === 429) {
      const fallbackBooks = getDemoBooks(startIndex, maxResults);

      return res.json({
        items: fallbackBooks,
        totalItems: demoBooks.length,
        source: 'demo-fallback',
        message:
          'Google Books API chwilowo odrzuca zapytania, dlatego wyświetlane są dane demonstracyjne.',
      });
    }

    return res.status(500).json({
      error: 'GOOGLE_BOOKS_ERROR',
      message: 'Nie udało się pobrać polecanych książek.',
    });
  }
});

/**
 * GET /api/books/google/:googleBooksId
 */


router.get('/demo/:demoBookId', async (req, res) => {
  const { demoBookId } = req.params;
  const book = demoBooks.find((item) => item.id === demoBookId);

  if (!book) {
    return res.status(404).json({
      message: 'Nie znaleziono książki demonstracyjnej.',
    });
  }

  return res.json(book);
});

router.get('/google/:googleBooksId', async (req, res) => {
  const { googleBooksId } = req.params;

  const cacheKey = `book:${googleBooksId}`;
  const cached = getFromCache(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  try {
    const data = await requestGoogleBooks(googleBooksId);

    saveToCache(cacheKey, data);

    return res.json(data);
  } catch (error) {
    return handleGoogleError(error, res, 'Failed to fetch book details');
  }
});

/**
 * GET /api/books/:googleBooksId/reviews
 *
 * W trybie demo zwracamy pustą listę, żeby strona szczegółów książki
 * nie powodowała błędów Prisma i nie wymagała bazy użytkowników.
 */
router.get('/:googleBooksId/reviews', async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    return res.json([]);
  }

  const { googleBooksId } = req.params;

  try {
    const book = await prisma.book.findUnique({
      where: { googleBooksId },
    });

    if (!book) {
      return res.json([]);
    }

    const reviews = await prisma.review.findMany({
      where: { bookId: book.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(
      reviews.map((review) => ({
        id: review.id,
        user: {
          id: review.userId,
          username: review.user.username,
        },
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt,
      }))
    );
  } catch (error) {
    console.error('Failed to fetch reviews:', error.message);

    return res.status(500).json({
      error: 'Failed to fetch reviews',
    });
  }
});

/**
 * GET /api/books/categories
 */
router.get('/categories', async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    return res.json([
      'Literatura',
      'Nauka',
      'Fantastyka',
      'Psychologia',
      'Historia',
      'Biznes',
      'Informatyka',
      'Biografia',
    ]);
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return res.json(categories.map((category) => category.name));
  } catch (error) {
    console.error('Failed to fetch categories:', error.message);

    return res.status(500).json({
      error: 'Failed to fetch categories',
    });
  }
});

/**
 * POST /api/books/:googleBooksId/reviews
 *
 * Zablokowane w demo przez auth/token oraz praktycznie nieużywane publicznie.
 */
router.post('/:googleBooksId/reviews', authenticateToken, async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    return res.status(403).json({
      message: 'Dodawanie recenzji jest wyłączone w wersji demonstracyjnej.',
    });
  }

  const { googleBooksId } = req.params;
  const { rating, content, bookData } = req.body || {};

  try {
    const book = await findOrCreateBook({
      googleBooksId,
      ...(bookData || {}),
    });

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        bookId: book.id,
        rating,
        content,
      },
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error('Failed to add review:', error.message);

    return res.status(500).json({
      error: 'Failed to add review',
    });
  }
});

/**
 * GET /api/books/recommendations/popular
 */
router.get('/recommendations/popular', async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    return res.json([]);
  }

  try {
    const books = await prisma.book.findMany({
      take: 5,
      orderBy: {
        reviews: {
          _count: 'desc',
        },
      },
      include: {
        reviews: true,
      },
    });

    return res.json(books);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error.message);

    return res.status(500).json({
      error: 'Failed to fetch recommendations',
    });
  }
});

/**
 * GET /api/books/recommendations/personal
 */
router.get('/recommendations/personal', authenticateToken, async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    return res.status(403).json({
      message:
        'Personalizowane rekomendacje są wyłączone w wersji demonstracyjnej.',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const categories = user?.preferences?.categories || [];

    if (!categories.length) {
      return res.json([]);
    }

    const results = [];

    for (const category of categories) {
      const data = await requestGoogleBooks('', {
        q: `subject:${category}`,
        maxResults: 5,
        printType: 'books',
      });

      results.push(...(data.items || []));
    }

    const uniqueBooks = [];
    const seenIds = new Set();

    for (const item of results) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueBooks.push(item);
      }
    }

    return res.json(uniqueBooks);
  } catch (error) {
    console.error('Failed to fetch personal recommendations:', error.message);

    return res.status(500).json({
      error: 'Failed to fetch recommendations',
    });
  }
});

module.exports = router;