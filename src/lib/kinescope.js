/**
 * Kinescope server-side utilities.
 * ONLY import in server components / API route handlers.
 *
 * TUS Upload flow:
 *   1. Backend: POST https://uploader.kinescope.io/v2/init  (JSON, no file)
 *   2. Kinescope returns: { data: { id, endpoint } }
 *   3. Backend returns { videoId, uploadUrl } to client
 *   4. Client: tus-js-client uploads file directly to uploadUrl
 */

const KINESCOPE_INIT_URL  = 'https://uploader.kinescope.io/v2/init';
const API_SECRET          = process.env.KINESCOPE_API_SECRET;
const WEBHOOK_SECRET      = process.env.KINESCOPE_WEBHOOK_SECRET;
const AUTH_BACKEND_SECRET = process.env.KINESCOPE_AUTH_BACKEND_SECRET;

if (!API_SECRET && process.env.NODE_ENV !== 'test') {
  console.warn('[kinescope] KINESCOPE_API_SECRET is not set');
}

// ── ASCII-safe helper ──────────────────────────────────────────────────────
// Strips cyrillic and non-ASCII chars for use in Kinescope headers/metadata.
// Russian titles stay in Supabase — only this safe slug goes to Kinescope.
const TRANSLIT = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
};

export function toAsciiSafe(str) {
  if (!str) return 'video';
  return str
    .toLowerCase()
    .split('')
    .map(c => TRANSLIT[c] ?? (/[a-z0-9]/.test(c) ? c : '-'))
    .join('')
    .replace(/-+/g, '-')       // collapse multiple dashes
    .replace(/^-|-$/g, '')     // trim leading/trailing dashes
    .slice(0, 100)             // Kinescope title limit
    || 'video';
}

// ── Init TUS upload session ────────────────────────────────────────────────
/**
 * Call Kinescope init endpoint to get a TUS upload URL.
 *
 * POST https://uploader.kinescope.io/v2/init
 * Authorization: Bearer <KINESCOPE_API_SECRET>
 * Content-Type: application/json
 * Body: { client_ip, parent_id?, type, title, filename, filesize }
 *
 * Response 201: { data: { id, endpoint, ... } }
 *
 * @param {object} params
 * @param {string}  params.title      — ASCII-safe title (no cyrillic)
 * @param {string}  params.filename   — ASCII-safe filename
 * @param {number}  params.filesize   — file size in bytes
 * @param {string}  params.clientIp   — IP of the uploading client
 * @param {string}  [params.parentId] — Kinescope folder/project ID
 * @returns {{ videoId: string, uploadUrl: string }}
 */
export async function createUploadSession({ title, filename, filesize, clientIp, parentId }) {
  const resolvedParentId = parentId || process.env.KINESCOPE_PARENT_ID;

  if (!resolvedParentId) {
    throw new Error('KINESCOPE_PARENT_ID is missing');
  }

  const body = {
    client_ip: clientIp,
    parent_id: resolvedParentId,
    type:      'video',
    title:     toAsciiSafe(title),
    filename:  toAsciiSafe(filename),
    filesize,
  };

  console.log('KINESCOPE_PARENT_ID=', resolvedParentId);
  console.log('Kinescope init body=', body);

  const res = await fetch(KINESCOPE_INIT_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${API_SECRET}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Kinescope init → ${res.status}: ${text}`);
  }

  const json  = await res.json();
  const data  = json.data ?? json;

  if (!data.id || !data.endpoint) {
    throw new Error(`Kinescope init: unexpected response: ${JSON.stringify(json)}`);
  }

  return {
    videoId:   data.id,
    uploadUrl: data.endpoint,
  };
}

// ── Delete ─────────────────────────────────────────────────────────────────
export async function deleteVideo(videoId) {
  const res = await fetch(`https://api.kinescope.io/v1/videos/${videoId}`, {
    method:  'DELETE',
    headers: { 'Authorization': `Bearer ${API_SECRET}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Kinescope DELETE ${videoId} → ${res.status}: ${text}`);
  }
}

// ── Webhook signature ──────────────────────────────────────────────────────
export async function validateWebhookSignature(rawBody, signatureHeader) {
  if (!WEBHOOK_SECRET) return true;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256=${hex}` === signatureHeader;
}

// ── Auth Backend ───────────────────────────────────────────────────────────
export function validateAuthBackendRequest(authHeader) {
  if (!AUTH_BACKEND_SECRET) return true;
  return authHeader === AUTH_BACKEND_SECRET;
}
