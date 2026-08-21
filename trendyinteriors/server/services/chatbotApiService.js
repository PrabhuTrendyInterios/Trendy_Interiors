const axios = require('axios');

// Get the API base URL (assumes server is running on same host or can be configured via env)
const getApiBaseUrl = () => {
  return process.env.CHATBOT_API_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api`;
};

console.log('📡 ChatbotApiService initialized with base URL:', getApiBaseUrl());

// Fetch chatbot configuration from CMS API
const fetchChatbotConfig = async () => {
  try {
    const url = `${getApiBaseUrl()}/cms/chatbot-config`;
    console.log('📡 Fetching chatbot config from:', url);
    const response = await axios.get(url, {
      timeout: 5000,
    });

    if (response.data?.success) {
      console.log('✓ Chatbot config fetched successfully');
      return response.data.data;
    }

    console.warn('⚠️ Chatbot config API returned success=false');
    return null;
  } catch (error) {
    console.error('❌ Failed to fetch chatbot config from API:', {
      url: `${getApiBaseUrl()}/cms/chatbot-config`,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return null;
  }
};

// Fetch room packages from CMS API
const fetchRooms = async () => {
  try {
    const url = `${getApiBaseUrl()}/cms/rooms?status=active`;
    const response = await axios.get(url, {
      timeout: 5000,
    });

    if (response.data?.success && Array.isArray(response.data.data)) {
      console.log(`✓ Rooms fetched: ${response.data.data.length} items`);
      return response.data.data;
    }

    console.warn('⚠️ Rooms API returned invalid format');
    return [];
  } catch (error) {
    console.error('❌ Failed to fetch rooms:', error.message, { url: `${getApiBaseUrl()}/cms/rooms?status=active` });
    return [];
  }
};

// Fetch global addons from CMS API
const fetchAddons = async () => {
  try {
    const url = `${getApiBaseUrl()}/cms/global-addons?active=true`;
    const response = await axios.get(url, {
      timeout: 5000,
    });

    if (response.data?.success && Array.isArray(response.data.data)) {
      console.log(`✓ Addons fetched: ${response.data.data.length} items`);
      return response.data.data;
    }

    console.warn('⚠️ Addons API returned invalid format');
    return [];
  } catch (error) {
    console.error('❌ Failed to fetch addons:', error.message, { url: `${getApiBaseUrl()}/cms/global-addons?active=true` });
    return [];
  }
};

// Fetch team members from CMS API
const fetchTeamMembers = async () => {
  try {
    const url = `${getApiBaseUrl()}/api/team-members?status=active`;
    const response = await axios.get(url, {
      timeout: 5000,
    });

    if (response.data?.success && Array.isArray(response.data.data)) {
      console.log(`✓ Team members fetched: ${response.data.data.length} items`);
      return response.data.data;
    }

    console.warn('⚠️ Team members API returned invalid format');
    return [];
  } catch (error) {
    console.error('❌ Failed to fetch team members:', error.message, { url: `${getApiBaseUrl()}/api/team-members?status=active` });
    return [];
  }
};

// Fetch projects from CMS API
const fetchProjects = async () => {
  try {
    const url = `${getApiBaseUrl()}/api/projects?status=active`;
    const response = await axios.get(url, {
      timeout: 5000,
    });

    if (response.data?.success && Array.isArray(response.data.data)) {
      console.log(`✓ Projects fetched: ${response.data.data.length} items`);
      return response.data.data;
    }

    console.warn('⚠️ Projects API returned invalid format');
    return [];
  } catch (error) {
    console.error('❌ Failed to fetch projects:', error.message, { url: `${getApiBaseUrl()}/api/projects?status=active` });
    return [];
  }
};

// Fetch all chatbot context data in parallel
const fetchChatbotContextData = async () => {
  try {
    console.log('📡 Fetching chatbot context data...');
    const [rooms, addons, team, projects] = await Promise.all([
      fetchRooms(),
      fetchAddons(),
      fetchTeamMembers(),
      fetchProjects(),
    ]);

    console.log('✓ Chatbot context data fetched:', { rooms: rooms?.length || 0, addons: addons?.length || 0, team: team?.length || 0, projects: projects?.length || 0 });
    return {
      rooms: rooms || [],
      addons: addons || [],
      team: team || [],
      projects: projects || [],
    };
  } catch (error) {
    console.error('❌ Error fetching chatbot context data:', error.message);
    return {
      rooms: [],
      addons: [],
      team: [],
      projects: [],
    };
  }
};

module.exports = {
  fetchChatbotConfig,
  fetchRooms,
  fetchAddons,
  fetchTeamMembers,
  fetchProjects,
  fetchChatbotContextData,
};
