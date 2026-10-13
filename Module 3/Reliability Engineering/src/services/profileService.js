const DEFAULT_AVATAR = {
  url: 'https://cdn.aurora-profiles.dev/avatars/default.png',
  initials: '?',
  source: 'fallback',
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryable(error) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if (error.name === 'AbortError' || error.code === 'ABORT_ERR') {
    return true;
  }

  const status = error.status ?? error.statusCode ?? error.response?.status;

  if (status !== undefined && status !== null) {
    const numStatus = Number(status);
    if (Number.isFinite(numStatus) && numStatus > 0) {
      if (numStatus === 429) {
        return true;
      }
      return numStatus >= 500 && numStatus <= 599;
    }
    if (numStatus === 0) {
      return true;
    }
    return false;
  }

  // Network errors that do not have an HTTP status
  return true;
}

async function withTimeout(operation, timeoutMs = 200) {
  const controller = new AbortController();
  let timerId;

  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      controller.abort();
      const error = new Error(`Operation timed out after ${timeoutMs}ms`);
      error.name = 'AbortError';
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      timeoutPromise,
    ]);
  } finally {
    clearTimeout(timerId);
  }
}

async function withRetry(operation, options = {}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 25;

  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error)) {
        throw error;
      }
      if (attempt < maxAttempts - 1) {
        await sleep(baseDelayMs * 2 ** attempt);
      }
    }
  }

  if (lastError !== undefined) {
    throw lastError;
  }
  throw new Error('No attempts were made');
}

async function getProfileWithAvatar(authorId, avatarClient, options = {}) {
  const timeoutMs = options.timeoutMs ?? 200;
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 25;

  try {
    const avatar = await withRetry(
      () => withTimeout((signal) => avatarClient.getAvatar(authorId, { signal }), timeoutMs),
      { ...options, maxAttempts, baseDelayMs }
    );
    return {
      authorId,
      avatar,
      degraded: false,
    };
  } catch (error) {
    return {
      authorId,
      avatar: DEFAULT_AVATAR,
      degraded: true,
    };
  }
}

module.exports = {
  DEFAULT_AVATAR,
  sleep,
  isRetryable,
  withTimeout,
  withRetry,
  getProfileWithAvatar,
};
