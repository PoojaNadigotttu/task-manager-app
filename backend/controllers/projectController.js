const Project = require("../models/Project");

exports.createProject = async (req, res) => {
  try {
    const { projectName } = req.body;

    const project = new Project({
      projectName,
      createdBy: req.user.id,      // 🔥 IMPORTANT
      members: [req.user.id]       // optional
    });

    await project.save();

    res.json(project);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};