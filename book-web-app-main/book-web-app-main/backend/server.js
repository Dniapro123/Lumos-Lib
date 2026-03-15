const axios = require('axios');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const PORT = process.env.PORT || 3000;
const userRoutes = require('./routes/user');

app.use(cors()); // Allow cross-origin requests
app.use(express.json());
app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
const GOOGLE_BOOKS_API_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';


// Start the server after all routes are defined
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
