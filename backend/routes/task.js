const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const auth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/authMiddleware").isAdmin;


// ================= CREATE TASK (ROLE PROTECTED) =================
router.post("/create", auth, isAdmin, async (req, res) => {
  try {

    const { title, description, projectId, assignedTo, priority, dueDate } = req.body;

    const task = new Task({
      title,
      description,
      projectId,
      assignedTo,
      priority,
      dueDate,
      status: "todo"
    });

    await task.save();

    res.json({ msg: "Task created", task });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= GET TASKS BY PROJECT =================
router.get("/project/:projectId", auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      projectId: req.params.projectId
    });

    res.json(tasks);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= GET TASKS BY USER =================
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.params.userId
    });

    res.json(tasks);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= UPDATE TASK =================
router.put("/update/:taskId", auth, async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status },
      { new: true }
    );

    res.json({ msg: "Task updated", task });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= DASHBOARD =================
router.get("/dashboard/:userId", auth, async (req, res) => {
  try {
    const userId = req.params.userId;

    const tasks = await Task.find({ assignedTo: userId });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "done").length;
    const pending = tasks.filter(t => t.status !== "done").length;

    const overdue = tasks.filter(t =>
      new Date(t.dueDate) < new Date() && t.status !== "done"
    ).length;

    res.json({
      total,
      completed,
      pending,
      overdue
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;