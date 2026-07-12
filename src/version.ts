import packageJson from '../package.json' with { type: 'json' };

export const VERSION = packageJson.version;
export const USER_AGENT = `mrx-cli/${VERSION}`;
