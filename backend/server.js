require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const userRoutes = require('./routes/user');

const app = express();

const PORT = process.env.PORT || 3000;
const DEMO_MODE = process.env.DEMO_MODE === 'true';

app.use(cors());
app.use(express.json());

const blockDemoUserFeatures = (req, res, next) => {
  if (DEMO_MODE) {
    return res.status(403).json({
      message:
        'Logowanie, rejestracja oraz funkcje użytkownika są wyłączone w wersji demonstracyjnej.',
    });
  }

  next();
};

/**
 * Public endpoints:
 * - book search
  * - featured books
  * book details 
 */
app.use('/api/books', booksRoutes);

/**
  * Protected endpoints (blocked in demo mode):
  * - auth (login, register)
  * user (profile, reviews, favorites)
  * reviews (add, edit, delete)
  * favorites (add, remove)
 */
app.use('/api/auth', blockDemoUserFeatures, authRoutes);
app.use('/api', blockDemoUserFeatures, userRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    demoMode: DEMO_MODE,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Demo mode: ${DEMO_MODE ? 'ON' : 'OFF'}`);
});