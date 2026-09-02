/**
 * lib/pwa/install-manager.ts
 *
 * Universal PWA Installation Manager (v2.0)
 * Handles native browser prompts on Android, Windows, and Chrome Desktop,
 * and detects iOS Safari to provide step-by-step Home Screen installation overlays.
 */

// BeforeInstallPromptEvent type definition
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type PWAInstallPlatform = 'android' | 'ios' | 'windows' | 'desktop' | 'unknown';

type InstallAvailabilityListener = (canInstall: boolean, platform: PWAInstallPlatform) => void;

export class PWAInstallManager {
  private static instance: PWAInstallManager | null = null;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  public readonly platform: PWAInstallPlatform;
  private listeners: Set<InstallAvailabilityListener> = new Set();
  private isInstalled: boolean = false;

  private constructor() {
    this.platform = this.detectPlatform();
    if (typeof window !== 'undefined') {
      this.checkInstalledState();
      this.initEventListeners();
    }
  }

  public static getInstance(): PWAInstallManager {
    if (!PWAInstallManager.instance) {
      PWAInstallManager.instance = new PWAInstallManager();
    }
    return PWAInstallManager.instance;
  }

  private detectPlatform(): PWAInstallPlatform {
    if (typeof window === 'undefined') return 'unknown';

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    if (/windows/.test(userAgent)) return 'windows';
    if (/macintosh|linux/.test(userAgent)) return 'desktop';

    return 'unknown';
  }

  private checkInstalledState(): void {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    this.isInstalled = isStandalone;
  }

  private initEventListeners(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notifyListeners(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      this.notifyListeners(false);
      console.log('[PWA] Application successfully installed.');
    });
  }

  public getCanInstall(): boolean {
    if (this.isInstalled) return false;
    if (this.platform === 'ios') return true; // iOS always can show manual guide if not standalone
    return this.deferredPrompt !== null;
  }

  public getIsInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Triggers native browser install prompt (Android, Windows, Chrome Desktop).
   */
  public async triggerNativePrompt(): Promise<'accepted' | 'dismissed' | 'ios_manual'> {
    if (this.platform === 'ios') {
      return 'ios_manual';
    }

    if (!this.deferredPrompt) {
      return 'dismissed';
    }

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.notifyListeners(false);
      return choice.outcome;
    } catch (err) {
      console.warn('[PWA] triggerNativePrompt error:', err);
      return 'dismissed';
    }
  }

  public onAvailabilityChange(fn: InstallAvailabilityListener): () => void {
    this.listeners.add(fn);
    fn(this.getCanInstall(), this.platform);
    return () => this.listeners.delete(fn);
  }

  private notifyListeners(canInstall: boolean): void {
    this.listeners.forEach((fn) => fn(canInstall, this.platform));
  }
}

export const pwaInstallManager = PWAInstallManager.getInstance();
