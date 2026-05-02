const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

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

// DB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Server start
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));