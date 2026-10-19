/**
 * Typst 编译组件的资源清单与按需下载缓存。
 *
 * wasm 与字体不随插件包分发（插件 ZIP 保持在 1 MiB 以内），首次编译时从
 * 公共 CDN 下载并校验 sha256，之后长期缓存在 IndexedDB，离线可用。
 */

const COMPILER_VERSION = "0.6.1-rc3";
const FONTS_VERSION = "1.0.0";
const CDN_ORIGINS = ["https://cdn.jsdelivr.net/npm", "https://unpkg.com"];

interface ResourceEntry {
  sha256: string;
  bytes: number;
  path: (origin: string) => string;
}

const compilerWasm: ResourceEntry = {
  sha256: "5343822b1753af265f2311fef3cc088f65b40ac708f0b4d1c8492f50d4f8017a",
  bytes: 21732903,
  path: origin =>
    `${origin}/@myriaddreamin/typst-ts-web-compiler@${COMPILER_VERSION}/pkg/typst_ts_web_compiler_bg.wasm`,
};

const rendererWasm: ResourceEntry = {
  sha256: "7b0ec2183bb6a68d830b169d71febf8c501c320d5a4d90944211b309ec224aa2",
  bytes: 981128,
  path: origin =>
    `${origin}/@myriaddreamin/typst-ts-renderer@${COMPILER_VERSION}/pkg/typst_ts_renderer_bg.wasm`,
};

/** 与 Typst 桌面发行版一致的默认字体集（@typst-wasm/fonts 打包的官方字体）。 */
const FONT_FILES: readonly [name: string, sha256: string, bytes: number][] = [
  ["DejaVuSansMono.ttf", "b4a6c3e4faab8773f4ff761d56451646409f29abedd68f05d38c2df667d3c582", 340712],
  ["DejaVuSansMono-Bold.ttf", "bce60f1b4421acd9ea51ba6623d7024ecbe6817a953e3654df62a5e6bdf8f769", 331992],
  ["DejaVuSansMono-Oblique.ttf", "742097840c541870e8d6dc5c9b37bb1ceeea6c0dedd1d475faf903ef9df734b0", 251932],
  ["DejaVuSansMono-BoldOblique.ttf", "91713a71d550bba22c2a6b2bb2a9ad8f9a159e12e4e9f0a5b2677998ba21213e", 253580],
  ["LibertinusSerif-Regular.otf", "fcf06307a77367394fcb0ccb241e59eea70dba3d732be309647611224679c733", 337132],
  ["LibertinusSerif-Italic.otf", "9a393d63d6e05f620d3dc0190dfd35a8ede58c0808cf0fc9de7fcb9c723e4c24", 332312],
  ["LibertinusSerif-Bold.otf", "0264914210ed51b3231ebc92ce529e9f2e166ba9eebf0cd4a579558690a27b64", 293908],
  ["LibertinusSerif-BoldItalic.otf", "47a665259f09f554f5d133d7718cdad43ff462c6a6b2328f38023465e62d57ce", 259176],
  ["LibertinusSerif-Semibold.otf", "a4b3f28e85881db34695c1f005e4c79233a6caf3a2bd286c9b418c025fb99308", 291640],
  ["LibertinusSerif-SemiboldItalic.otf", "397f0d7aba35ae6a988948ae046c14c6b1e0d270fcc6e292b8bc29fd625c6101", 343148],
  ["NewCM10-Regular.otf", "7e7bfec1dd8456ca76865ff7846b8764f2e0135749782b62751a2cc930a7c6c3", 717376],
  ["NewCM10-Italic.otf", "f360fdd01bd528154c535705bef03721737d25a95be622b5ef1ac540ea56ff44", 721044],
  ["NewCM10-Bold.otf", "3f04ed6056dcad95e214631a03cf0db0d30b22680d7274f03e63921a8e90d8f3", 629164],
  ["NewCM10-BoldItalic.otf", "8e056b54044b17ac812073c3bdac3b91e5b6ef768e99814baa8651a5d07b1738", 608856],
  ["NewCMMath-Book.otf", "60346e6fc27773d96c3cc9d3ac8a550a85e3ca624437179bd7a88b4ca18f0a18", 1431932],
  ["NewCMMath-Regular.otf", "925289812275068dfc9dd06ac44dcd206944ee2f58f9a08186c1fd3539520e05", 1306384],
  ["NewCMMath-Bold.otf", "528c420a827f1a6702c255c3e7b935a47d903906655bcb6cda8100820314447e", 1232012],
];

const fontEntries = new Map<string, ResourceEntry>(
  FONT_FILES.map(([name, sha256, bytes]) => [
    name,
    {
      sha256,
      bytes,
      path: origin => `${origin}/@typst-wasm/fonts@${FONTS_VERSION}/dist/files/${name}`,
    },
  ])
);

export const compilerResourceKey = "typst-ts-web-compiler.wasm";
export const rendererResourceKey = "typst-ts-renderer.wasm";
const resources = new Map<string, ResourceEntry>([
  [compilerResourceKey, compilerWasm],
  [rendererResourceKey, rendererWasm],
  ...[...fontEntries].map(([name, entry]) => [`fonts/${name}`, entry] as const),
]);

export const totalResourceBytes = [...resources.values()].reduce((sum, r) => sum + r.bytes, 0);

interface ByteCache {
  get(key: string): Promise<Uint8Array | undefined>;
  put(key: string, bytes: Uint8Array): Promise<void>;
}

const memoryCache = (): ByteCache => {
  const store = new Map<string, Uint8Array>();
  return {
    async get(key) {
      return store.get(key);
    },
    async put(key, bytes) {
      store.set(key, bytes);
    },
  };
};

const indexedDbCache = (database: string): ByteCache => {
  const open = () =>
    new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(database, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("resources");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB 打开失败"));
    });
  const run = <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) =>
    open().then(
      db =>
        new Promise<T>((resolve, reject) => {
          const request = action(db.transaction("resources", mode).objectStore("resources"));
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error ?? new Error("IndexedDB 读写失败"));
          request.transaction?.addEventListener("abort", () =>
            reject(request.error ?? new Error("IndexedDB 事务中断"))
          );
        })
    );
  return {
    get: key => run("readonly", store => store.get(key) as IDBRequest<Uint8Array | undefined>),
    put: (key, bytes) => run("readwrite", store => store.put(bytes, key)).then(() => undefined),
  };
};

let cache: ByteCache | undefined;
async function resourceCache(): Promise<ByteCache> {
  if (cache) return cache;
  cache = typeof indexedDB === "undefined" ? memoryCache() : indexedDbCache("tau-plugin-typst");
  return cache;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function download(key: string, entry: ResourceEntry, signal: AbortSignal): Promise<Uint8Array> {
  let lastError = "无法连接下载源";
  for (const origin of CDN_ORIGINS) {
    signal.throwIfAborted();
    try {
      const response = await fetch(entry.path(origin), { signal });
      if (!response.ok) throw new Error(`下载源返回 ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length !== entry.bytes) throw new Error(`文件大小不符（${bytes.length}）`);
      if ((await sha256(bytes)) !== entry.sha256) throw new Error("文件校验失败");
      return bytes;
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(`下载 ${key} 失败：${lastError}`);
}

export interface DownloadProgress {
  loadedBytes: number;
  totalBytes: number;
}

/**
 * 读取一份资源：优先取缓存，未命中时从 CDN 下载（含大小与 sha256 校验）后写入缓存。
 * onProgress 只在发生网络下载时上报累计进度。
 */
export async function loadResource(
  key: string,
  options: { signal?: AbortSignal; onProgress?: (progress: DownloadProgress) => void } = {}
): Promise<Uint8Array> {
  const entry = resources.get(key);
  if (!entry) throw new Error(`未知资源：${key}`);
  const store = await resourceCache();
  const cached = await store.get(key);
  if (cached) {
    if (cached.length === entry.bytes) return cached;
    await store.put(key, new Uint8Array());
  }
  const bytes = await download(key, entry, options.signal ?? new AbortController().signal);
  await store.put(key, bytes);
  options.onProgress?.({ loadedBytes: entry.bytes, totalBytes: totalResourceBytes });
  return bytes;
}

export interface EngineResources {
  compilerWasm: Uint8Array;
  rendererWasm: Uint8Array;
  fonts: Uint8Array[];
}

/** 依次取齐编译器、渲染器与字体；字体命中缓存时不产生网络请求。 */
export async function loadEngineResources(options: {
  signal?: AbortSignal;
  onProgress?: (progress: DownloadProgress) => void;
} = {}): Promise<EngineResources> {
  const signal = options.signal ?? new AbortController().signal;
  const loaded = new Map<string, Uint8Array>();
  let downloadedBytes = 0;
  const acquire = async (key: string) => {
    const bytes = await loadResource(key, {
      signal,
      onProgress: ({ loadedBytes }) => {
        downloadedBytes += loadedBytes;
        options.onProgress?.({
          loadedBytes: downloadedBytes,
          totalBytes: totalResourceBytes,
        });
      },
    });
    loaded.set(key, bytes);
    return bytes;
  };
  const compilerBytes = await acquire(compilerResourceKey);
  const rendererBytes = await acquire(rendererResourceKey);
  const fonts: Uint8Array[] = [];
  for (const key of resources.keys()) {
    if (!key.startsWith("fonts/")) continue;
    fonts.push(await acquire(key));
  }
  return { compilerWasm: compilerBytes, rendererWasm: rendererBytes, fonts };
}

/** 测试注入缓存实现；返回先前的实现以便还原。 */
export function setResourceCacheForTest(replacement: ByteCache | undefined): ByteCache | undefined {
  const previous = cache;
  cache = replacement;
  return previous;
}
