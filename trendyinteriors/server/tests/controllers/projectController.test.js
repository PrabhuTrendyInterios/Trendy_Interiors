jest.mock('../../models/Project', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const Project = require('../../models/Project');
const controller = require('../../controllers/projectController');
const { createMockRes } = require('../helpers/mockExpress');

describe('server/controllers/projectController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getProjects returns list without limit', async () => {
    const sort = jest.fn().mockResolvedValue([
      { _id: 'p1', title: 'Project 1' },
      { _id: 'p2', title: 'Project 2' },
      { _id: 'p3', title: 'Project 3' }
    ]);
    Project.find.mockReturnValue({ sort });

    const req = { query: {} };
    const res = createMockRes();

    await controller.getProjects(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      success: true, 
      count: 3,
      data: expect.any(Array)
    }));
  });

  test('getProjects applies limit from query', async () => {
    const limit = jest.fn().mockResolvedValue([{ _id: 'p1' }]);
    const sort = jest.fn().mockReturnValue({ limit });
    Project.find.mockReturnValue({ sort });

    const req = { query: { limit: '1' } };
    const res = createMockRes();

    await controller.getProjects(req, res, jest.fn());

    expect(limit).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getProjects handles database error', async () => {
    const sort = jest.fn().mockRejectedValue(new Error('Database error'));
    Project.find.mockReturnValue({ sort });

    const req = { query: {} };
    const res = createMockRes();

    await controller.getProjects(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      error: 'Server Error'
    });
  });

  test('createProject succeeds with valid data', async () => {
    const projectData = { title: 'New Project', description: 'A new project' };
    Project.create.mockResolvedValue({ _id: 'p1', ...projectData });

    const req = { body: projectData };
    const res = createMockRes();

    await controller.createProject(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.any(Object)
    }));
  });

  test('createProject returns validation error message', async () => {
    Project.create.mockRejectedValue({
      name: 'ValidationError',
      errors: { 
        title: { message: 'title required' },
        description: { message: 'description required' }
      },
    });

    const req = { body: {} };
    const res = createMockRes();

    await controller.createProject(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.stringContaining('title required')
    }));
  });

  test('createProject handles server error', async () => {
    Project.create.mockRejectedValue(new Error('Database error'));

    const req = { body: { title: 'Test' } };
    const res = createMockRes();

    await controller.createProject(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server Error'
    });
  });

  test('updateProject succeeds with valid data', async () => {
    const projectData = { title: 'Updated Project' };
    Project.findById.mockResolvedValue({ _id: 'p1', title: 'Old' });
    Project.findByIdAndUpdate.mockResolvedValue({ _id: 'p1', ...projectData });

    const req = { params: { id: 'p1' }, body: projectData };
    const res = createMockRes();

    await controller.updateProject(req, res, jest.fn());

    expect(Project.findById).toHaveBeenCalledWith('p1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.any(Object)
    }));
  });

  test('updateProject returns 404 when project not found', async () => {
    Project.findById.mockResolvedValue(null);

    const req = { params: { id: 'nonexistent' }, body: {} };
    const res = createMockRes();

    await controller.updateProject(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Project not found'
    }));
  });

  test('updateProject handles validation error', async () => {
    Project.findById.mockResolvedValue({ _id: 'p1' });
    Project.findByIdAndUpdate.mockRejectedValue({
      name: 'ValidationError',
      errors: { title: { message: 'Invalid title' } }
    });

    const req = { params: { id: 'p1' }, body: { title: 'x' } };
    const res = createMockRes();

    await controller.updateProject(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.stringContaining('Invalid title')
    }));
  });

  test('updateProject handles server error', async () => {
    Project.findById.mockResolvedValue({ _id: 'p1' });
    Project.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

    const req = { params: { id: 'p1' }, body: {} };
    const res = createMockRes();

    await controller.updateProject(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server Error'
    });
  });

  test('deleteProject succeeds', async () => {
    const deleteOne = jest.fn().mockResolvedValue(undefined);
    Project.findById.mockResolvedValue({ _id: 'p1', deleteOne });

    const req = { params: { id: 'p1' } };
    const res = createMockRes();

    await controller.deleteProject(req, res, jest.fn());

    expect(deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: {}
    }));
  });

  test('deleteProject returns 404 when project not found', async () => {
    Project.findById.mockResolvedValue(null);

    const req = { params: { id: 'nonexistent' } };
    const res = createMockRes();

    await controller.deleteProject(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Project not found'
    }));
  });

  test('deleteProject handles error', async () => {
    Project.findById.mockResolvedValue({ 
      _id: 'p1',
      deleteOne: jest.fn().mockRejectedValue(new Error('Delete failed'))
    });

    const req = { params: { id: 'p1' } };
    const res = createMockRes();

    await controller.deleteProject(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server Error'
    });
  });
});
