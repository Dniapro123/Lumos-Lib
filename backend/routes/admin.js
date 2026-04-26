const express = require('express');
const prisma = require('../prisma');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Middleware to check admin flag
async function requireAdmin(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user?.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
}

router.get('/reviews', authenticateToken, requireAdmin, async (req, res) => {
  const reviews = await prisma.review.findMany({ include: { user: true, book: true } });
  res.json(reviews);
});

router.delete('/reviews/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await prisma.review.delete({ where: { id } });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
