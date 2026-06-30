const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateTask } = require('../middlewares/validationMiddleware');

router.use(authMiddleware);

router.get('/', taskController.getTasks);
router.get('/stats', taskController.getDashboardStats);
router.get('/:id', taskController.getTaskById);
router.post('/', validateTask, taskController.createTask);
router.put('/:id', validateTask, taskController.updateTask);
router.put('/:id/toggle', taskController.toggleComplete);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
