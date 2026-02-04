const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const isLocal = process.argv.includes('--local');

const client = new DynamoDBClient(
  isLocal
    ? { region: 'localhost', endpoint: 'http://localhost:8000' }
    : { region: 'us-east-2' }
);

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'AppData';

const USERS = [
  { email: 'admin@demo.com', password: 'admin123', name: 'Admin User', role: 'admin' },
  { email: 'sarah@demo.com', password: 'sarah123', name: 'Sarah Connor', role: 'project_manager' },
  { email: 'john@demo.com', password: 'john1234', name: 'John Smith', role: 'member' },
  { email: 'maria@demo.com', password: 'maria123', name: 'Maria Garcia', role: 'member' },
];

const today = new Date();
const dateOffset = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// Project membership assignments:
// - Website Redesign: admin (owner), sarah (manager), john, maria
// - Mobile App v2: admin (owner), sarah (manager), john, maria
// - API Migration: admin (owner+manager), john
// - Analytics Dashboard: admin (owner), sarah (manager), maria
const buildProjects = () => {
  const ids = Array.from({ length: 4 }, () => crypto.randomUUID());

  return [
    {
      projectId: ids[0], name: 'Website Redesign', description: 'Complete overhaul of the company website with modern UI/UX',
      status: 'active', progress: 'on_track', managerId: 'sarah@demo.com', managerName: 'Sarah Connor',
      dueDate: dateOffset(30), createdAt: dateOffset(-15),
      members: [
        { email: 'admin@demo.com', name: 'Admin User', role: 'owner' },
        { email: 'sarah@demo.com', name: 'Sarah Connor', role: 'project_manager' },
        { email: 'john@demo.com', name: 'John Smith', role: 'member' },
        { email: 'maria@demo.com', name: 'Maria Garcia', role: 'member' },
      ],
    },
    {
      projectId: ids[1], name: 'Mobile App v2', description: 'Second version of the mobile application with new features',
      status: 'active', progress: 'at_risk', managerId: 'sarah@demo.com', managerName: 'Sarah Connor',
      dueDate: dateOffset(14), createdAt: dateOffset(-30),
      members: [
        { email: 'admin@demo.com', name: 'Admin User', role: 'owner' },
        { email: 'sarah@demo.com', name: 'Sarah Connor', role: 'project_manager' },
        { email: 'john@demo.com', name: 'John Smith', role: 'member' },
        { email: 'maria@demo.com', name: 'Maria Garcia', role: 'member' },
      ],
    },
    {
      projectId: ids[2], name: 'API Migration', description: 'Migrate legacy REST API to serverless architecture',
      status: 'active', progress: 'delayed', managerId: 'admin@demo.com', managerName: 'Admin User',
      dueDate: dateOffset(-2), createdAt: dateOffset(-45),
      members: [
        { email: 'admin@demo.com', name: 'Admin User', role: 'owner' },
        { email: 'john@demo.com', name: 'John Smith', role: 'member' },
      ],
    },
    {
      projectId: ids[3], name: 'Analytics Dashboard', description: 'Build real-time analytics dashboard for stakeholders',
      status: 'paused', progress: 'on_track', managerId: 'sarah@demo.com', managerName: 'Sarah Connor',
      dueDate: dateOffset(60), createdAt: dateOffset(-10),
      members: [
        { email: 'admin@demo.com', name: 'Admin User', role: 'owner' },
        { email: 'sarah@demo.com', name: 'Sarah Connor', role: 'project_manager' },
        { email: 'maria@demo.com', name: 'Maria Garcia', role: 'member' },
      ],
    },
  ];
};

const buildTasks = (projects) => {
  const tasks = [
    // Website Redesign tasks
    { projectIdx: 0, title: 'Design homepage mockup', assignee: 'john@demo.com', assigneeName: 'John Smith', status: 'completed', priority: 'high', category: 'important', hours: 8, dueDays: -5 },
    { projectIdx: 0, title: 'Implement responsive navbar', assignee: 'john@demo.com', assigneeName: 'John Smith', status: 'in_progress', priority: 'high', category: 'important', hours: 6, dueDays: 0 },
    { projectIdx: 0, title: 'Create color palette documentation', assignee: 'maria@demo.com', assigneeName: 'Maria Garcia', status: 'in_review', priority: 'medium', category: 'notes', hours: 3, dueDays: 2 },
    { projectIdx: 0, title: 'Setup CI/CD pipeline', assignee: 'admin@demo.com', assigneeName: 'Admin User', status: 'todo', priority: 'medium', category: 'important', hours: 4, dueDays: 7 },
    { projectIdx: 0, title: 'Add Figma design link', assignee: 'maria@demo.com', assigneeName: 'Maria Garcia', status: 'approved', priority: 'low', category: 'link', hours: 1, dueDays: 0 },

    // Mobile App v2 tasks
    { projectIdx: 1, title: 'Fix authentication flow bug', assignee: 'john@demo.com', assigneeName: 'John Smith', status: 'in_progress', priority: 'urgent', category: 'important', hours: 10, dueDays: -1 },
    { projectIdx: 1, title: 'Implement push notifications', assignee: 'maria@demo.com', assigneeName: 'Maria Garcia', status: 'todo', priority: 'high', category: 'important', hours: 12, dueDays: 5 },
    { projectIdx: 1, title: 'Write unit tests for auth module', assignee: 'john@demo.com', assigneeName: 'John Smith', status: 'todo', priority: 'medium', category: 'important', hours: 6, dueDays: 8 },
    { projectIdx: 1, title: 'App Store submission notes', assignee: 'sarah@demo.com', assigneeName: 'Sarah Connor', status: 'todo', priority: 'low', category: 'notes', hours: 2, dueDays: 12 },

    // API Migration tasks
    { projectIdx: 2, title: 'Map legacy endpoints', assignee: 'admin@demo.com', assigneeName: 'Admin User', status: 'completed', priority: 'high', category: 'important', hours: 8, dueDays: -10 },
    { projectIdx: 2, title: 'Create Lambda handlers', assignee: 'admin@demo.com', assigneeName: 'Admin User', status: 'in_progress', priority: 'urgent', category: 'important', hours: 16, dueDays: -3 },
    { projectIdx: 2, title: 'Database migration script', assignee: 'john@demo.com', assigneeName: 'John Smith', status: 'todo', priority: 'high', category: 'important', hours: 12, dueDays: 0 },
    { projectIdx: 2, title: 'API documentation link', assignee: 'maria@demo.com', assigneeName: 'Maria Garcia', status: 'todo', priority: 'medium', category: 'link', hours: 4, dueDays: 3 },

    // Analytics Dashboard tasks
    { projectIdx: 3, title: 'Define KPI metrics', assignee: 'sarah@demo.com', assigneeName: 'Sarah Connor', status: 'completed', priority: 'high', category: 'important', hours: 4, dueDays: -8 },
    { projectIdx: 3, title: 'Design chart components', assignee: 'maria@demo.com', assigneeName: 'Maria Garcia', status: 'in_review', priority: 'medium', category: 'important', hours: 8, dueDays: 15 },
  ];

  return tasks.map((t) => {
    const taskId = crypto.randomUUID();
    const project = projects[t.projectIdx];

    return {
      PK: `PROJECT#${project.projectId}`,
      SK: `TASK#${taskId}`,
      GSI1PK: `ASSIGNEE#${t.assignee}`,
      GSI1SK: `TASK#${taskId}`,
      taskId,
      title: t.title,
      description: '',
      projectId: project.projectId,
      projectName: project.name,
      status: t.status,
      priority: t.priority,
      category: t.category,
      assigneeId: t.assignee,
      assigneeName: t.assigneeName,
      estimatedHours: t.hours,
      dueDate: dateOffset(t.dueDays),
      type: 'task',
      createdAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
    };
  });
};

const buildMemberships = (projects) => {
  const memberships = [];

  for (const project of projects) {
    for (const member of project.members) {
      memberships.push({
        PK: `USER#${member.email}`,
        SK: `MEMBER#${project.projectId}`,
        GSI1PK: `PROJECT#${project.projectId}`,
        GSI1SK: `MEMBER#${member.email}`,
        projectId: project.projectId,
        email: member.email,
        name: member.name,
        memberRole: member.role,
        type: 'membership',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return memberships;
};

const buildProjectItems = (projects) => {
  return projects.map((project) => ({
    PK: `PROJECT#${project.projectId}`,
    SK: 'META',
    projectId: project.projectId,
    name: project.name,
    description: project.description,
    status: project.status,
    progress: project.progress,
    managerId: project.managerId,
    managerName: project.managerName,
    dueDate: project.dueDate,
    members: project.members,
    type: 'project',
    createdAt: project.createdAt,
  }));
};

const seed = async () => {
  // Seed users
  for (const user of USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${user.email}`,
          SK: 'PROFILE',
          email: user.email,
          name: user.name,
          password: hashedPassword,
          role: user.role,
          type: 'user',
          createdAt: new Date().toISOString(),
        },
      })
    );
    console.log(`User created: ${user.email} (${user.role})`);
  }

  // Build project data
  const projects = buildProjects();

  // Seed project META records
  const projectItems = buildProjectItems(projects);
  for (const item of projectItems) {
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    console.log(`Project created: ${item.name}`);
  }

  // Seed membership records
  const memberships = buildMemberships(projects);
  for (const membership of memberships) {
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: membership }));
    console.log(`Membership: ${membership.email} -> ${membership.projectId.substring(0, 8)}...`);
  }

  // Seed tasks
  const tasks = buildTasks(projects);
  for (const task of tasks) {
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: task }));
    console.log(`Task created: ${task.title}`);
  }

  console.log('\n--- Seed completed ---');
  console.log(`Users: ${USERS.length}`);
  console.log(`Projects: ${projects.length}`);
  console.log(`Memberships: ${memberships.length}`);
  console.log(`Tasks: ${tasks.length}`);
  console.log('\nLogin credentials:');
  console.log('  admin@demo.com / admin123 (sees all 4 projects)');
  console.log('  sarah@demo.com / sarah123 (sees 3 projects: Website, Mobile, Analytics)');
  console.log('  john@demo.com / john1234 (sees 3 projects: Website, Mobile, API Migration)');
  console.log('  maria@demo.com / maria123 (sees 3 projects: Website, Mobile, Analytics)');
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
