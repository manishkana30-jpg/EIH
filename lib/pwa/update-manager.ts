/**
 * lib/pwa/update-manager.ts
 * Unified PWA deployment detection, version tracking, and zero-downtime cache purge.
 */

export interface VersionManifest {
  version: string;
  buildId: string;
  commit: string;
  learnedCount: number;
  timestamp: number;
}

export interface UpdateState {
  isChecking: boolean;
  updateAvailable: boolean;
  currentVersion: string;
  currentBuildId: string;
  serverVersion: string | null;
  serverBuildId: string | null;
  serverCommit: string | null;
  learnedCount: number | null;
  lastCheckedTime: number | null;
  isUpdating: boolean;
  updateError: string | null;
}

type UpdateListener = (state: UpdateState) => void;

class UpdateManager {
  private static instance: UpdateManager;
  private listeners: Set<UpdateListener> = new Set();

  private state: UpdateState = {
    isChecking: false,
    updateAvailable: false,
    currentVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.2.2',
    currentBuildId: process.env.NEXT_PUBLIC_BUILD_TIME || '1.2.2',
    serverVersion: null,
    serverBuildId: null,
    serverCommit: null,
    learnedCount: null,
    lastCheckedTime: null,
    isUpdating: false,
    updateError: null,
  };

  private pollInterval: NodeJS.Timeout | null = null;
  private hasInitialized = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Resolve client build ID from NEXT_DATA if build time was empty
      const nextDataBuildId = (window as any).__NEXT_DATA__?.buildId;
      if (nextDataBuildId && (!this.state.currentBuildId || this.state.currentBuildId === '1.2.2')) {
        this.state.currentBuildId = nextDataBuildId;
      }

      // Check if this was a fresh load after applying an update
      const storedActive = localStorage.getItem('eih_active_build_id');
      if (storedActive && !this.state.currentBuildId) {
        this.state.currentBuildId = storedActive;
      }
    }
  }

  public static getInstance(): UpdateManager {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager();
    }
    return UpdateManager.instance;
  }

  public getState(): UpdateState {
    return { ...this.state };
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const currentState = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(currentState);
      } catch (err) {
        console.error('UpdateListener error:', err);
      }
    });
  }

  public initListeners(): void {
    if (typeof window === 'undefined' || this.hasInitialized) return;
    this.hasInitialized = true;

    // Listen for Service Worker updatefound event
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.info('🚀 ServiceWorker: New byte-level version installed and waiting.');
                this.state.updateAvailable = true;
                this.emit();
              }
            });
          }
        });
      });

      // Listen for custom dispatch from layout.tsx
      window.addEventListener('eih:updatefound', () => {
        this.state.updateAvailable = true;
        this.emit();
      });
    }

    // Check on initial load
    this.checkForUpdates();

    // Check periodically every 45 seconds
    this.pollInterval = setInterval(() => {
      this.checkForUpdates();
    }, 45000);

    // Check on visibility change (when returning to tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    });

    // Check on internet reconnect
    window.addEventListener('online', () => {
      this.checkForUpdates();
    });
  }

  /**
   * Fetches latest deployment manifest from /api/version and compares with active client build.
   */
  public async checkForUpdates(force = false): Promise<UpdateState> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      return this.getState();
    }

    if (
      !force &&
      (localStorage.getItem('disable_auto_reload') === 'true' ||
        (window as any).__PLAYWRIGHT_TEST__)
    ) {
      return this.getState();
    }

    this.state.isChecking = true;
    this.state.updateError = null;
    this.emit();

    try {
      // Trigger SW check in parallel
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update().catch(() => {});
        });
      }

      const res = await fetch(`/api/version?_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data: VersionManifest = await res.json();
      const serverBuild = (data.buildId || '').trim();
      const currentBuild = (this.state.currentBuildId || '').trim();
      const serverVer = (data.version || '').trim();
      const currentVer = (this.state.currentVersion || '').trim();

      this.state.serverVersion = serverVer;
      this.state.serverBuildId = serverBuild;
      this.state.serverCommit = data.commit || null;
      this.state.learnedCount = data.learnedCount ?? null;
      this.state.lastCheckedTime = Date.now();

      // Check if build ID or semver differs
      const hasBuildDifference = Boolean(
        serverBuild &&
          currentBuild &&
          serverBuild !== currentBuild &&
          serverBuild !== 'local-build' &&
          currentBuild !== 'local-build'
      );

      const hasVersionDifference = Boolean(
        serverVer && currentVer && serverVer !== currentVer
      );

      const isDifferent = hasBuildDifference || hasVersionDifference;

      if (isDifferent) {
        console.info(
          `🚀 EIH Update Found: Server [${serverBuild} | ${serverVer}] !== Client [${currentBuild} | ${currentVer}]`
        );
        this.state.updateAvailable = true;
      } else {
        // App is on current build
        this.state.updateAvailable = false;
        // Keep active build ID persisted
        if (serverBuild && serverBuild !== 'local-build') {
          localStorage.setItem('eih_active_build_id', serverBuild);
        }
      }
    } catch (err: any) {
      console.warn('EIH update check notice:', err);
      this.state.updateError = err?.message || 'Network check failed';
    } finally {
      this.state.isChecking = false;
      this.emit();
    }

    return this.getState();
  }

  /**
   * Performs an instant 100% clean cache purge, signals the Service Worker, and reloads to the latest build.
   */
  public async performFullAppUpdate(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.state.isUpdating = true;
    this.emit();

    try {
      console.info('🔄 Initiating comprehensive PWA cache purge and fresh activation...');

      // 1. Tell all active and waiting service workers to skip waiting and purge caches
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'PURGE_AND_UPDATE' });
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            if (reg.active) {
              reg.active.postMessage({ type: 'PURGE_AND_UPDATE' });
            }
            // Trigger update check
            reg.update().catch(() => {});
          }
        } catch (swErr) {
          console.warn('SW message notice:', swErr);
        }
      }

      // 2. Client-side explicit cache deletion (purges static HTML, chunks, and worklets)
      if ('caches' in window) {
        try {
          const cacheKeys = await window.caches.keys();
          await Promise.all(
            cacheKeys.map((key) => {
              // Preserve persistent fonts if desired, otherwise delete all app caches
              if (!key.includes('fonts')) {
                return window.caches.delete(key);
              }
              return Promise.resolve(true);
            })
          );
        } catch (cacheErr) {
          console.warn('Caches delete notice:', cacheErr);
        }
      }

      // 3. Persist new target build ID so future checks align immediately
      if (this.state.serverBuildId) {
        localStorage.setItem('eih_active_build_id', this.state.serverBuildId);
      }

      // 4. Force browser navigation with cache-busting query parameter
      setTimeout(() => {
        const cleanPath = window.location.pathname;
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('_upd', String(Date.now()));
        window.location.replace(`${cleanPath}?${searchParams.toString()}`);
      }, 500);
    } catch (err: any) {
      console.error('Critical update execution error:', err);
      // Hard fallback reload
      window.location.reload();
    }
  }

  public destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
    this.hasInitialized = false;
  }
}

export const updateManager = UpdateManager.getInstance();
export default updateManager;
