import './styles.css';

interface NotificationData {
  id: string;
  type: 'purchase' | 'review' | 'visitor' | 'signup' | 'custom';
  message: string;
  customerName?: string;
  location?: string;
  product?: string;
  timestamp: string;
  avatar?: string;
  rating?: number;
  customData?: Record<string, any>;
}

interface WidgetConfig {
  apiKey: string;
  baseUrl?: string;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  theme?: 'light' | 'dark' | 'auto';
  displayDuration?: number;
  maxNotifications?: number;
  animationStyle?: 'slide' | 'fade' | 'bounce';
  showClose?: boolean;
  enableSounds?: boolean;
  customCss?: string;
}

class SocialProofWidget {
  private config: WidgetConfig;
  private container: HTMLElement | null = null;
  private ws: WebSocket | null = null;
  private notifications: NotificationData[] = [];
  private displayQueue: NotificationData[] = [];
  private isInitialized = false;
  private currentNotification: HTMLElement | null = null;
  private visitorId: string;

  constructor(config: WidgetConfig) {
    this.config = {
      baseUrl: 'https://api.socialproof.com',
      position: 'bottom-left',
      theme: 'auto',
      displayDuration: 5000,
      maxNotifications: 5,
      animationStyle: 'slide',
      showClose: true,
      enableSounds: false,
      ...config,
    };

    this.visitorId = this.generateVisitorId();
    this.init();
  }

  private generateVisitorId(): string {
    let visitorId = localStorage.getItem('sp_visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('sp_visitor_id', visitorId);
    }
    return visitorId;
  }

  private async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load configuration from API
      await this.loadConfig();
      
      // Create widget container
      this.createContainer();
      
      // Apply custom styles
      this.applyStyles();
      
      // Connect to WebSocket for real-time notifications
      this.connectWebSocket();
      
      // Track page view
      this.trackPageView();
      
      this.isInitialized = true;
      console.log('Social Proof Widget initialized');
    } catch (error) {
      console.error('Failed to initialize Social Proof Widget:', error);
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/widget/v1/config/${this.config.apiKey}`);
      if (response.ok) {
        const data = await response.json();
        this.config = { ...this.config, ...data.config };
      }
    } catch (error) {
      console.warn('Failed to load widget configuration:', error);
    }
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'social-proof-widget';
    this.container.className = `sp-widget sp-${this.config.position} sp-theme-${this.config.theme}`;
    
    document.body.appendChild(this.container);
  }

  private applyStyles(): void {
    if (this.config.customCss) {
      const style = document.createElement('style');
      style.textContent = this.config.customCss;
      document.head.appendChild(style);
    }
  }

  private connectWebSocket(): void {
    const wsUrl = this.config.baseUrl?.replace('http', 'ws') + `/ws?apiKey=${this.config.apiKey}&visitorId=${this.visitorId}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.sendVisitorData();
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      setTimeout(() => this.connectWebSocket(), 5000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private sendVisitorData(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'visitor_join',
        data: {
          visitorId: this.visitorId,
          page: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      }));
    }
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'notification':
        this.addNotification(message.data);
        break;
      case 'visitor_count':
        // Handle visitor count updates
        break;
      case 'config_update':
        this.updateConfig(message.data);
        break;
    }
  }

  private addNotification(notification: NotificationData): void {
    this.displayQueue.push(notification);
    this.processQueue();
  }

  private processQueue(): void {
    if (this.currentNotification || this.displayQueue.length === 0) {
      return;
    }

    const notification = this.displayQueue.shift()!;
    this.showNotification(notification);
  }

  private showNotification(notification: NotificationData): void {
    if (!this.container) return;

    const element = this.createNotificationElement(notification);
    this.container.appendChild(element);
    this.currentNotification = element;

    // Animate in
    requestAnimationFrame(() => {
      element.classList.add('sp-show');
    });

    // Auto-hide after duration
    setTimeout(() => {
      this.hideNotification(element);
    }, this.config.displayDuration);

    // Track impression
    this.trackEvent('notification_view', { notificationId: notification.id });
  }

  private createNotificationElement(notification: NotificationData): HTMLElement {
    const element = document.createElement('div');
    element.className = `sp-notification sp-${notification.type} sp-${this.config.animationStyle}`;
    element.dataset.notificationId = notification.id;

    const content = this.createNotificationContent(notification);
    element.innerHTML = content;

    // Add click handler
    element.addEventListener('click', () => {
      this.trackEvent('notification_click', { notificationId: notification.id });
      this.hideNotification(element);
    });

    // Add close button if enabled
    if (this.config.showClose) {
      const closeButton = document.createElement('button');
      closeButton.className = 'sp-close';
      closeButton.innerHTML = '×';
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideNotification(element);
      });
      element.appendChild(closeButton);
    }

    return element;
  }

  private createNotificationContent(notification: NotificationData): string {
    const timeAgo = this.formatTimeAgo(new Date(notification.timestamp));
    
    let content = `<div class="sp-content">`;
    
    if (notification.avatar) {
      content += `<div class="sp-avatar">
        <img src="${notification.avatar}" alt="Avatar" />
      </div>`;
    }

    content += `<div class="sp-message">
      <div class="sp-text">${notification.message}</div>
      <div class="sp-meta">`;

    if (notification.location) {
      content += `<span class="sp-location">${notification.location}</span>`;
    }

    content += `<span class="sp-time">${timeAgo}</span>
      </div>
    </div>`;

    if (notification.rating) {
      content += `<div class="sp-rating">`;
      for (let i = 1; i <= 5; i++) {
        content += `<span class="sp-star ${i <= notification.rating ? 'sp-filled' : ''}">★</span>`;
      }
      content += `</div>`;
    }

    content += `</div>`;
    
    return content;
  }

  private hideNotification(element: HTMLElement): void {
    element.classList.remove('sp-show');
    element.classList.add('sp-hide');

    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      if (this.currentNotification === element) {
        this.currentNotification = null;
        this.processQueue();
      }
    }, 300);
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  private async trackEvent(eventType: string, data: Record<string, any> = {}): Promise<void> {
    try {
      await fetch(`${this.config.baseUrl}/widget/v1/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({
          eventType,
          visitorId: this.visitorId,
          pageUrl: window.location.href,
          timestamp: new Date().toISOString(),
          data,
        }),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  private trackPageView(): void {
    this.trackEvent('page_view', {
      title: document.title,
      referrer: document.referrer,
    });
  }

  private updateConfig(newConfig: Partial<WidgetConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reapply styles if necessary
    if (newConfig.customCss) {
      this.applyStyles();
    }
  }

  // Public methods
  public show(): void {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  public destroy(): void {
    if (this.ws) {
      this.ws.close();
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.isInitialized = false;
  }

  public sendCustomEvent(eventType: string, data: Record<string, any>): void {
    this.trackEvent(eventType, data);
  }
}

// Auto-initialize if config is provided via window object
declare global {
  interface Window {
    socialProofConfig?: WidgetConfig;
    SocialProofWidget: typeof SocialProofWidget;
  }
}

window.SocialProofWidget = SocialProofWidget;

// Auto-initialize
if (typeof window !== 'undefined' && window.socialProofConfig) {
  new SocialProofWidget(window.socialProofConfig);
}

export default SocialProofWidget;