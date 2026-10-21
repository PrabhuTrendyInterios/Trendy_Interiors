jest.mock('../../models/TeamMember', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const TeamMember = require('../../models/TeamMember');
const controller = require('../../controllers/teamMemberController');
const { createMockRes } = require('../helpers/mockExpress');

describe('server/controllers/teamMemberController', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getTeamMembers ──────────────────────────────────────────────────────────

  describe('getTeamMembers', () => {
    test('returns all active members sorted by displayOrder', async () => {
      const members = [
        { _id: 't1', name: 'Alice', role: 'Designer', contact: '9000000001', imageUrl: 'https://lh3.googleusercontent.com/d/IMG1', status: 'active', displayOrder: 1, toObject: function () { return this; } },
        { _id: 't2', name: 'Bob', role: 'PM', contact: '9000000002', imageUrl: 'https://lh3.googleusercontent.com/d/IMG2', status: 'active', displayOrder: 2, toObject: function () { return this; } },
      ];
      const sort = jest.fn().mockResolvedValue(members);
      TeamMember.find.mockReturnValue({ sort });

      const req = { query: {} };
      const res = createMockRes();

      await controller.getTeamMembers(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, count: 2 })
      );
    });

    test('returns 500 on database error', async () => {
      const sort = jest.fn().mockRejectedValue(new Error('DB error'));
      TeamMember.find.mockReturnValue({ sort });

      const res = createMockRes();
      await controller.getTeamMembers({ query: {} }, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getTeamMember ───────────────────────────────────────────────────────────

  describe('getTeamMember', () => {
    test('returns a single member by id', async () => {
      const member = { _id: 't1', name: 'Alice', role: 'Designer', contact: '9000000001', imageUrl: 'https://lh3.googleusercontent.com/d/IMG1', status: 'active', displayOrder: 1, toObject: function () { return this; } };
      TeamMember.findById.mockResolvedValue(member);

      const req = { params: { id: 't1' } };
      const res = createMockRes();

      await controller.getTeamMember(req, res, jest.fn());

      expect(TeamMember.findById).toHaveBeenCalledWith('t1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('returns 404 when member not found', async () => {
      TeamMember.findById.mockResolvedValue(null);

      const req = { params: { id: 'missing' } };
      const res = createMockRes();

      await controller.getTeamMember(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Team member not found' })
      );
    });
  });

  // ── createTeamMember ────────────────────────────────────────────────────────

  describe('createTeamMember', () => {
    test('creates member with Google Drive imageUrl for profile photo', async () => {
      const payload = {
        name: 'Priya',
        role: 'Interior Designer',
        contact: '9876543210',
        imageUrl: 'https://lh3.googleusercontent.com/d/DRIVE_FILE_ID',
      };
      const created = { _id: 'new1', ...payload, status: 'active', displayOrder: 0, toObject: function () { return this; } };
      TeamMember.create.mockResolvedValue(created);

      const req = { body: payload };
      const res = createMockRes();

      await controller.createTeamMember(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.imageUrl).toBe('https://lh3.googleusercontent.com/d/DRIVE_FILE_ID');
    });

    test('creates member with alternative image field alias', async () => {
      const payload = {
        name: 'Ravi',
        role: 'Architect',
        contact: '9123456789',
        image: 'https://lh3.googleusercontent.com/d/ALT_FILE_ID',
      };
      const created = {
        _id: 'new2',
        name: 'Ravi',
        role: 'Architect',
        contact: '9123456789',
        imageUrl: 'https://lh3.googleusercontent.com/d/ALT_FILE_ID',
        status: 'active',
        displayOrder: 0,
        toObject: function () { return this; },
      };
      TeamMember.create.mockResolvedValue(created);

      const req = { body: payload };
      const res = createMockRes();

      await controller.createTeamMember(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('returns 400 on validation error', async () => {
      TeamMember.create.mockRejectedValue({
        name: 'ValidationError',
        errors: { name: { message: 'name required' } },
      });

      const req = { body: {} };
      const res = createMockRes();

      await controller.createTeamMember(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining('name required') })
      );
    });

    test('returns 500 on unexpected error', async () => {
      TeamMember.create.mockRejectedValue(new Error('DB error'));

      const req = { body: { name: 'X', role: 'Y', contact: '1', imageUrl: 'u' } };
      const res = createMockRes();

      await controller.createTeamMember(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── updateTeamMember ────────────────────────────────────────────────────────

  describe('updateTeamMember', () => {
    test('updates member imageUrl with new Drive URL', async () => {
      const updated = {
        _id: 't1',
        name: 'Alice',
        role: 'Designer',
        contact: '9000000001',
        imageUrl: 'https://lh3.googleusercontent.com/d/NEW_DRIVE_FILE',
        status: 'active',
        displayOrder: 1,
        toObject: function () { return this; },
      };
      TeamMember.findByIdAndUpdate.mockResolvedValue(updated);

      const req = {
        params: { id: 't1' },
        body: { imageUrl: 'https://lh3.googleusercontent.com/d/NEW_DRIVE_FILE' },
      };
      const res = createMockRes();

      await controller.updateTeamMember(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.data.imageUrl).toBe('https://lh3.googleusercontent.com/d/NEW_DRIVE_FILE');
    });

    test('returns 404 when member not found on update', async () => {
      TeamMember.findByIdAndUpdate.mockResolvedValue(null);

      const req = { params: { id: 'gone' }, body: { name: 'X' } };
      const res = createMockRes();

      await controller.updateTeamMember(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 400 on validation error during update', async () => {
      TeamMember.findByIdAndUpdate.mockRejectedValue({
        name: 'ValidationError',
        errors: { role: { message: 'role required' } },
      });

      const req = { params: { id: 't1' }, body: { role: '' } };
      const res = createMockRes();

      await controller.updateTeamMember(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── deleteTeamMember ────────────────────────────────────────────────────────

  describe('deleteTeamMember', () => {
    test('deletes a member successfully', async () => {
      const deleteOne = jest.fn().mockResolvedValue(undefined);
      TeamMember.findById.mockResolvedValue({
        _id: 't1',
        name: 'Alice',
        deleteOne,
      });

      const req = { params: { id: 't1' } };
      const res = createMockRes();

      await controller.deleteTeamMember(req, res, jest.fn());

      expect(deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 404 when member to delete is not found', async () => {
      TeamMember.findById.mockResolvedValue(null);

      const req = { params: { id: 'missing' } };
      const res = createMockRes();

      await controller.deleteTeamMember(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 500 on get error', async () => {
      TeamMember.findById.mockRejectedValue(new Error('DB failure'));

      const req = { params: { id: 't1' } };
      const res = createMockRes();

      await controller.getTeamMember(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('buildTeamFilter branches via getTeamMembers', () => {
    test('returns all members when includeInactive=true', async () => {
      const sort = jest.fn().mockResolvedValue([]);
      TeamMember.find.mockReturnValue({ sort });

      await controller.getTeamMembers({ query: { includeInactive: 'true' } }, createMockRes(), jest.fn());

      expect(TeamMember.find).toHaveBeenCalledWith({});
    });

    test('filters by status=active', async () => {
      const sort = jest.fn().mockResolvedValue([]);
      TeamMember.find.mockReturnValue({ sort });

      await controller.getTeamMembers({ query: { status: 'active' } }, createMockRes(), jest.fn());

      expect(TeamMember.find).toHaveBeenCalledWith({ status: 'active' });
    });

    test('filters by status=inactive', async () => {
      const sort = jest.fn().mockResolvedValue([]);
      TeamMember.find.mockReturnValue({ sort });

      await controller.getTeamMembers({ query: { status: 'inactive' } }, createMockRes(), jest.fn());

      expect(TeamMember.find).toHaveBeenCalledWith({ status: 'inactive' });
    });
  });

  describe('deleteTeamMember', () => {
    test('returns 500 on delete error', async () => {
      TeamMember.findById.mockResolvedValue({
        _id: 't1',
        deleteOne: jest.fn().mockRejectedValue(new Error('Delete failed')),
      });

      const req = { params: { id: 't1' } };
      const res = createMockRes();

      await controller.deleteTeamMember(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
