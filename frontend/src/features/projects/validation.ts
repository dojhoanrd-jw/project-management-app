export const projectRules = {
  name: (v: string) => (!v.trim() ? 'Project name is required' : undefined),
  managerId: (v: string) => (!v ? 'Project manager is required' : undefined),
  dueDate: (v: string) => (!v ? 'Due date is required' : undefined),
};
