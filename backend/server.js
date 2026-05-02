const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/project");
const taskRoutes = require("./routes/task");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/task", taskRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// DB Connection
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("ERROR: MONGO_URI environment variable is not set");
  process.exit(1);
}

// Ensure authSource is included for authentication
const connectionUri = mongoUri.includes('authSource') ? mongoUri : `${mongoUri}?authSource=admin`;

mongoose.connect(connectionUri, {
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
})
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("Connection string:", mongoUri);
  });

// Server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});