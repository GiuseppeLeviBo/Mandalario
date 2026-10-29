const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

// Execute the real worker, including event.waitUntil/respondWith. Cache Storage
// is shared across scopes, just as it is for apps on one GitHub Pages origin.
const source = readFileSync(join(__dirname, '..', 'sw.js'), 'utf8');
const scope = 'https://giuseppelevibo.github.io/Mandalario/';
const foreignNames = [
  'md-editor-shell-v0.70.0@/MD_Editor/',
  'md-editor-shell-v0.69.0@/MD_Editor/',
  'md-editor-shell-v0.70.0@/MD_Editor/dev/',
  'md-editor-shell-v0.65.0',
  'another-app-v1',
  'mandalario2-1.0.0',
  'other-mandalario-1.0.0',
  'mandalario'
];

function createWorker({ beforeDelete = async () => {} } = {}) {
  const entries = new Map();
  const deleted = [];
  const completedDeletes = [];
  const listeners = new Map();
  let claims = 0;
  let skips = 0;
  let networkRequests = 0;
  const urlOf = request => new URL(
    typeof request === 'string' ? request : request.url, scope
  ).href;
  function open(name) {
    if (!entries.has(name)) entries.set(name, new Map());
    const cache = entries.get(name);
    return {
      async addAll(urls) {
        for (const url of urls) cache.set(urlOf(url), new Response(`cached ${urlOf(url)}`));
      },
      async match(request) { return cache.get(urlOf(request))?.clone(); },
      async put(request, response) { cache.set(urlOf(request), response.clone()); }
    };
  }
  runInNewContext(source, {
    URL,
    location: new URL(scope),
    self: {
      addEventListener: (name, handler) => listeners.set(name, handler),
      skipWaiting: async () => { skips++; },
      clients: { claim: async () => { claims++; } }
    },
    caches: {
      open: async name => open(name),
      keys: async () => [...entries.keys()],
      delete: async name => {
        deleted.push(name);
        await beforeDelete(name);
        const removed = entries.delete(name);
        completedDeletes.push(name);
        return removed;
      },
      match: async request => {
        for (const cache of entries.values()) {
          const response = cache.get(urlOf(request));
          if (response) return response.clone();
        }
      }
    },
    fetch: async () => {
      networkRequests++;
      throw new TypeError('Network offline');
    }
  }, { filename: 'sw.js' });

  function dispatch(type, properties = {}) {
    const pending = [];
    let response;
    listeners.get(type)({
      ...properties,
      waitUntil: promise => pending.push(promise),
      respondWith: promise => { response = promise; }
    });
    return Promise.all(pending).then(() => response);
  }
  return {
    entries, deleted, completedDeletes, dispatch,
    get claims() { return claims; },
    get skips() { return skips; },
    get networkRequests() { return networkRequests; },
    seed(name) {
      entries.set(name, new Map([[`${scope}sentinel`, new Response(name)]]));
    }
  };
}

test('install precaches the offline shell and requests activation', async () => {
  const worker = createWorker();
  await worker.dispatch('install');
  assert.equal(worker.entries.size, 1);
  const [cache] = worker.entries.values();
  for (const path of ['', 'index.html', 'manifest.webmanifest', 'icons/icon.svg',
    'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png']) {
    assert.ok(cache.has(new URL(path, scope).href), `Missing offline asset: ${path}`);
  }
  assert.equal(worker.skips, 1);
});

test('activation deletes only obsolete Mandalario caches and preserves other apps', async () => {
  const worker = createWorker();
  const obsolete = ['mandalario-1.0.0', 'mandalario-1.1.0'];
  for (const name of [...obsolete, ...foreignNames]) worker.seed(name);
  // Empty unrelated caches must be preserved too.
  worker.entries.set('unrelated-empty-cache', new Map());
  await worker.dispatch('install');
  const current = [...worker.entries.keys()].at(-1);
  const expected = [...foreignNames, 'unrelated-empty-cache', current].sort();
  await worker.dispatch('activate');
  assert.deepEqual(worker.deleted.sort(), obsolete);
  assert.deepEqual([...worker.entries.keys()].sort(), expected);
  for (const name of foreignNames) {
    assert.equal(await worker.entries.get(name).get(`${scope}sentinel`).text(), name);
  }
  assert.equal(worker.claims, 1);
  await worker.dispatch('activate');
  assert.equal(worker.deleted.length, obsolete.length, 'Cleanup must be idempotent');
});

test('activation without obsolete caches preserves the current cache and foreign caches', async () => {
  const worker = createWorker();
  for (const name of foreignNames) worker.seed(name);
  await worker.dispatch('install');
  const before = [...worker.entries.keys()];
  await worker.dispatch('activate');
  assert.deepEqual(worker.deleted, []);
  assert.deepEqual([...worker.entries.keys()], before);
  assert.equal(worker.claims, 1);
});

test('activation waits for every obsolete cache deletion before claiming clients', async () => {
  const releases = new Map();
  const worker = createWorker({
    beforeDelete: name => new Promise(resolve => releases.set(name, resolve))
  });
  worker.seed('mandalario-1.0.0');
  worker.seed('mandalario-1.1.0');
  await worker.dispatch('install');
  let finished = false;
  const activation = worker.dispatch('activate').then(() => { finished = true; });
  await new Promise(setImmediate);
  assert.equal(releases.size, 2);
  assert.equal(finished, false);
  assert.equal(worker.claims, 0);
  releases.get('mandalario-1.0.0')();
  await new Promise(setImmediate);
  assert.equal(finished, false);
  assert.equal(worker.claims, 0);
  releases.get('mandalario-1.1.0')();
  await activation;
  assert.equal(worker.completedDeletes.length, 2);
  assert.equal(worker.claims, 1);
});

test('the installed shell still serves navigation and core assets offline after cleanup', async () => {
  const worker = createWorker();
  worker.seed('mandalario-1.0.0');
  for (const name of foreignNames) worker.seed(name);
  await worker.dispatch('install');
  await worker.dispatch('activate');
  const page = await worker.dispatch('fetch', {
    request: { method: 'GET', mode: 'navigate', url: `${scope}?f=mandala&c=offline` }
  });
  assert.equal(await page.text(), `cached ${scope}index.html`);
  assert.equal(worker.networkRequests, 1, 'Navigation must exercise the network failure fallback');
  const icon = await worker.dispatch('fetch', {
    request: { method: 'GET', mode: 'same-origin', url: `${scope}icons/icon.svg` }
  });
  assert.equal(await icon.text(), `cached ${scope}icons/icon.svg`);
  assert.equal(worker.networkRequests, 1, 'A cached core asset must not need the network');
});
