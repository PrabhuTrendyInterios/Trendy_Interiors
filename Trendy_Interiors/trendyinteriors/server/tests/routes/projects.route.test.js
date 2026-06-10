jest.mock('../../controllers/projectController', () => ({
  getProjects: jest.fn((req, res) => res.status(200).json({ success: true, route: 'getProjects' })),
  createProject: jest.fn((req, res) => res.status(201).json({ success: true, route: 'createProject' })),
  updateProject: jest.fn((req, res) => res.status(200).json({ success: true, route: 'updateProject' })),
  deleteProject: jest.fn((req, res) => res.status(200).json({ success: true, route: 'deleteProject' })),
}));

jest.mock('../../middleware/authMiddleware', () => ({
  protect: jest.fn((req, _res, next) => {
    req.user = { role: 'admin' };
    next();
  }),
  authorize: jest.fn(() => (_req, _res, next) => next()),
}));

const express = require('express');
const request = require('supertest');
const routes = require('../../routes/projects');

describe('server/routes/projects', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/projects', routes);

  test('GET /api/projects', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getProjects');
  });

  test('POST /api/projects', async () => {
    const res = await request(app).post('/api/projects').send({ title: 'x' });
    expect(res.status).toBe(201);
    expect(res.body.route).toBe('createProject');
  });

  test('PUT /api/projects/:id', async () => {
    const res = await request(app).put('/api/projects/1').send({ title: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('updateProject');
  });

  test('DELETE /api/projects/:id', async () => {
    const res = await request(app).delete('/api/projects/1');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('deleteProject');
  });
});
