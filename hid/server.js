require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const figmaRoutes = require('./routes/figma');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error(err));

// Routes
app.use('/api/figma', figmaRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
