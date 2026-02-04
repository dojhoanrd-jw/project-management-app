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
    .enum(['todo', 'in_progress', 'in_review', 'approved', 'completed'], {
      message: 'Status must be todo, in_progress, in_review, approved or completed',
    })
    .default('todo'),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'], {
      message: 'Priority must be low, medium, high or urgent',
    })
    .default('medium'),
  category: z
    .enum(['important', 'link', 'notes'], {
      message: 'Category must be important, link or notes',
    })
    .default('important'),
  assigneeId: z
    .string({ message: 'Assignee ID is required' })
    .min(1, 'Assignee ID cannot be empty'),
  assigneeName: z
    .string({ message: 'Assignee name is required' })
    .min(1, 'Assignee name cannot be empty'),
  estimatedHours: z
    .number({ message: 'Estimated hours is required' })
    .min(0.5, 'Estimated hours must be at least 0.5')
    .max(999, 'Estimated hours must be 999 or less'),
  dueDate: z
    .string({ message: 'Due date is required' })
    .date('Due date must be a valid date (YYYY-MM-DD)'),
});

const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title cannot be empty')
    .max(150, 'Task title must be 150 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  status: z
    .enum(['todo', 'in_progress', 'in_review', 'approved', 'completed'], {
      message: 'Status must be todo, in_progress, in_review, approved or completed',
    })
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'], {
      message: 'Priority must be low, medium, high or urgent',
    })
    .optional(),
  category: z
    .enum(['important', 'link', 'notes'], {
      message: 'Category must be important, link or notes',
    })
    .optional(),
  assigneeId: z
    .string()
    .min(1, 'Assignee ID cannot be empty')
    .optional(),
  assigneeName: z
    .string()
    .min(1, 'Assignee name cannot be empty')
    .optional(),
  estimatedHours: z
    .number()
    .min(0.5, 'Estimated hours must be at least 0.5')
    .max(999, 'Estimated hours must be 999 or less')
    .optional(),
  dueDate: z
    .string()
    .date('Due date must be a valid date (YYYY-MM-DD)')
    .optional(),
});

module.exports = { createTaskSchema, updateTaskSchema };
