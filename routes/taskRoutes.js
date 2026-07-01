const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateTask } = require('../middlewares/validationMiddleware');

router.use(authMiddleware);

// Stats route HARUS sebelum getTasks (/) agar ter-match dengan benar
router.get('/stats', taskController.getDashboardStats);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', validateTask, taskController.createTask);
router.put('/:id', validateTask, taskController.updateTask);
router.put('/:id/toggle', taskController.toggleComplete);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
