/**
 * Injects PostHog chunk IDs into the built JS and uploads the matching
 * source maps for error-tracking de-minification, then deletes the local
 * .map files so they aren't published to dist/.
 *
 * No-ops (with a log line) if POSTHOG_CLI_API_KEY isn't set, so local
 * `npm run build` still works without PostHog credentials.
 *
 * Requires POSTHOG_CLI_API_KEY (personal API key) as an env var, e.g. in
 * Vercel project settings. Project is on the EU cloud (see posthog-setup-report.md).
 */

import { spawnSync } from 'child_process'

// Note: this is the PostHog app/API host (eu.posthog.com), not the ingestion
// host used by the client SDK (VITE_POSTHOG_HOST, eu.i.posthog.com) — they differ.
const POSTHOG_HOST = process.env.POSTHOG_CLI_HOST || 'https://eu.posthog.com'

if (!process.env.POSTHOG_CLI_API_KEY) {
  console.log('[upload-sourcemaps] POSTHOG_CLI_API_KEY not set, skipping source map upload.')
  process.exit(0)
}

const result = spawnSync(
  'npx',
  ['--yes', '@posthog/cli', '--host', POSTHOG_HOST, 'sourcemap', 'process', '--directory', 'dist', '--delete-after'],
  { stdio: 'inherit' }
)

process.exit(result.status ?? 1)
