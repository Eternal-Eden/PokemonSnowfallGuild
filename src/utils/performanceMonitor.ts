'use client';

export interface PerformanceMetrics {
  userAgent: string;
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  fp: number | null;
  tti: number | null;
  firstCpuIdle: number | null;
  pageStayDuration: number;
  timestamp: number;
  url: string;
}

class PerformanceMonitor {
  private startTime: number;
  private metrics: Partial<PerformanceMetrics> = {};
  private observer: PerformanceObserver | null = null;
  private lcpObserver: PerformanceObserver | null = null;
  private clsObserver: PerformanceObserver | null = null;
  private inpObserver: PerformanceObserver | null = null;

  constructor() {
    this.startTime = Date.now();
    this.initializeMetrics();
    this.setupObservers();
  }

  private initializeMetrics() {
    this.metrics = {
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      url: window.location.href,
      lcp: null,
      inp: null,
      cls: null,
      fp: null,
      tti: null,
      firstCpuIdle: null,
      pageStayDuration: 0
    };
  }

  private setupObservers() {
    if (typeof window === 'undefined') return;

    // LCP Observer
    if ('PerformanceObserver' in window) {
      try {
        this.lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
          if (lastEntry) {
            this.metrics.lcp = lastEntry.startTime;
          }
        });
        this.lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        console.warn('LCP observer not supported');
      }

      // CLS Observer
      try {
        this.clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number };
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value;
            }
          }
          this.metrics.cls = (this.metrics.cls || 0) + clsValue;
        });
        this.clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch {
        console.warn('CLS observer not supported');
      }

      // INP Observer (Interaction to Next Paint)
      try {
        this.inpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const eventEntry = entry as PerformanceEntry & { processingStart: number };
            const inp = eventEntry.processingStart - entry.startTime;
            if (!this.metrics.inp || inp > this.metrics.inp) {
              this.metrics.inp = inp;
            }
          }
        });
        this.inpObserver.observe({ entryTypes: ['event'] });
      } catch {
        console.warn('INP observer not supported');
      }

      // Navigation and Paint timing
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.metrics.tti = navEntry.domInteractive - navEntry.fetchStart;
              this.metrics.firstCpuIdle = navEntry.domContentLoadedEventEnd - navEntry.fetchStart;
            } else if (entry.entryType === 'paint') {
              if (entry.name === 'first-paint') {
                this.metrics.fp = entry.startTime;
              }
            }
          }
        });
        this.observer.observe({ entryTypes: ['navigation', 'paint'] });
      } catch {
        console.warn('Navigation/Paint observer not supported');
      }
    }

    // Fallback for older browsers
    this.setupFallbackMetrics();
  }

  private setupFallbackMetrics() {
    if (typeof window === 'undefined') return;

    // Use performance.timing as fallback
    setTimeout(() => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        if (!this.metrics.fp) {
          this.metrics.fp = timing.responseStart - timing.navigationStart;
        }
        if (!this.metrics.tti) {
          this.metrics.tti = timing.domInteractive - timing.navigationStart;
        }
        if (!this.metrics.firstCpuIdle) {
          this.metrics.firstCpuIdle = timing.domContentLoadedEventEnd - timing.navigationStart;
        }
      }
    }, 1000);
  }

  public getMetrics(): PerformanceMetrics {
    const currentTime = Date.now();
    return {
      userAgent: this.metrics.userAgent || navigator.userAgent,
      lcp: this.metrics.lcp || null,
      inp: this.metrics.inp || null,
      cls: this.metrics.cls || null,
      fp: this.metrics.fp || null,
      tti: this.metrics.tti || null,
      firstCpuIdle: this.metrics.firstCpuIdle || null,
      pageStayDuration: currentTime - this.startTime,
      timestamp: currentTime,
      url: window.location.href
    };
  }

  public updatePageStayDuration() {
    this.metrics.pageStayDuration = Date.now() - this.startTime;
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.lcpObserver) {
      this.lcpObserver.disconnect();
    }
    if (this.clsObserver) {
      this.clsObserver.disconnect();
    }
    if (this.inpObserver) {
      this.inpObserver.disconnect();
    }
  }
}

// Global instance
let performanceMonitor: PerformanceMonitor | null = null;

export const initPerformanceMonitor = () => {
  if (typeof window !== 'undefined' && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

export const getPerformanceMetrics = (): PerformanceMetrics | null => {
  if (performanceMonitor) {
    performanceMonitor.updatePageStayDuration();
    return performanceMonitor.getMetrics();
  }
  return null;
};

export const destroyPerformanceMonitor = () => {
  if (performanceMonitor) {
    performanceMonitor.destroy();
    performanceMonitor = null;
  }
};