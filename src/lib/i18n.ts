import translations from '../locales/es.json';

export function t(path: string, params?: Record<string, string | number>) {
  const keys = path.split('.');
  let value: unknown = translations as unknown;

  for (const key of keys) {
    if (typeof value !== 'object' || value === null || !(key in value)) {
      return path;
    }

    value = (value as Record<string, unknown>)[key];
  }

  if (typeof value !== 'string') {
    return path;
  }

  if (!params) {
    return value;
  }

  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const replacement = params[key];
    return replacement === undefined ? `{{${key}}}` : String(replacement);
  });
}
