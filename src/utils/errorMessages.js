const TECHNICAL_ERROR_PATTERNS = [
  /exception/i,
  /java\./i,
  /org\.springframework/i,
  /failed to convert/i,
  /could not/i,
  /constraint/i,
  /foreign key/i,
  /sql/i,
  /stacktrace/i,
  /type mismatch/i,
];

export const safeErrorMessage = (message, fallback) => {
  if (!message || typeof message !== "string") return fallback;
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message))
    ? fallback
    : message;
};

export const readApiErrorMessage = async (response, fallback) => {
  const body = await response.json().catch(() => ({}));
  return safeErrorMessage(body.message, fallback);
};
