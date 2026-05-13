const configCache = new Map();

export async function loadConfig(path) {
  if (configCache.has(path)) {
    return configCache.get(path);
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Konfiguration konnte nicht geladen werden: ${path}`);
  }

  const parsed = await response.json();
  configCache.set(path, parsed);
  return parsed;
}
