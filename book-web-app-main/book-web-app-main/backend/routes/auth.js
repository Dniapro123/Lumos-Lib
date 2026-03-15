const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const crypto = require('crypto');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err); // 👈 log this!
    res.status(400).json({ error: 'User already exists or bad data' });
  }
  
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '30d' });

  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

// Request password reset
router.post('/request-reset', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(200).json({ message: 'If that account exists, a reset link has been sent.' });
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({ data: { token, userId: user.id } });
  // Here you'd normally send email. We simply return the token.
  res.json({ message: 'Password reset token generated', token });
});

// Reset password
router.post('/reset', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt) return res.status(400).json({ error: 'Invalid token' });
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  res.json({ message: 'Password updated' });
});

module.exports = router;
