import Bull from 'bull';
import { redis } from '@/lib/redis';

// Queue configurations
const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '1'), // Use different DB for queues
  },
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 25, // Keep last 25 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Cart Recovery Queue - handles abandoned cart processing and recovery campaigns
export const cartRecoveryQueue = new Bull('cart-recovery', queueConfig);

// Email Queue - handles email sending and delivery tracking
export const emailQueue = new Bull('email', queueConfig);

// SMS Queue - handles SMS sending and delivery tracking
export const smsQueue = new Bull('sms', queueConfig);

// Analytics Queue - handles analytics aggregation and reporting
export const analyticsQueue = new Bull('analytics', queueConfig);

// Sync Queue - handles e-commerce platform data synchronization
export const syncQueue = new Bull('sync', queueConfig);

// Job processors
cartRecoveryQueue.process('check-abandonment', async (job) => {
  const { cartId } = job.data;
  const { CartAbandonmentProcessor } = await import('@/workers/cart-abandonment-processor');
  const processor = new CartAbandonmentProcessor();
  return processor.checkAbandonment(cartId);
});

cartRecoveryQueue.process('start-campaign', async (job) => {
  const { cartId, campaignId } = job.data;
  const { CampaignProcessor } = await import('@/workers/campaign-processor');
  const processor = new CampaignProcessor();
  return processor.startCampaign(cartId, campaignId);
});

cartRecoveryQueue.process('send-recovery-message', async (job) => {
  const { messageId, cartId, campaignId, stepIndex } = job.data;
  const { MessageProcessor } = await import('@/workers/message-processor');
  const processor = new MessageProcessor();
  return processor.sendRecoveryMessage(messageId, cartId, campaignId, stepIndex);
});

emailQueue.process('send-email', async (job) => {
  const { to, subject, htmlContent, textContent, metadata } = job.data;
  const { EmailProcessor } = await import('@/workers/email-processor');
  const processor = new EmailProcessor();
  return processor.sendEmail(to, subject, htmlContent, textContent, metadata);
});

emailQueue.process('track-email-event', async (job) => {
  const { messageId, eventType, timestamp, metadata } = job.data;
  const { EmailProcessor } = await import('@/workers/email-processor');
  const processor = new EmailProcessor();
  return processor.trackEmailEvent(messageId, eventType, timestamp, metadata);
});

smsQueue.process('send-sms', async (job) => {
  const { to, message, metadata } = job.data;
  const { SmsProcessor } = await import('@/workers/sms-processor');
  const processor = new SmsProcessor();
  return processor.sendSms(to, message, metadata);
});

analyticsQueue.process('aggregate-daily', async (job) => {
  const { storeId, date } = job.data;
  const { AnalyticsProcessor } = await import('@/workers/analytics-processor');
  const processor = new AnalyticsProcessor();
  return processor.aggregateDailyMetrics(storeId, date);
});

analyticsQueue.process('calculate-recovery-rate', async (job) => {
  const { storeId, campaignId, period } = job.data;
  const { AnalyticsProcessor } = await import('@/workers/analytics-processor');
  const processor = new AnalyticsProcessor();
  return processor.calculateRecoveryRate(storeId, campaignId, period);
});

syncQueue.process('sync-store-data', async (job) => {
  const { storeId, syncType, lastSync } = job.data;
  const { SyncProcessor } = await import('@/workers/sync-processor');
  const processor = new SyncProcessor();
  return processor.syncStoreData(storeId, syncType, lastSync);
});

syncQueue.process('process-webhook', async (job) => {
  const { storeId, platform, payload, signature } = job.data;
  const { WebhookProcessor } = await import('@/workers/webhook-processor');
  const processor = new WebhookProcessor();
  return processor.processWebhook(storeId, platform, payload, signature);
});

// Event handlers for monitoring and logging
const setupQueueEventHandlers = (queue: Bull.Queue, queueName: string) => {
  queue.on('completed', (job, result) => {
    console.log(`${queueName} job ${job.id} completed:`, result);
  });

  queue.on('failed', (job, err) => {
    console.error(`${queueName} job ${job.id} failed:`, err);
  });

  queue.on('stalled', (job) => {
    console.warn(`${queueName} job ${job.id} stalled`);
  });

  queue.on('progress', (job, progress) => {
    console.log(`${queueName} job ${job.id} progress: ${progress}%`);
  });
};

// Setup event handlers for all queues
setupQueueEventHandlers(cartRecoveryQueue, 'cart-recovery');
setupQueueEventHandlers(emailQueue, 'email');
setupQueueEventHandlers(smsQueue, 'sms');
setupQueueEventHandlers(analyticsQueue, 'analytics');
setupQueueEventHandlers(syncQueue, 'sync');

// Queue management utilities
export class QueueManager {
  static async getQueueStats() {
    const queues = [
      { name: 'cart-recovery', queue: cartRecoveryQueue },
      { name: 'email', queue: emailQueue },
      { name: 'sms', queue: smsQueue },
      { name: 'analytics', queue: analyticsQueue },
      { name: 'sync', queue: syncQueue },
    ];

    const stats = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed(),
        ]);

        return {
          name,
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
        };
      })
    );

    return stats;
  }

  static async pauseQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.pause();
      console.log(`Queue ${queueName} paused`);
    }
  }

  static async resumeQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.resume();
      console.log(`Queue ${queueName} resumed`);
    }
  }

  static async cleanQueue(queueName: string, olderThan: number = 24 * 60 * 60 * 1000) {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.clean(olderThan, 'completed');
      await queue.clean(olderThan, 'failed');
      console.log(`Queue ${queueName} cleaned`);
    }
  }

  private static getQueue(queueName: string): Bull.Queue | null {
    switch (queueName) {
      case 'cart-recovery':
        return cartRecoveryQueue;
      case 'email':
        return emailQueue;
      case 'sms':
        return smsQueue;
      case 'analytics':
        return analyticsQueue;
      case 'sync':
        return syncQueue;
      default:
        return null;
    }
  }

  static async gracefulShutdown() {
    console.log('Gracefully shutting down queues...');
    
    const queues = [cartRecoveryQueue, emailQueue, smsQueue, analyticsQueue, syncQueue];
    await Promise.all(queues.map(queue => queue.close()));
    
    console.log('All queues closed');
  }
}

// Schedule recurring jobs
export async function scheduleRecurringJobs() {
  // Daily analytics aggregation
  await analyticsQueue.add(
    'aggregate-daily',
    {},
    {
      repeat: { cron: '0 1 * * *' }, // Run at 1 AM daily
      removeOnComplete: 5,
      removeOnFail: 10,
    }
  );

  // Store data synchronization (every 30 minutes)
  await syncQueue.add(
    'sync-all-stores',
    {},
    {
      repeat: { cron: '*/30 * * * *' },
      removeOnComplete: 5,
      removeOnFail: 10,
    }
  );

  // Queue cleanup (daily)
  await Promise.all([
    cartRecoveryQueue.add('cleanup', {}, {
      repeat: { cron: '0 2 * * *' },
      removeOnComplete: 1,
      removeOnFail: 1,
    }),
  ]);

  console.log('Recurring jobs scheduled');
}

// Health check for all queues
export async function checkQueueHealth(): Promise<boolean> {
  try {
    const stats = await QueueManager.getQueueStats();
    
    // Check if any queue has too many failed jobs
    const hasHealthIssues = stats.some(stat => 
      stat.failed > 100 || // More than 100 failed jobs
      (stat.active === 0 && stat.waiting > 1000) // No active jobs but many waiting
    );

    return !hasHealthIssues;
  } catch (error) {
    console.error('Queue health check failed:', error);
    return false;
  }
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await QueueManager.gracefulShutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await QueueManager.gracefulShutdown();
  process.exit(0);
});