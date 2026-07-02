const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');

// Route to create a new to-do item
router.post('/create-todo', todoController.createToDoItem);

// Route to get all to-do items for the organization
router.get('/get-items', todoController.getToDoItems);

// Route to update an existing to-do item
router.put('/update', todoController.updateToDoItem);

// Route to mark a task as completed
router.put('/mark-as-completed', todoController.markTaskAsCompleted);

// Route to delete a specific task from a to-do item
router.delete('/delete-task', todoController.deleteTask);

// Route to delete a to-do item
router.delete('/delete-todo/:toDoId', todoController.deleteToDoItem);

// Route to get task statistics
router.post('/task-statistics', todoController.getTaskStatistics);

module.exports = router;