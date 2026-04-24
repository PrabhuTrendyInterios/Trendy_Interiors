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

  test('getProjects returns list with count', async () => {
    const sort = jest.fn().mockResolvedValue([{ _id: 'p1' }, { _id: 'p2' }]);
    Project.find.mockReturnValue({ sort });

    const req = { query: {} };
    const res = createMockRes();

    await controller.getProjects(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 2 }));
  });

  test('createProject returns validation error message', async () => {
    Project.create.mockRejectedValue({
      name: 'ValidationError',
      errors: { title: { message: 'title required' } },
    });

    const req = { body: {} };
    const res = createMockRes();

    await controller.createProject(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'title required' });
  });

  test('updateProject returns 404 when id is missing', async () => {
    Project.findById.mockResolvedValue(null);

    const req = { params: { id: 'x' }, body: {} };
    const res = createMockRes();

    await controller.updateProject(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deleteProject deletes existing project', async () => {
    const deleteOne = jest.fn().mockResolvedValue(undefined);
    Project.findById.mockResolvedValue({ _id: 'p1', deleteOne });

    const req = { params: { id: 'p1' } };
    const res = createMockRes();

    await controller.deleteProject(req, res, jest.fn());

    expect(deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
