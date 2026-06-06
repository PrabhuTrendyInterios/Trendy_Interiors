const Project = require('../models/Project');

const normalizeProjectPayload = (body = {}) => ({
  title: body.title?.trim(),
  description: body.description?.trim(),
  category: body.category?.trim()?.toLowerCase(),
  coverImageUrl: (body.coverImageUrl || body.image || '').trim(),
  galleryImages: Array.isArray(body.galleryImages)
    ? body.galleryImages
    : Array.isArray(body.images)
      ? body.images
      : [],
  displayOrder: Number(body.displayOrder ?? body.order) || 0,
  status: body.status === 'inactive' ? 'inactive' : 'active',
});

const formatProjectResponse = (project) => {
  const doc = project.toObject ? project.toObject() : project;
  return {
    ...doc,
    coverImageUrl: doc.coverImageUrl || doc.image || '',
    galleryImages: doc.galleryImages?.length ? doc.galleryImages : doc.images || [],
    displayOrder: doc.displayOrder ?? doc.order ?? 0,
    image: doc.coverImageUrl || doc.image || '',
    images: doc.galleryImages?.length ? doc.galleryImages : doc.images || [],
  };
};

const buildProjectFilter = (query) => {
  if (query.includeInactive === 'true') {
    return {};
  }

  if (query.status === 'active' || query.status === 'inactive') {
    return { status: query.status };
  }

  return {
    $or: [{ status: 'active' }, { status: { $exists: false } }],
  };
};

exports.getProjects = async (req, res) => {
  try {
    const { limit } = req.query;
    let query = Project.find(buildProjectFilter(req.query)).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const projects = await query;
    const data = projects.map(formatProjectResponse);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.status(200).json({
      success: true,
      data: formatProjectResponse(project),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

exports.createProject = async (req, res) => {
  try {
    const project = await Project.create(normalizeProjectPayload(req.body));

    res.status(201).json({
      success: true,
      data: formatProjectResponse(project),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      normalizeProjectPayload(req.body),
      {
        new: true,
        runValidators: true,
      }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.status(200).json({
      success: true,
      data: formatProjectResponse(project),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};
