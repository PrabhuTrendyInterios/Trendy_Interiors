const { randomUUID } = require('crypto');

const pad = (value, length = 2) => String(value).padStart(length, '0');

const toICSTimestamp = (date) => {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const escapeICS = (value) => {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
};

const parseTimeString = (timeText) => {
  if (!timeText || !String(timeText).trim()) return null;
  const normalized = String(timeText).trim().toLowerCase();
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || '0');
  const meridiem = match[3];

  if (meridiem) {
    if (meridiem.toLowerCase() === 'pm' && hour < 12) hour += 12;
    if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

const buildStartDate = (preferredDate, preferredTime) => {
  if (!preferredDate) return null;

  const dateString = String(preferredDate).trim();
  let baseDate = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    baseDate = new Date(`${dateString}T00:00:00Z`);
  } else {
    baseDate = new Date(dateString);
  }

  if (Number.isNaN(baseDate.getTime())) return null;

  const timeParts = parseTimeString(preferredTime);
  if (timeParts) {
    baseDate.setUTCHours(timeParts.hour);
    baseDate.setUTCMinutes(timeParts.minute);
    baseDate.setUTCSeconds(0);
    baseDate.setUTCMilliseconds(0);
  } else {
    baseDate.setUTCHours(10);
    baseDate.setUTCMinutes(0);
    baseDate.setUTCSeconds(0);
    baseDate.setUTCMilliseconds(0);
  }

  return baseDate;
};

const buildCalendarInvite = (meetingData = {}, companyContext = {}) => {
  const meetingTitle = meetingData.projectType
    ? `TrendyInterios Meeting - ${meetingData.projectType}`
    : 'TrendyInterios Meeting Request';

  const summary = escapeICS(meetingTitle);
  const location = escapeICS(meetingData.propertyLocation || companyContext.address || 'TrendyInterios Office');
  const description = escapeICS(
    `Meeting Title: ${meetingTitle}\n` +
    `Customer Name: ${meetingData.name || 'N/A'}\n` +
    `Email: ${meetingData.email || 'N/A'}\n` +
    `Phone: ${meetingData.phone || 'N/A'}\n` +
    `Requested Date: ${meetingData.preferredDate || 'N/A'}\n` +
    `Requested Time: ${meetingData.preferredTime || 'N/A'}\n` +
    `Project Type: ${meetingData.projectType || 'N/A'}\n` +
    `Location: ${meetingData.propertyLocation || 'N/A'}\n` +
    `Notes: ${meetingData.notes || 'N/A'}\n\n` +
    `Company: ${companyContext.name || 'TrendyInterios'}\n` +
    `Address: ${companyContext.address || 'N/A'}\n` +
    `Phone: ${companyContext.phone || 'N/A'}\n` +
    `Email: ${companyContext.email || 'N/A'}`
  );

  const startDate = buildStartDate(meetingData.preferredDate, meetingData.preferredTime);
  const startTimestamp = startDate ? toICSTimestamp(startDate) : toICSTimestamp(new Date());
  const endDate = startDate ? new Date(startDate.getTime() + 60 * 60 * 1000) : new Date(new Date().getTime() + 60 * 60 * 1000);
  const endTimestamp = toICSTimestamp(endDate);
  const timestamp = toICSTimestamp(new Date());
  const uid = `${randomUUID()}@trendyinteriors.com`;

  const organizerEmail = companyContext.email || 'info@trendyinteriors.com';
  const attendeeEmail = meetingData.email || 'no-reply@trendyinteriors.com';
  const attendeeName = escapeICS(meetingData.name || 'Customer');
  const organizerName = escapeICS(companyContext.name || 'TrendyInterios');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//TrendyInterios//Meeting Request//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${startTimestamp}`,
    `DTEND:${endTimestamp}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    `ATTENDEE;CN=${attendeeName};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${attendeeEmail}`,
    `LOCATION:${location}`,
    'CLASS:PUBLIC',
    'SEQUENCE:0',
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return Buffer.from(icsLines.join('\r\n'), 'utf-8');
};

module.exports = {
  buildCalendarInvite,
};
