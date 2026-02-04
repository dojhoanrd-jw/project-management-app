const { z } = require('zod');

const createProjectSchema = z.object({
  name: z
    .string({ message: 'Project name is required' })
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .default(''),
  status: z
    .enum(['active', 'paused'], { message: 'Status must be active or paused' })
    .default('active'),
  progress: z
    .enum(['on_track', 'at_risk', 'delayed', 'completed'], {
      message: 'Progress must be on_track, at_risk, delayed or completed',
    })
    .default('on_track'),
  managerId: z
    .string({ message: 'Manager ID is required' })
    .min(1, 'Manager ID cannot be empty'),
  managerName: z
    .string({ message: 'Manager name is required' })
    .min(1, 'Manager name cannot be empty'),
  dueDate: z
    .string({ message: 'Due date is required' })
    .date('Due date must be a valid date (YYYY-MM-DD)'),
  members: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        role: z.string().min(1),
      })
    )
    .optional()
    .default([]),
});

const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  status: z
    .enum(['active', 'paused'], { message: 'Status must be active or paused' })
    .optional(),
  progress: z
    .enum(['on_track', 'at_risk', 'delayed', 'completed'], {
      message: 'Progress must be on_track, at_risk, delayed or completed',
    })
    .optional(),
  managerId: z
    .string()
    .min(1, 'Manager ID cannot be empty')
    .optional(),
  managerName: z
    .string()
    .min(1, 'Manager name cannot be empty')
    .optional(),
  dueDate: z
    .string()
    .date('Due date must be a valid date (YYYY-MM-DD)')
    .optional(),
});

module.exports = { createProjectSchema, updateProjectSchema };
