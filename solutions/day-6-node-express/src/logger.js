function logError(event, error, context = {}) {
  const entry = { level: 'error', event, ...context };
  if (error && typeof error === 'object') {
    entry.error = typeof error.name === 'string' ? error.name : 'Error';
    if (typeof error.code === 'string' || typeof error.code === 'number') {
      entry.code = error.code;
    }
  }
  console.error(JSON.stringify(entry));
}

module.exports = { logError };
