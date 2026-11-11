export interface ServerEnvironment {
  frontendPublicUrl: URL;
  backendPublicUrl: URL;
  backendInternalApiUrl: URL;
}

function readUrl(name: string, value: string | undefined): URL {
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `Server environment variable ${name} must be an absolute URL.`,
    );
  }

  if (!new Set(["http:", "https:"]).has(url.protocol)) {
    throw new Error(
      `Server environment variable ${name} must use HTTP or HTTPS.`,
    );
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      `Server environment variable ${name} must not contain credentials, query, or fragment data.`,
    );
  }

  return url;
}

export function getServerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): ServerEnvironment {
  const frontendPublicUrl = readUrl(
    "FRONTEND_PUBLIC_URL",
    environment.FRONTEND_PUBLIC_URL,
  );
  const backendPublicUrl = readUrl(
    "BACKEND_PUBLIC_URL",
    environment.BACKEND_PUBLIC_URL,
  );
  const backendInternalApiUrl = readUrl(
    "BACKEND_INTERNAL_API_URL",
    environment.BACKEND_INTERNAL_API_URL,
  );

  if (frontendPublicUrl.origin === backendPublicUrl.origin) {
    throw new Error(
      "FRONTEND_PUBLIC_URL and BACKEND_PUBLIC_URL must be distinct origins.",
    );
  }

  return { frontendPublicUrl, backendPublicUrl, backendInternalApiUrl };
}
