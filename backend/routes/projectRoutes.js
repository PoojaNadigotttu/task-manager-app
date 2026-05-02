const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { createProject } = require("../controllers/projectController");
const Project = require("../models/Project");

// CREATE PROJECT
router.post("/create", auth, createProject);

// GET PROJECTS OF LOGGED-IN USER
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      createdBy: req.params.userId   // 🔥 IMPORTANT
    });

    res.json(projects);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;