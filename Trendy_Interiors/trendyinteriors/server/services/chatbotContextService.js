const Room = require("../models/Room");
const GlobalAddon = require("../models/GlobalAddon");
const Project = require("../models/Project");
const TeamMember = require("../models/TeamMember");

const buildChatbotContext = async () => {
  const rooms = await Room.find({
    status: "active"
  }).lean();

  const addons =
    await GlobalAddon.find({
      active: true
    }).lean();

  const projects =
    await Project.find().lean();

  const team =
    await TeamMember.find().lean();

  return {
    rooms,
    addons,
    projects,
    team
  };
};

module.exports = buildChatbotContext;