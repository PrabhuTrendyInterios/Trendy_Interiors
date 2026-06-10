const formatValidationError = (err) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return messages.join(', ');
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return `${field} '${value}' already exists`;
  }

  return err.message || 'Server Error';
};

const sendSuccess = (res, statusCode, payload) => {
  res.status(statusCode).json({ success: true, ...payload });
};

const sendError = (res, statusCode, message) => {
  res.status(statusCode).json({ success: false, message });
};

module.exports = {
  formatValidationError,
  sendSuccess,
  sendError,
};
