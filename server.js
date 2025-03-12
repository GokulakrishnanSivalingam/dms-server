require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
app.get("/api/news", async (req, res) => {
  try {
      const response = await axios.get(
          `https://newsapi.org/v2/everything?q=(natural disaster OR earthquake OR flood OR hurricane OR tsunami OR wildfire OR emergency)&language=en&sortBy=relevancy&pageSize=6&apiKey=79316c41264f41deaf480bbc126e3254`
      );
      res.json(response.data);
  } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
  }
});
// Connect to MongoDB
mongoose.connect("mongodb+srv://dm:avs@cluster1.6oksn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1")
.then(() => {
  console.log('Connected to MongoDB');
  
  const PORT=5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});
