// apps/api/src/__tests__/task.service.test.ts
import { getPriorityTasks } from '../services/task.service'; 
import { prisma } from '@repo/database';

// 1. Tell Jest to intercept ANY calls to your database
jest.mock('@repo/database', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
    },
  },
}));

describe('Task Service - getPriorityTasks', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Resets the fake database after every single test
  });

  it('should fetch up to 5 priority tasks for a specific user', async () => {
    // 2. Create the fake data
    const fakeTasks = [
      { id: 'task-1', title: 'Fix login bug', priority: 'URGENT', status: 'IN_PROGRESS' },
      { id: 'task-2', title: 'Update documentation', priority: 'HIGH', status: 'TODO' },
    ];

    // 3. Force the mock Prisma client to return our fake data
    (prisma.task.findMany as jest.Mock).mockResolvedValue(fakeTasks);

    // 4. Call the function we just added to task.service.ts
    const result = await getPriorityTasks('workspace-123', 'user-456');

    // 5. Prove that the function works!
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Fix login bug');
    
    // 6. Prove that Prisma was called with the exact right filters
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        where: expect.objectContaining({
          assigneeId: 'user-456',
          priority: { in: ["HIGH", "URGENT", "MEDIUM"] }
        })
      })
    );
  });
});