export function writeJSON(res, statusCode, data) {
  res.status(statusCode).json(data);
}

export function jsonError(res, message, statusCode = 400) {
  res.status(statusCode).json({ error: message });
}
