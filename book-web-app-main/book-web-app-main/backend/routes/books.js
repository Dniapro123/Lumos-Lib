const express = require('express');
const axios = require('axios');
const router = express.Router();
const prisma = require('../prisma');
const authenticateToken = require('../middleware/authMiddleware');

const GOOGLE_BOOKS_API_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const GOOGLE_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

async function findOrCreateBook(data) {
  const { googleBooksId, title, subtitle, description, publishedDate, pageCount, language, thumbnailUrl, previewLink, infoLink, averageRating, ratingsCount, isbn10, isbn13, authors, categories } = data;
  let book = await prisma.book.findUnique({ where: { googleBooksId } });
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
        isbn13
      }
    });

    for (const name of authors || []) {
      const author = await prisma.author.upsert({ where: { name }, update: {}, create: { name } });
      await prisma.bookAuthor.create({ data: { bookId: book.id, authorId: author.id } });
    }
    for (const name of categories || []) {
      const category = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
      await prisma.bookCategory.create({ data: { bookId: book.id, categoryId: category.id } });
    }
  }
  return book;
}

router.get('/google/:googleBooksId', async (req, res) => {
  const { googleBooksId } = req.params;

  try {
    const response = await axios.get(`${GOOGLE_BOOKS_API_BASE_URL}/${googleBooksId}`, {
      params: {
        key: GOOGLE_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching book from Google API:', error.message);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// General search from Google Books API
router.get('/search', async (req, res) => {
  const { q, startIndex = 0, maxResults = 20 } = req.query;

  if (!q) return res.status(400).json({ error: 'Missing search query (q)' });

  try {
    const response = await axios.get(GOOGLE_BOOKS_API_BASE_URL, {
      params: {
        q,
        startIndex,
        maxResults,
        key: GOOGLE_API_KEY
      }
    });

    res.json({ items: response.data.items || [] });

  } catch (error) {
    console.error('Google Books API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from Google Books API' });
  }
});

// Featured books (you can define a query term like "bestsellers", "trending", etc.)
router.get('/featured', async (req, res) => {
  const { startIndex = 0, maxResults = 20 } = req.query;
  try {
    const response = await axios.get(GOOGLE_BOOKS_API_BASE_URL, {
      params: {
        q: 'featured',
        startIndex,
        maxResults,
        key: GOOGLE_API_KEY
      }
    });

    res.json(response.data.items || []);
  } catch (error) {
    console.error('Error fetching featured books:', error.message);
    res.status(500).json({ error: 'Failed to fetch featured books' });
  }
});

// List reviews for a book
router.get('/:googleBooksId/reviews', async (req, res) => {
  const { googleBooksId } = req.params;
  try {
    const book = await prisma.book.findUnique({ where: { googleBooksId } });
    if (!book) return res.json([]);
    const reviews = await prisma.review.findMany({
      where: { bookId: book.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews.map(r => ({
      id: r.id,
      user: { id: r.userId, username: r.user.username },
      rating: r.rating,
      content: r.content,
      createdAt: r.createdAt
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get list of categories from the database
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories.map(c => c.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Add review for a book
router.post('/:googleBooksId/reviews', authenticateToken, async (req, res) => {
  const { googleBooksId } = req.params;
  const { rating, content, bookData } = req.body || {};
  try {
    const book = await findOrCreateBook({ googleBooksId, ...(bookData || {}) });
    const review = await prisma.review.create({
      data: { userId: req.user.id, bookId: book.id, rating, content }
    });
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Recommendations based on most reviewed books
router.get('/recommendations/popular', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      take: 5,
      orderBy: { reviews: { _count: 'desc' } },
      include: { reviews: true }
    });
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Personalized recommendations based on user's preferred categories
router.get('/recommendations/personal', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const categories = user?.preferences?.categories || [];
    if (!categories.length) return res.json([]);

    const results = [];
    for (const cat of categories) {
      const response = await axios.get(GOOGLE_BOOKS_API_BASE_URL, {
        params: {
          q: `subject:${cat}`,
          maxResults: 5,
          key: GOOGLE_API_KEY,
        },
      });
      results.push(...(response.data.items || []));
    }

    const unique = [];
    const map = new Map();
    for (const item of results) {
      if (!map.has(item.id)) {
        map.set(item.id, true);
        unique.push(item);
      }
    }
    res.json(unique);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});


module.exports = router;
