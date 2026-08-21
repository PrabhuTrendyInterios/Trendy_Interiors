const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const toSingleLine = (text = '') => String(text).replace(/\s+/g, ' ').trim();

const summarizeRooms = (rooms = []) => {
  const activeRooms = Array.isArray(rooms) ? rooms.filter((room) => room?.status === 'active') : [];
  if (!activeRooms.length) {
    return 'No active room packages are available currently.';
  }

  return activeRooms
    .map((room) => {
      const price = formatCurrency(room.pricePerSqFt);
      const description = toSingleLine(room.description || '');
      const addonCount = Array.isArray(room.addons) ? room.addons.length : 0;
      const layoutCount = Array.isArray(room.layouts) ? room.layouts.length : 0;
      const parts = [`${room.name}: ${price}/sq.ft`];

      if (description) {
        parts.push(description);
      }
      if (addonCount) {
        parts.push(`${addonCount} addon${addonCount > 1 ? 's' : ''}`);
      }
      if (layoutCount) {
        parts.push(`${layoutCount} layout${layoutCount > 1 ? 's' : ''}`);
      }

      return `- ${parts.join(' · ')}`;
    })
    .join('\n');
};

const summarizeAddons = (addons = []) => {
  const activeAddons = Array.isArray(addons) ? addons.filter((addon) => addon?.active) : [];
  if (!activeAddons.length) {
    return 'No active global addons are available currently.';
  }

  return activeAddons
    .map((addon) => {
      const price = formatCurrency(addon.price);
      const description = toSingleLine(addon.description || '');
      return `- ${addon.name}: ${price}${description ? ` · ${description}` : ''}`;
    })
    .join('\n');
};

const summarizeTeam = (team = []) => {
  const activeTeam = Array.isArray(team) ? team.filter((member) => member?.status === 'active') : [];
  if (!activeTeam.length) {
    return 'No active team member details are currently available.';
  }

  return activeTeam
    .map((member) => {
      const contact = toSingleLine(member.contact || 'Contact details not available');
      return `- ${member.name} (${member.role}) · ${contact}`;
    })
    .join('\n');
};

const summarizeProjects = (projects = []) => {
  const activeProjects = Array.isArray(projects) ? projects.filter((project) => project?.status === 'active') : [];
  if (!activeProjects.length) {
    return 'No active portfolio projects are currently available.';
  }

  return activeProjects
    .map((project) => `- ${project.title}${project.category ? ` · ${project.category}` : ''}`)
    .join('\n');
};

const buildSystemPrompt = (companyContext, dynamicContext = {}) => {
  const activeRoomCount = Array.isArray(dynamicContext.rooms) ? dynamicContext.rooms.filter((room) => room?.status === 'active').length : 0;
  const activeAddonCount = Array.isArray(dynamicContext.addons) ? dynamicContext.addons.filter((addon) => addon?.active).length : 0;
  const activeTeamCount = Array.isArray(dynamicContext.team) ? dynamicContext.team.filter((member) => member?.status === 'active').length : 0;
  const activeProjectCount = Array.isArray(dynamicContext.projects) ? dynamicContext.projects.filter((project) => project?.status === 'active').length : 0;

  // Normalize company context data
  const email = Array.isArray(companyContext.email) ? companyContext.email.join(', ') : companyContext.email;

  return `You are a purpose-driven chatbot for TrendyInterios, a premium interior design company in Erode, India.

Company Information:
- Name: ${companyContext.name || 'TrendyInterios'}
- Phone: ${companyContext.phone || 'Contact us for details'}
- Email: ${email || 'info@trendyinterios.com'}
- Location: ${companyContext.address || 'Erode, Tamil Nadu'}

Current active offering data:
- Room packages available: ${activeRoomCount}
- Global addons available: ${activeAddonCount}
- Team members available: ${activeTeamCount}
- Portfolio projects active: ${activeProjectCount}

Available room packages:
${summarizeRooms(dynamicContext.rooms)}

Active global addons:
${summarizeAddons(dynamicContext.addons)}

Active team members:
${summarizeTeam(dynamicContext.team)}

Active portfolio projects:
${summarizeProjects(dynamicContext.projects)}

General Pricing Ranges (Per Sq.ft in INR):
- Basic Interior Design: ₹500 - ₹1,000/sq.ft
- Standard Interior Design: ₹1,000 - ₹2,000/sq.ft
- Premium Interior Design: ₹2,000 - ₹5,000/sq.ft
- Modular Kitchen: ₹1,500 - ₹3,000/running foot
- Renovation Service: ₹800 - ₹2,500/sq.ft

Important instructions:
- Use the live active room package and addon data above whenever a customer asks about room types, per-sq.ft pricing, available addons, or package details.
- For questions about team members or portfolio examples, answer using the active team and project summaries.
- If the user asks for a quotation without a specific room type, use the general approximate pricing ranges.
- Always mention that the final quote depends on site inspection.
- When the user asks for creative ideas, design inspiration, themes, color schemes, styling tips, or remodeling suggestions, answer with vivid, imaginative, and design-forward language.
- Use relatable visual metaphors, describe materials, textures, lighting, and mood, and connect suggestions to the active room packages and addons when possible.
- Provide contact details only when explicitly requested, when the user wants to book a consultation, or when they ask for next steps.
- Do NOT mention contact details in every response.
- Keep responses concise, friendly, and professional.
- If information is not available from the data above, say so and avoid inventing unavailable offerings.`;
};

module.exports = {
  buildSystemPrompt,
};
