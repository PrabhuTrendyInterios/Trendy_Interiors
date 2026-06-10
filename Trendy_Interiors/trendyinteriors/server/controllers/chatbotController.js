const axios = require('axios');
const pdfParse = require('pdf-parse');
const { sendAdminEmail } = require('../utils/mail');
const buildChatbotContext = require('../services/chatbotContextService');
const { buildSystemPrompt } = require('../services/chatbotPromptService');
const { fetchChatbotConfig, fetchChatbotContextData } = require('../services/chatbotApiService');
const Settings = require('../models/Settings');

// Default company context - will be overridden by database settings
const DEFAULT_COMPANY_CONTEXT = {
  name: 'TrendyInterios',
  phone: 'Contact us for pricing',
  email: 'info@trendyinterios.com',
  address: 'Erode, Tamil Nadu'
};

const DEFAULT_CHATBOT_CONTEXT = {
  rooms: [],
  addons: [],
  projects: [],
  team: [],
};

// Fetch company context from Settings
const getCompanyContext = async () => {
  try {
    const settings = await Settings.findOne({});
    if (!settings) return DEFAULT_COMPANY_CONTEXT;
    
    return {
      name: settings.companyName || DEFAULT_COMPANY_CONTEXT.name,
      phone: settings.contactPhone || DEFAULT_COMPANY_CONTEXT.phone,
      email: settings.contactEmail || DEFAULT_COMPANY_CONTEXT.email,
      address: settings.contactAddress || DEFAULT_COMPANY_CONTEXT.address
    };
  } catch (error) {
    console.warn('Failed to fetch company context from Settings:', error.message);
    return DEFAULT_COMPANY_CONTEXT;
  }
};

const QUOTE_DISCLAIMER = 'This is an approximate estimate. Final quotation will be provided after site inspection.';

const MEETING_FIELDS = [
  { key: 'name', label: 'Full Name' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'email', label: 'Email Address' },
  { key: 'preferredDate', label: 'Preferred Meeting Date' },
  { key: 'preferredTime', label: 'Preferred Time Slot' },
  { key: 'projectType', label: 'Project Type (home/office/etc.)' },
  { key: 'propertyLocation', label: 'Property Location / Site Address' },
];

const safeJsonParse = (value, fallback) => {
  try {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value || fallback;
  } catch (_err) {
    return fallback;
  }
};

const extractAreaFromText = (text = '') => {
  const normalized = text.replace(/,/g, '').toLowerCase();

  const sqFtMatch = normalized.match(/(\d{3,6}(?:\.\d+)?)\s*(sq\.?\s*ft|sqft|sft|ft2|ft\^2|square\s*feet)/i);
  if (sqFtMatch) {
    return Math.round(Number(sqFtMatch[1]));
  }

  const sqMMatch = normalized.match(/(\d{2,5}(?:\.\d+)?)\s*(sq\.?\s*m|sqm|m2|m\^2|square\s*meter)/i);
  if (sqMMatch) {
    return Math.round(Number(sqMMatch[1]) * 10.7639);
  }

  return null;
};

const callGroq = async ({ messages, model, maxTokens, temperature }) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is not configured in environment variables');
      throw new Error('GROQ_API_KEY not configured');
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('⚠️ Groq API returned empty content');
    }
    return content;
  } catch (error) {
    console.error('❌ Groq API Error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    throw error;
  }
};

const parseAnalysisJson = (rawContent) => {
  if (!rawContent) return null;

  const direct = safeJsonParse(rawContent, null);
  if (direct) return direct;

  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  return safeJsonParse(jsonMatch[0], null);
};

const analyzePdfFloorPlan = async (pdfBuffer, chatbotConfig) => {
  const parsed = await pdfParse(pdfBuffer);
  const text = (parsed?.text || '').slice(0, 10000);
  const regexArea = extractAreaFromText(text);

  const analysisPrompt = `Extract floor-plan details from the text and return ONLY valid JSON with this schema:
{
  "detectedAreaSqFt": number | null,
  "serviceTier": "basic" | "standard" | "premium" | null,
  "spaceBreakdown": [{"name": string, "areaSqFt": number | null}],
  "assumptions": string[],
  "confidence": "low" | "medium" | "high"
}

PDF text content:
${text || 'No readable text extracted from PDF.'}`;

  let aiAnalysis = null;
  try {
    const content = await callGroq({
      messages: [{ role: 'user', content: analysisPrompt }],
      model: chatbotConfig.model,
      maxTokens: 450,
      temperature: 0.1,
    });
    aiAnalysis = parseAnalysisJson(content);
  } catch (_err) {
    aiAnalysis = null;
  }

  return {
    source: 'pdf',
    extractedTextAvailable: Boolean(text),
    detectedAreaSqFt: aiAnalysis?.detectedAreaSqFt || regexArea || null,
    serviceTier: aiAnalysis?.serviceTier || null,
    spaceBreakdown: Array.isArray(aiAnalysis?.spaceBreakdown) ? aiAnalysis.spaceBreakdown : [],
    assumptions: Array.isArray(aiAnalysis?.assumptions) ? aiAnalysis.assumptions : [],
    confidence: aiAnalysis?.confidence || (text ? 'medium' : 'low')
  };
};

const analyzeImageFloorPlan = async (file, chatbotConfig) => {
  const base64Image = file.buffer.toString('base64');
  const mimeType = file.mimetype || 'image/jpeg';

  const imagePrompt = `Analyze this interior floor-plan image and return ONLY valid JSON with this schema:
{
  "detectedAreaSqFt": number | null,
  "serviceTier": "basic" | "standard" | "premium" | null,
  "spaceBreakdown": [{"name": string, "areaSqFt": number | null}],
  "assumptions": string[],
  "confidence": "low" | "medium" | "high"
}

If exact area is not visible, infer a practical approximate area and mention assumptions.`;

  let aiAnalysis = null;

  try {
    const content = await callGroq({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: imagePrompt },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            }
          ]
        }
      ],
      maxTokens: 450,
      temperature: 0.1,
    });
    aiAnalysis = parseAnalysisJson(content);
  } catch (_err) {
    aiAnalysis = null;
  }

  return {
    source: 'image',
    detectedAreaSqFt: aiAnalysis?.detectedAreaSqFt || null,
    serviceTier: aiAnalysis?.serviceTier || null,
    spaceBreakdown: Array.isArray(aiAnalysis?.spaceBreakdown) ? aiAnalysis.spaceBreakdown : [],
    assumptions: Array.isArray(aiAnalysis?.assumptions) ? aiAnalysis.assumptions : ['Area inferred from visual floor-plan proportions.'],
    confidence: aiAnalysis?.confidence || 'low'
  };
};

const buildQuotation = (analysis, pricingRanges = {}) => {
  const normalizedTier = ['basic', 'standard', 'premium'].includes(analysis?.serviceTier)
    ? analysis.serviceTier
    : 'standard';

  // Default pricing ranges (per sq.ft in INR)
  const defaultPricingRanges = {
    'basic': { min: 500, max: 1000 },
    'standard': { min: 1000, max: 2000 },
    'premium': { min: 2000, max: 5000 },
  };

  const rates = pricingRanges[normalizedTier] || defaultPricingRanges[normalizedTier];

  const areaSqFt = Number(analysis?.detectedAreaSqFt) > 0 ? Math.round(Number(analysis.detectedAreaSqFt)) : null;

  if (!areaSqFt) {
    return {
      tier: normalizedTier,
      areaSqFt: null,
      minAmount: null,
      maxAmount: null,
      rateMin: rates.min,
      rateMax: rates.max,
    };
  }

  return {
    tier: normalizedTier,
    areaSqFt,
    minAmount: areaSqFt * rates.min,
    maxAmount: areaSqFt * rates.max,
    rateMin: rates.min,
    rateMax: rates.max,
  };
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const buildMeetingEmailHtml = (meeting) => {
  const safe = (value) => (value ? String(value) : 'Not provided');

  return `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;max-width:680px;margin:0 auto;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;">
      <div style="background:#1f1f1f;color:#d4af37;padding:18px 20px;font-size:20px;font-weight:700;">TrendyInterios - Meeting Request</div>
      <div style="padding:20px;background:#fff;">
        <p style="margin:0 0 14px;color:#333;">A user requested a meeting through chatbot. Details are below:</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Name</td><td style="padding:8px;border:1px solid #eee;">${safe(meeting.name)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Phone</td><td style="padding:8px;border:1px solid #eee;">${safe(meeting.phone)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Email</td><td style="padding:8px;border:1px solid #eee;">${safe(meeting.email)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Preferred Date</td><td style="padding:8px;border:1px solid #eee;">${safe(meeting.preferredDate)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Preferred Time</td><td style="padding:8px;border:1px solid #eee;">${safe(meeting.preferredTime)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Project Type</td><td style="padding:8px;border:1px solid #eee;">${safe(meeting.projectType)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Property Location</td><td style="padding:8px;border:1px solid #eee;">${safe(meeting.propertyLocation)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Additional Notes</td><td style="padding:8px;border:1px solid #eee;">${safe(meeting.notes)}</td></tr>
        </table>
      </div>
    </div>
  `;
};

const isLikelyMeetingIntent = (text = '') => /schedule|book|meeting|consultation|site\s*visit|appointment|call\s*back/i.test(text);

const parseMeetingJson = (rawContent) => {
  const parsed = parseAnalysisJson(rawContent);
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed;
};

const extractMeetingRequestData = async ({ conversationHistory, userMessage, chatbotConfig }) => {
  const historyText = (conversationHistory || [])
    .slice(-8)
    .map((item) => `${item.role}: ${item.content}`)
    .join('\n');

  const prompt = `Identify whether the user is requesting to schedule a meeting/consultation/site visit, then extract details.
Return ONLY valid JSON with this exact schema:
{
  "wantsMeeting": boolean,
  "submitRequest": boolean,
  "name": string | null,
  "phone": string | null,
  "email": string | null,
  "preferredDate": string | null,
  "preferredTime": string | null,
  "projectType": string | null,
  "propertyLocation": string | null,
  "notes": string | null
}

Rules:
- wantsMeeting=true only when user intent is to schedule/arrange a meeting.
- submitRequest=true only if user wants meeting and all required details are already available from chat history + latest message.
- Keep unknown values as null.

Conversation:
${historyText || 'No previous history'}

Latest user message:
${userMessage}`;

  const content = await callGroq({
    messages: [{ role: 'user', content: prompt }],
    model: chatbotConfig.model,
    maxTokens: 300,
    temperature: 0.1,
  });

  return parseMeetingJson(content);
};

const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
const isValidPhone = (value = '') => /^(\+?\d[\d\s-]{8,15})$/.test(String(value).trim());

const getMissingMeetingFields = (meetingData) => {
  const missing = [];

  MEETING_FIELDS.forEach((field) => {
    const value = meetingData?.[field.key];
    if (!value || !String(value).trim()) {
      missing.push(field.label);
    }
  });

  if (meetingData?.email && !isValidEmail(meetingData.email)) {
    missing.push('Valid Email Address');
  }

  if (meetingData?.phone && !isValidPhone(meetingData.phone)) {
    missing.push('Valid Phone Number with country code');
  }

  return [...new Set(missing)];
};

const buildMeetingMissingInfoResponse = (missingFields) => {
  const askList = missingFields.slice(0, 5).map((field) => `- ${field}`).join('\n');
  return `Sure, I can schedule a meeting for you. Please share the following details:\n${askList}\n\nOnce you provide these, I will confirm and submit your meeting request.`;
};

const sendMeetingRequestEmail = async (meetingData, meetingEmailTo = 'trendyadmin123@gmail.com') => {
  await sendAdminEmail({
    to: meetingEmailTo,
    subject: `📅 Chatbot Meeting Request - ${meetingData.name} (${meetingData.projectType})`,
    html: buildMeetingEmailHtml(meetingData),
    text: `Meeting Request\nName: ${meetingData.name}\nPhone: ${meetingData.phone}\nEmail: ${meetingData.email}\nDate: ${meetingData.preferredDate}\nTime: ${meetingData.preferredTime}\nProject Type: ${meetingData.projectType}\nLocation: ${meetingData.propertyLocation}\nNotes: ${meetingData.notes || 'N/A'}`,
  });
};

const buildAttachmentQuoteResponse = ({ fileName, analysis, quotation, userMessage }) => {
  const tierLabel = quotation.tier.charAt(0).toUpperCase() + quotation.tier.slice(1);
  const breakdown = analysis.spaceBreakdown
    .filter((space) => space?.name)
    .slice(0, 6)
    .map((space) => `- ${space.name}${space.areaSqFt ? `: ${space.areaSqFt} sq.ft` : ''}`)
    .join('\n');

  if (!quotation.areaSqFt) {
    return `I reviewed your attached file (${fileName}), but I could not confidently detect the total floor area from it.

To provide an approximate quotation, please share:
- Total area in sq.ft
- Preferred package (Basic / Standard / Premium)
- Required spaces (kitchen, bedroom, living, etc.)

Current suggested rate (${tierLabel}): ${formatCurrency(quotation.rateMin)} - ${formatCurrency(quotation.rateMax)} per sq.ft.

${QUOTE_DISCLAIMER}`;
  }

  return `I analyzed your attached floor plan (${fileName}) and generated an approximate quotation.

Estimated floor area: ${quotation.areaSqFt} sq.ft
Selected package: ${tierLabel}
Rate considered: ${formatCurrency(quotation.rateMin)} - ${formatCurrency(quotation.rateMax)} per sq.ft
Approx quotation: ${formatCurrency(quotation.minAmount)} - ${formatCurrency(quotation.maxAmount)}

${breakdown ? `Detected spaces:\n${breakdown}\n\n` : ''}${analysis.assumptions?.length ? `Assumptions:\n${analysis.assumptions.slice(0, 3).map((assumption) => `- ${assumption}`).join('\n')}\n\n` : ''}${userMessage ? `You also asked: "${userMessage}"\n\n` : ''}${QUOTE_DISCLAIMER}`;
};

exports.sendMessage = async (req, res) => {
  try {
    const { message = '' } = req.body;
    const conversationHistory = safeJsonParse(req.body.conversationHistory, []);
    const attachedFile = req.file;
    const normalizedMessage = typeof message === 'string' ? message.trim() : '';

    if (!normalizedMessage && !attachedFile) {
      return res.status(400).json({ error: 'Message or attachment is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    // Fetch chatbot configuration from CMS API
    const chatbotConfig = await fetchChatbotConfig();
    if (!chatbotConfig) {
      console.error('❌ Chatbot config is null - falling back to defaults');
      return res.status(503).json({ error: 'Chatbot configuration not available. Falling back to defaults.' });
    }
    if (!chatbotConfig.enabled) {
      console.warn('⚠️ Chatbot is disabled in config');
      return res.status(503).json({ error: 'Chatbot is currently disabled' });
    }
    console.log('✓ Chatbot enabled with model:', chatbotConfig.model);

    // Fetch chatbot context data from CMS API
    const chatbotContext = await fetchChatbotContextData();

    // Fetch company context from database settings
    const companyContext = await getCompanyContext();

    const shouldCheckMeetingIntent = isLikelyMeetingIntent(normalizedMessage) || conversationHistory.some((entry) =>
      entry?.role === 'assistant' && /schedule a meeting|meeting request|share the following details/i.test(entry?.content || '')
    );

    if (shouldCheckMeetingIntent && normalizedMessage) {
      let meetingData = null;

      try {
        meetingData = await extractMeetingRequestData({
          conversationHistory,
          userMessage: normalizedMessage,
          chatbotConfig,
        });
      } catch (_err) {
        meetingData = null;
      }

      if (meetingData?.wantsMeeting) {
        const missingFields = getMissingMeetingFields(meetingData);

        if (missingFields.length > 0 || !meetingData.submitRequest) {
          return res.status(200).json({
            success: true,
            message: buildMeetingMissingInfoResponse(missingFields.length ? missingFields : MEETING_FIELDS.map((field) => field.label)),
            timestamp: new Date(),
            meetingFlow: {
              status: 'collecting-info',
              missingFields
            }
          });
        }

        try {
          await sendMeetingRequestEmail(meetingData, chatbotConfig.meetingEmailTo);
          console.log('✓ Meeting request email sent successfully for:', meetingData.name);
        } catch (emailError) {
          console.error('❌ Failed to send meeting request email:', emailError.message);
          // Don't fail the user request even if email fails - they'll see success but we'll retry
          // In production, you'd want to queue this for retry
        }

        return res.status(200).json({
          success: true,
          message: `Great! Your meeting request has been scheduled and sent to our team.\n\nDetails received:\n- Name: ${meetingData.name}\n- Date: ${meetingData.preferredDate}\n- Time: ${meetingData.preferredTime}\n- Project: ${meetingData.projectType}\n\nOur team will contact you shortly on ${meetingData.phone} or ${meetingData.email}.`,
          timestamp: new Date(),
          meetingFlow: {
            status: 'scheduled'
          }
        });
      }
    }

    if (attachedFile) {
      let analysis = null;

      if (attachedFile.mimetype === 'application/pdf') {
        analysis = await analyzePdfFloorPlan(attachedFile.buffer, chatbotConfig);
      } else if (attachedFile.mimetype?.startsWith('image/')) {
        analysis = await analyzeImageFloorPlan(attachedFile, chatbotConfig);
      } else {
        return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or image file.' });
      }

      const quotation = buildQuotation(analysis);
      const responseMessage = buildAttachmentQuoteResponse({
        fileName: attachedFile.originalname,
        analysis,
        quotation,
        userMessage: normalizedMessage
      });

      return res.status(200).json({
        success: true,
        message: responseMessage,
        timestamp: new Date(),
        quotation: {
          areaSqFt: quotation.areaSqFt,
          tier: quotation.tier,
          minAmount: quotation.minAmount,
          maxAmount: quotation.maxAmount,
          confidence: analysis.confidence
        }
      });
    }

    const messages = [
      ...conversationHistory,
      { role: 'user', content: normalizedMessage }
    ];

    // Use custom system prompt override if provided, otherwise build it dynamically
    const systemPromptContent = chatbotConfig.systemPromptOverride
      ? chatbotConfig.systemPromptOverride
      : buildSystemPrompt(companyContext, chatbotContext);

    const aiResponse = await callGroq({
      messages: [
        { role: 'system', content: systemPromptContent },
        ...messages
      ],
      model: chatbotConfig.model,
      maxTokens: chatbotConfig.maxTokens,
      temperature: chatbotConfig.temperature,
    });

    if (!aiResponse) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    res.status(200).json({
      success: true,
      message: aiResponse,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Chatbot error:', error.message);
    console.error('Error response data:', error.response?.data);
    
    let errorMessage = 'Unable to process your message. Please try again later.';
    
    if (error.response?.status === 401) {
      errorMessage = 'Authentication error with AI service. Please check your API key configuration.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid request to AI service. Please check your configuration.';
      console.error('Bad Request details:', error.response?.data);
    } else if (error.response?.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage
    });
  }
};
