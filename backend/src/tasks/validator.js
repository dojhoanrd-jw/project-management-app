const { z } = require('zod');

const createTaskSchema = z.object({
  title: z
    .string({ message: 'Task title is required' })
    .min(1, 'Task title cannot be empty')
    .max(150, 'Task title must be 150 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .default(''),
  projectId: z
    .string({ message: 'Project ID is required' })
    .min(1, 'Project ID cannot be empty'),
  status: z
    .enum(['pending', 'in_progress', 'completed'], {
      message: 'Status must be pending, in_progress or completed',
    })
    .default('pending'),
  dueDate: z
    .string({ message: 'Due date is required' })
    .date('Due date must be a valid date (YYYY-MM-DD)'),
});

module.exports = { createTaskSchema };
