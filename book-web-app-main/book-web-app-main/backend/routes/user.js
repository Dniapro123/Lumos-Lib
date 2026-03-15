const express = require('express');
const prisma = require('../prisma');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();
const { serializeUser } = require('../utils/serializer');

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
        data: { bookId: book.id, authorId: author.id },
      });
    }

    for (const name of categories || []) {
      const category = await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      await prisma.bookCategory.create({
        data: { bookId: book.id, categoryId: category.id },
      });
    }
  }
  return book;
}
// POST /api/user/books - Add book to logged-in user's library
router.post('/user/books', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const book = await findOrCreateBook(req.body);

    // Link book to user
    await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId,
          bookId: book.id
        }
      },
      update: {},
      create: {
        userId,
        bookId: book.id,
        status: 'added'
      }
    });

    res.status(201).json({ message: 'Book added to library', book });
  } catch (error) {
    console.error('Add Book Error:', error);
    res.status(500).json({ error: 'Failed to add book to user library' });
  }
});

router.get('/user/books', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const userBooks = await prisma.userBook.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
      include: {
        book: {
          include: {
            authors: { include: { author: true } },
            categories: { include: { category: true } }
          }
        }
      }
    });
    const books = userBooks.map(ub => {
      const b = ub.book;
      return {
        id: b.googleBooksId || String(b.id),
        addedAt: ub.addedAt,
        volumeInfo: {
          title: b.title,
          subtitle: b.subtitle,
          description: b.description,
          publishedDate: b.publishedDate?.toISOString(),
          pageCount: b.pageCount,
          language: b.language,
          averageRating: b.averageRating,
          ratingsCount: b.ratingsCount,
          authors: b.authors.map(a => a.author.name),
          categories: b.categories.map(c => c.category.name),
          imageLinks: { thumbnail: b.thumbnailUrl },
          infoLink: b.infoLink
        }
      };
    });
    res.json(books);
  } catch (error) {
    console.error('Fetch User Books Error:', error);
    res.status(500).json({ error: 'Failed to fetch user books' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const serialized = serializeUser(user);
    res.json(serialized);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create a new shelf
router.post('/user/shelves', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const shelf = await prisma.shelf.create({ data: { name, userId } });
    res.status(201).json(shelf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create shelf' });
  }
});

// Generate share token for shelf
router.post('/user/shelves/:id/share', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const shelfId = parseInt(req.params.id, 10);
  try {
    const shelf = await prisma.shelf.findFirst({ where: { id: shelfId, userId } });
    if (!shelf) return res.status(404).json({ error: 'Shelf not found' });
    if (!shelf.shareToken) {
      const token = require('crypto').randomBytes(16).toString('hex');
      await prisma.shelf.update({ where: { id: shelf.id }, data: { shareToken: token } });
      shelf.shareToken = token;
    }
    res.json({ shareToken: shelf.shareToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate share token' });
  }
});

// Update shelf name and visibility
router.put('/user/shelves/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const shelfId = parseInt(req.params.id, 10);
  const { name, isPublic } = req.body || {};
  try {
    const shelf = await prisma.shelf.findFirst({ where: { id: shelfId, userId } });
    if (!shelf) return res.status(404).json({ error: 'Shelf not found' });
    const data = {};
    if (name !== undefined) data.name = name;
    if (isPublic !== undefined) {
      if (isPublic) {
        if (!shelf.shareToken) {
          data.shareToken = require('crypto').randomBytes(16).toString('hex');
        }
      } else {
        data.shareToken = null;
      }
    }
    const updated = await prisma.shelf.update({ where: { id: shelfId }, data });
    res.json({
      id: updated.id,
      name: updated.name,
      shareToken: updated.shareToken,
      isPublic: !!updated.shareToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update shelf' });
  }
});

// Delete a shelf
router.delete('/user/shelves/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const shelfId = parseInt(req.params.id, 10);
  try {
    const shelf = await prisma.shelf.findFirst({ where: { id: shelfId, userId } });
    if (!shelf) return res.status(404).json({ error: 'Shelf not found' });
    await prisma.shelfBook.deleteMany({ where: { shelfId } });
    await prisma.shelf.delete({ where: { id: shelfId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete shelf' });
  }
});

// Update profile/preferences
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { username, preferences } = req.body || {};
    const data = {};
    if (username) data.username = username;
    if (preferences !== undefined) data.preferences = preferences;
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json(serializeUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Delete account and all user data
router.delete('/me', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    await prisma.shelfBook.deleteMany({ where: { shelf: { userId } } });
    await prisma.shelf.deleteMany({ where: { userId } });
    await prisma.userBook.deleteMany({ where: { userId } });
    await prisma.review.deleteMany({ where: { userId } });
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Get shelves with books
router.get('/user/shelves', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const shelves = await prisma.shelf.findMany({
      where: { userId },
      include: {
        shelfBooks: {
          include: {
            book: {
              include: {
                authors: { include: { author: true } },
                categories: { include: { category: true } },
              },
            },
          },
        },
      },
    });
    const result = shelves.map(s => ({
      id: s.id,
      name: s.name,
      shareToken: s.shareToken,
      isPublic: !!s.shareToken,
      books: s.shelfBooks.map(sb => ({
        id: sb.book.googleBooksId || String(sb.book.id),
        volumeInfo: {
          title: sb.book.title,
          subtitle: sb.book.subtitle,
          description: sb.book.description,
          publishedDate: sb.book.publishedDate?.toISOString(),
          pageCount: sb.book.pageCount,
          language: sb.book.language,
          authors: sb.book.authors.map(a => a.author.name),
          categories: sb.book.categories.map(c => c.category.name),
          imageLinks: { thumbnail: sb.book.thumbnailUrl },
          infoLink: sb.book.infoLink,
        },
      }))
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch shelves' });
  }
});

// Add book to shelf
router.post('/user/shelves/:id/books', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const shelfId = parseInt(req.params.id, 10);
  try {
    const shelf = await prisma.shelf.findFirst({ where: { id: shelfId, userId } });
    if (!shelf) return res.status(404).json({ error: 'Shelf not found' });

    const book = await findOrCreateBook(req.body);

    await prisma.shelfBook.upsert({
      where: { shelfId_bookId: { shelfId, bookId: book.id } },
      update: {},
      create: { shelfId, bookId: book.id },
    });

    // ensure book exists in user's library as well
    await prisma.userBook.upsert({
      where: { userId_bookId: { userId, bookId: book.id } },
      update: {},
      create: { userId, bookId: book.id, status: 'added' },
    });

    res.status(201).json({ message: 'Book added to shelf' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add book to shelf' });
  }
});

// View shared shelf
router.get('/shared/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const shelf = await prisma.shelf.findFirst({
      where: { shareToken: token },
      include: {
        shelfBooks: {
          include: {
            book: {
              include: {
                authors: { include: { author: true } },
                categories: { include: { category: true } }
              }
            }
          }
        }
      }
    });
    if (!shelf) return res.status(404).json({ error: 'Shelf not found' });
    const result = {
      id: shelf.id,
      name: shelf.name,
      books: shelf.shelfBooks.map(sb => ({
        id: sb.book.googleBooksId || String(sb.book.id),
        volumeInfo: {
          title: sb.book.title,
          subtitle: sb.book.subtitle,
          description: sb.book.description,
          publishedDate: sb.book.publishedDate?.toISOString(),
          pageCount: sb.book.pageCount,
          language: sb.book.language,
          authors: sb.book.authors.map(a => a.author.name),
          categories: sb.book.categories.map(c => c.category.name),
          imageLinks: { thumbnail: sb.book.thumbnailUrl },
          infoLink: sb.book.infoLink
        }
      }))
    };
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch shared shelf' });
  }
});

// Remove a book from a specific shelf
router.delete('/user/shelves/:shelfId/books/:bookId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const shelfId = parseInt(req.params.shelfId, 10);
  const googleBooksId = req.params.bookId;

  try {
    const shelf = await prisma.shelf.findFirst({ where: { id: shelfId, userId } });
    if (!shelf) return res.status(404).json({ error: 'Shelf not found' });

    const book = await prisma.book.findFirst({ where: { googleBooksId } });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    await prisma.shelfBook.deleteMany({ where: { shelfId, bookId: book.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove book from shelf' });
  }
});

// Remove a book from all shelves of the user
router.delete('/user/shelves/books/:bookId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const googleBooksId = req.params.bookId;

  try {
    const book = await prisma.book.findFirst({ where: { googleBooksId } });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const shelves = await prisma.shelf.findMany({ where: { userId } });
    await prisma.shelfBook.deleteMany({
      where: { shelfId: { in: shelves.map(s => s.id) }, bookId: book.id }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove book from all shelves' });
  }
});

// Public profile with public shelves only
router.get('/:id/public', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        shelves: {
          where: { NOT: { shareToken: null } },
          select: { id: true, name: true, shareToken: true }
        }
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      username: user.username,
      shelves: user.shelves.map(s => ({
        id: s.id,
        name: s.name,
        shareToken: s.shareToken
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch public profile' });
  }
});

module.exports = router;
