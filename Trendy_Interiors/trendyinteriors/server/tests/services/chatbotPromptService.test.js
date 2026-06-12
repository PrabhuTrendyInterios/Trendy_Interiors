const { buildSystemPrompt } = require('../../services/chatbotPromptService');

describe('chatbotPromptService', () => {
  test('buildSystemPrompt includes creative answer guidance and dynamic summaries', () => {
    const prompt = buildSystemPrompt(
      {
        name: 'TrendyInterios',
        phone: 'Contact us for details',
        email: 'info@trendyinterios.com',
        address: 'Erode, Tamil Nadu',
      },
      {
        rooms: [
          { name: 'Living Room', pricePerSqFt: 1800, status: 'active', description: 'Modern living space', addons: [], layouts: [] },
        ],
        addons: [
          { name: 'Mood Lighting', price: 4500, active: true, description: 'Dimmable warm lights' },
        ],
        team: [
          { name: 'Priya', role: 'Interior Designer', contact: '+91 98765 43210', status: 'active' },
        ],
        projects: [
          { title: 'Cozy Apartment', category: 'residential', status: 'active' },
        ],
      }
    );

    expect(prompt).toContain('creative ideas');
    expect(prompt).toContain('Active portfolio projects:');
    expect(prompt).toContain('Living Room: ₹1,800/sq.ft');
    expect(prompt).toContain('Mood Lighting: ₹4,500');
    expect(prompt).toContain('Priya (Interior Designer)');
  });
});
