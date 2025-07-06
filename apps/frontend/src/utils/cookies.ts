// Cookie management utilities for EmotiAnalyze platform
export interface CookieOptions {
  expires?: Date | number; // Date object or days from now
  maxAge?: number; // seconds
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export class CookieManager {
  private static defaultOptions: CookieOptions = {
    path: '/',
    secure: window.location.protocol === 'https:',
    sameSite: 'lax'
  };

  /**
   * Set a cookie with the given name, value, and options
   */
  static set(name: string, value: string, options: CookieOptions = {}): void {
    const opts = { ...this.defaultOptions, ...options };
    
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    
    if (opts.expires) {
      if (typeof opts.expires === 'number') {
        // Convert days to Date
        const date = new Date();
        date.setTime(date.getTime() + (opts.expires * 24 * 60 * 60 * 1000));
        cookieString += `; expires=${date.toUTCString()}`;
      } else {
        cookieString += `; expires=${opts.expires.toUTCString()}`;
      }
    }
    
    if (opts.maxAge) {
      cookieString += `; max-age=${opts.maxAge}`;
    }
    
    if (opts.path) {
      cookieString += `; path=${opts.path}`;
    }
    
    if (opts.domain) {
      cookieString += `; domain=${opts.domain}`;
    }
    
    if (opts.secure) {
      cookieString += '; secure';
    }
    
    if (opts.sameSite) {
      cookieString += `; samesite=${opts.sameSite}`;
    }
    
    document.cookie = cookieString;
  }

  /**
   * Get a cookie value by name
   */
  static get(name: string): string | null {
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      let c = cookie.trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
    
    return null;
  }

  /**
   * Remove a cookie by setting its expiration to the past
   */
  static remove(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
    this.set(name, '', {
      ...options,
      expires: new Date(0)
    });
  }

  /**
   * Check if a cookie exists
   */
  static exists(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * Get all cookies as an object
   */
  static getAll(): Record<string, string> {
    const cookies: Record<string, string> = {};
    const cookieArray = document.cookie.split(';');
    
    for (let cookie of cookieArray) {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    }
    
    return cookies;
  }
}

// Specific cookie keys for EmotiAnalyze
export const COOKIE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'ea_auth_token',
  REFRESH_TOKEN: 'ea_refresh_token',
  USER_ID: 'ea_user_id',
  
  // User Preferences
  THEME_MODE: 'ea_theme_mode',
  LANGUAGE: 'ea_language',
  TIMEZONE: 'ea_timezone',
  
  // Application Settings
  ANALYTICS_PREFERENCE: 'ea_analytics_pref',
  NOTIFICATION_SETTINGS: 'ea_notifications',
  DASHBOARD_LAYOUT: 'ea_dashboard_layout',
  
  // Session Management
  SESSION_ID: 'ea_session_id',
  LAST_ACTIVITY: 'ea_last_activity',
  
  // Privacy & Consent
  COOKIE_CONSENT: 'ea_cookie_consent',
  PRIVACY_CONSENT: 'ea_privacy_consent',
  MARKETING_CONSENT: 'ea_marketing_consent',
  
  // Feature Preferences
  AUTO_SAVE_SURVEYS: 'ea_auto_save_surveys',
  REMEMBER_FORM_DATA: 'ea_remember_forms',
  ENABLE_VOICE_COMMANDS: 'ea_voice_commands',
  
  // Performance
  PREFERRED_API_ENDPOINT: 'ea_api_endpoint',
  CACHE_PREFERENCES: 'ea_cache_prefs'
} as const;

// Cookie Categories for GDPR compliance
export enum CookieCategory {
  NECESSARY = 'necessary',
  FUNCTIONAL = 'functional',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing'
}

// Cookie information for consent management
export interface CookieInfo {
  key: string;
  name: string;
  description: string;
  category: CookieCategory;
  expires: number; // days
  essential: boolean;
}

export const COOKIE_REGISTRY: CookieInfo[] = [
  // Necessary Cookies
  {
    key: COOKIE_KEYS.AUTH_TOKEN,
    name: 'Authentication Token',
    description: 'Keeps you logged in securely',
    category: CookieCategory.NECESSARY,
    expires: 7,
    essential: true
  },
  {
    key: COOKIE_KEYS.SESSION_ID,
    name: 'Session Identifier',
    description: 'Maintains your session state',
    category: CookieCategory.NECESSARY,
    expires: 1,
    essential: true
  },
  {
    key: COOKIE_KEYS.COOKIE_CONSENT,
    name: 'Cookie Consent',
    description: 'Remembers your cookie preferences',
    category: CookieCategory.NECESSARY,
    expires: 365,
    essential: true
  },
  
  // Functional Cookies
  {
    key: COOKIE_KEYS.THEME_MODE,
    name: 'Theme Preference',
    description: 'Remembers your light/dark mode preference',
    category: CookieCategory.FUNCTIONAL,
    expires: 365,
    essential: false
  },
  {
    key: COOKIE_KEYS.LANGUAGE,
    name: 'Language Setting',
    description: 'Stores your preferred language',
    category: CookieCategory.FUNCTIONAL,
    expires: 365,
    essential: false
  },
  {
    key: COOKIE_KEYS.DASHBOARD_LAYOUT,
    name: 'Dashboard Layout',
    description: 'Saves your dashboard customization',
    category: CookieCategory.FUNCTIONAL,
    expires: 90,
    essential: false
  },
  
  // Analytics Cookies
  {
    key: COOKIE_KEYS.ANALYTICS_PREFERENCE,
    name: 'Analytics Tracking',
    description: 'Helps us understand how you use the platform',
    category: CookieCategory.ANALYTICS,
    expires: 730,
    essential: false
  },
  {
    key: COOKIE_KEYS.LAST_ACTIVITY,
    name: 'Activity Tracking',
    description: 'Tracks usage patterns for improving user experience',
    category: CookieCategory.ANALYTICS,
    expires: 30,
    essential: false
  }
];

// High-level cookie management functions for specific use cases
export class EmotiAnalyzeCookies {
  /**
   * Set authentication cookies securely
   */
  static setAuth(token: string, refreshToken?: string, userId?: string): void {
    CookieManager.set(COOKIE_KEYS.AUTH_TOKEN, token, {
      expires: 7, // 7 days
      secure: true,
      sameSite: 'strict'
    });
    
    if (refreshToken) {
      CookieManager.set(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, {
        expires: 30, // 30 days
        secure: true,
        sameSite: 'strict'
      });
    }
    
    if (userId) {
      CookieManager.set(COOKIE_KEYS.USER_ID, userId, {
        expires: 30,
        secure: true,
        sameSite: 'strict'
      });
    }
  }

  /**
   * Get authentication data from cookies
   */
  static getAuth(): { token: string | null; refreshToken: string | null; userId: string | null } {
    return {
      token: CookieManager.get(COOKIE_KEYS.AUTH_TOKEN),
      refreshToken: CookieManager.get(COOKIE_KEYS.REFRESH_TOKEN),
      userId: CookieManager.get(COOKIE_KEYS.USER_ID)
    };
  }

  /**
   * Clear authentication cookies
   */
  static clearAuth(): void {
    CookieManager.remove(COOKIE_KEYS.AUTH_TOKEN);
    CookieManager.remove(COOKIE_KEYS.REFRESH_TOKEN);
    CookieManager.remove(COOKIE_KEYS.USER_ID);
    CookieManager.remove(COOKIE_KEYS.SESSION_ID);
  }

  /**
   * Set user preferences
   */
  static setPreferences(preferences: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    notifications?: boolean;
  }): void {
    if (preferences.theme) {
      CookieManager.set(COOKIE_KEYS.THEME_MODE, preferences.theme, { expires: 365 });
    }
    
    if (preferences.language) {
      CookieManager.set(COOKIE_KEYS.LANGUAGE, preferences.language, { expires: 365 });
    }
    
    if (preferences.timezone) {
      CookieManager.set(COOKIE_KEYS.TIMEZONE, preferences.timezone, { expires: 365 });
    }
    
    if (preferences.notifications !== undefined) {
      CookieManager.set(COOKIE_KEYS.NOTIFICATION_SETTINGS, preferences.notifications.toString(), { expires: 365 });
    }
  }

  /**
   * Get user preferences
   */
  static getPreferences(): {
    theme: string | null;
    language: string | null;
    timezone: string | null;
    notifications: boolean | null;
  } {
    return {
      theme: CookieManager.get(COOKIE_KEYS.THEME_MODE),
      language: CookieManager.get(COOKIE_KEYS.LANGUAGE),
      timezone: CookieManager.get(COOKIE_KEYS.TIMEZONE),
      notifications: CookieManager.get(COOKIE_KEYS.NOTIFICATION_SETTINGS) === 'true'
    };
  }

  /**
   * Set consent preferences
   */
  static setConsent(consents: {
    necessary?: boolean;
    functional?: boolean;
    analytics?: boolean;
    marketing?: boolean;
  }): void {
    const consentData = JSON.stringify({
      ...consents,
      timestamp: new Date().toISOString(),
      version: '1.0'
    });
    
    CookieManager.set(COOKIE_KEYS.COOKIE_CONSENT, consentData, { expires: 365 });
  }

  /**
   * Get consent preferences
   */
  static getConsent(): {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp?: string;
  } | null {
    const consentData = CookieManager.get(COOKIE_KEYS.COOKIE_CONSENT);
    
    if (!consentData) {
      return null;
    }
    
    try {
      return JSON.parse(consentData);
    } catch {
      return null;
    }
  }

  /**
   * Check if analytics cookies are allowed
   */
  static isAnalyticsAllowed(): boolean {
    const consent = this.getConsent();
    return consent?.analytics === true;
  }

  /**
   * Check if functional cookies are allowed
   */
  static isFunctionalAllowed(): boolean {
    const consent = this.getConsent();
    return consent?.functional === true;
  }

  /**
   * Set session tracking
   */
  static setSession(sessionId: string): void {
    CookieManager.set(COOKIE_KEYS.SESSION_ID, sessionId, {
      expires: 1, // 1 day
      secure: true,
      sameSite: 'strict'
    });
    
    CookieManager.set(COOKIE_KEYS.LAST_ACTIVITY, new Date().toISOString(), {
      expires: 1
    });
  }

  /**
   * Update last activity timestamp
   */
  static updateActivity(): void {
    if (this.isAnalyticsAllowed()) {
      CookieManager.set(COOKIE_KEYS.LAST_ACTIVITY, new Date().toISOString(), {
        expires: 1
      });
    }
  }
}

export default CookieManager; 