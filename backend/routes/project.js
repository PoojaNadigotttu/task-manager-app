const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// CREATE PROJECT
router.post("/create", async (req, res) => {
  try {
    const { projectName, createdBy } = req.body;

    const project = new Project({
      projectName,
      createdBy,
      members: [createdBy]
    });

    await project.save();

    res.json({ msg: "Project created", project });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PROJECTS BY USER  ✅ (THIS WAS MISSING)
router.get("/user/:userId", async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.params.userId
    });

    res.json(projects);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;