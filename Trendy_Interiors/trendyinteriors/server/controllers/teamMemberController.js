const TeamMember = require('../models/TeamMember');
const { formatValidationError, sendError, sendSuccess } = require('../utils/controllerHelpers');

const normalizeTeamPayload = (body = {}) => ({
  name: body.name?.trim(),
  role: body.role?.trim(),
  contact: (body.contact || body.mobilePhone || '').trim(),
  imageUrl: (body.imageUrl || body.image || '').trim(),
  displayOrder: Number(body.displayOrder ?? body.order) || 0,
  status: body.status === 'inactive' ? 'inactive' : 'active',
  linkedin: body.linkedin?.trim() || '',
  instagram: body.instagram?.trim() || '',
});

const formatTeamResponse = (member) => {
  const doc = member.toObject ? member.toObject() : member;
  return {
    ...doc,
    contact: doc.contact || doc.mobilePhone || '',
    imageUrl: doc.imageUrl || doc.image || '',
    displayOrder: doc.displayOrder ?? doc.order ?? 0,
    image: doc.imageUrl || doc.image || '',
    mobilePhone: doc.contact || doc.mobilePhone || '',
    order: doc.displayOrder ?? doc.order ?? 0,
  };
};

const buildTeamFilter = (query) => {
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

exports.getTeamMembers = async (req, res) => {
  try {
    const teamMembers = await TeamMember.find(buildTeamFilter(req.query)).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    sendSuccess(res, 200, {
      count: teamMembers.length,
      data: teamMembers.map(formatTeamResponse),
    });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};

exports.getTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);

    if (!teamMember) {
      return sendError(res, 404, 'Team member not found');
    }

    sendSuccess(res, 200, { data: formatTeamResponse(teamMember) });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};

exports.createTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.create(normalizeTeamPayload(req.body));
    sendSuccess(res, 201, { data: formatTeamResponse(teamMember) });
  } catch (err) {
    sendError(res, err.name === 'ValidationError' || err.code === 11000 ? 400 : 500, formatValidationError(err));
  }
};

exports.updateTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      normalizeTeamPayload(req.body),
      {
        new: true,
        runValidators: true,
      }
    );

    if (!teamMember) {
      return sendError(res, 404, 'Team member not found');
    }

    sendSuccess(res, 200, { data: formatTeamResponse(teamMember) });
  } catch (err) {
    sendError(res, err.name === 'ValidationError' || err.code === 11000 ? 400 : 500, formatValidationError(err));
  }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);

    if (!teamMember) {
      return sendError(res, 404, 'Team member not found');
    }

    await teamMember.deleteOne();
    sendSuccess(res, 200, { message: 'Team member deleted successfully' });
  } catch (err) {
    sendError(res, 500, formatValidationError(err));
  }
};
