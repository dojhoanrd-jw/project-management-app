const { z } = require('zod');

const createUserSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Must be a valid email'),
  name: z
    .string({ message: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or less'),
  role: z
    .enum(['admin', 'project_manager', 'member'], {
      message: 'Role must be admin, project_manager or member',
    })
    .default('member'),
  password: z
    .string({ message: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
});

const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  role: z
    .enum(['admin', 'project_manager', 'member'], {
      message: 'Role must be admin, project_manager or member',
    })
    .optional(),
});

module.exports = { createUserSchema, updateUserSchema };
