import Queue from "bull";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/services/email";
import { calculateDeliveryTime } from "@/lib/utils";

// Redis connection
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Email processing queue
export const emailQueue = new Queue("email processing", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

// Sequence processing queue
export const sequenceQueue = new Queue("sequence processing", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 5000,
    },
  },
});

// Analytics processing queue
export const analyticsQueue = new Queue("analytics processing", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 10,
    attempts: 2,
  },
});

// Job interfaces
export interface EmailJob {
  emailSendId: string;
  contactId: string;
  templateId: string;
  organizationId: string;
  sequenceId?: string;
  stepId?: string;
  priority?: number;
}

export interface SequenceJob {
  enrollmentId: string;
  contactId: string;
  sequenceId: string;
  currentStepId?: string;
  organizationId: string;
}

export interface AnalyticsJob {
  organizationId: string;
  eventType: string;
  eventData: any;
  timestamp: Date;
}

// Email queue processor
emailQueue.process("send-email", async (job) => {
  const { emailSendId, contactId, templateId, organizationId } = job.data as EmailJob;
  
  try {
    // Get email send record
    const emailSend = await prisma.emailSend.findUnique({
      where: { id: emailSendId },
      include: {
        contact: true,
        template: true,
        organization: true,
      },
    });

    if (!emailSend) {
      throw new Error(`Email send record not found: ${emailSendId}`);
    }

    if (emailSend.status !== "PENDING") {
      console.log(`Email ${emailSendId} already processed (${emailSend.status})`);
      return;
    }

    // Send email using email service
    const result = await emailService.sendEmail({
      to: emailSend.contact.email,
      subject: emailSend.subject,
      html: emailSend.bodyHtml,
      text: emailSend.bodyText || undefined,
      organizationId: emailSend.organizationId,
      contactId: emailSend.contactId,
      templateId: emailSend.templateId,
      emailSendId: emailSend.id,
    });

    // Update email send record
    await prisma.emailSend.update({
      where: { id: emailSendId },
      data: {
        status: "SENT",
        providerId: result.messageId,
        provider: result.provider,
        sentAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create email event
    await prisma.emailEvent.create({
      data: {
        emailId: emailSendId,
        contactId: emailSend.contactId,
        type: "SENT",
        timestamp: new Date(),
        providerId: result.messageId,
        metadata: { provider: result.provider },
      },
    });

    // Update organization email count
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        monthlyEmailsSent: { increment: 1 },
      },
    });

    // Schedule next step in sequence if applicable
    if (emailSend.sequenceId && emailSend.stepId) {
      await scheduleNextSequenceStep(emailSend.contactId, emailSend.sequenceId);
    }

    console.log(`Email sent successfully: ${emailSendId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Failed to send email ${emailSendId}:`, error);
    
    // Update email send record with error
    await prisma.emailSend.update({
      where: { id: emailSendId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        retryCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    throw error;
  }
});

// Sequence queue processor
sequenceQueue.process("process-sequence-step", async (job) => {
  const { enrollmentId, contactId, sequenceId } = job.data as SequenceJob;
  
  try {
    const enrollment = await prisma.sequenceEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        contact: true,
        sequence: {
          include: {
            steps: {
              orderBy: { stepOrder: "asc" },
              include: { template: true },
            },
          },
        },
        currentStep: true,
      },
    });

    if (!enrollment) {
      throw new Error(`Sequence enrollment not found: ${enrollmentId}`);
    }

    if (enrollment.status !== "ACTIVE") {
      console.log(`Enrollment ${enrollmentId} is not active (${enrollment.status})`);
      return;
    }

    // Find next step
    const currentStepOrder = enrollment.currentStep?.stepOrder || -1;
    const nextStep = enrollment.sequence.steps.find(
      (step) => step.stepOrder > currentStepOrder
    );

    if (!nextStep) {
      // Sequence completed
      await prisma.sequenceEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update sequence stats
      await prisma.emailSequence.update({
        where: { id: sequenceId },
        data: {
          completedCount: { increment: 1 },
        },
      });

      console.log(`Sequence enrollment completed: ${enrollmentId}`);
      return { completed: true };
    }

    // Process step based on type
    switch (nextStep.stepType) {
      case "EMAIL":
        if (nextStep.template) {
          // Create email send record
          const emailSend = await prisma.emailSend.create({
            data: {
              organizationId: enrollment.sequence.organizationId,
              contactId: enrollment.contactId,
              templateId: nextStep.templateId!,
              subject: nextStep.template.subject,
              bodyHtml: nextStep.template.bodyHtml,
              bodyText: nextStep.template.bodyText,
              status: "PENDING",
            },
          });

          // Queue email for sending
          await emailQueue.add(
            "send-email",
            {
              emailSendId: emailSend.id,
              contactId: enrollment.contactId,
              templateId: nextStep.templateId!,
              organizationId: enrollment.sequence.organizationId,
              sequenceId: enrollment.sequenceId,
              stepId: nextStep.id,
            } as EmailJob,
            {
              priority: 1,
            }
          );

          // Update step stats
          await prisma.sequenceStep.update({
            where: { id: nextStep.id },
            data: { sentCount: { increment: 1 } },
          });
        }
        break;

      case "DELAY":
        // Delay is handled by scheduling the next step
        break;

      case "CONDITION":
        // Evaluate condition (simplified for now)
        // In a real implementation, you'd evaluate the condition logic
        break;

      case "WEBHOOK":
        // Send webhook (implement webhook service)
        break;
    }

    // Update enrollment to next step
    await prisma.sequenceEnrollment.update({
      where: { id: enrollmentId },
      data: {
        currentStepId: nextStep.id,
        nextSendAt: calculateNextStepTime(nextStep),
        updatedAt: new Date(),
      },
    });

    // Schedule next step if there's a delay
    if (nextStep.delayDays > 0 || nextStep.delayHours > 0) {
      const delay = (nextStep.delayDays * 24 * 60 * 60 * 1000) + (nextStep.delayHours * 60 * 60 * 1000);
      
      await sequenceQueue.add(
        "process-sequence-step",
        {
          enrollmentId,
          contactId,
          sequenceId,
          currentStepId: nextStep.id,
          organizationId: enrollment.sequence.organizationId,
        } as SequenceJob,
        {
          delay,
          priority: 2,
        }
      );
    }

    console.log(`Sequence step processed: ${enrollmentId} -> ${nextStep.id}`);
    return { success: true, nextStepId: nextStep.id };
  } catch (error) {
    console.error(`Failed to process sequence step ${enrollmentId}:`, error);
    throw error;
  }
});

// Analytics queue processor
analyticsQueue.process("update-analytics", async (job) => {
  const { organizationId, eventType, eventData, timestamp } = job.data as AnalyticsJob;
  
  try {
    const date = new Date(timestamp);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const hour = date.getHours();

    // Update or create analytics record
    await prisma.emailAnalytics.upsert({
      where: {
        organizationId_date_hour: {
          organizationId,
          date: dateOnly,
          hour,
        },
      },
      update: {
        ...(eventType === "SENT" && { emailsSent: { increment: 1 } }),
        ...(eventType === "OPENED" && { emailsOpened: { increment: 1 } }),
        ...(eventType === "CLICKED" && { emailsClicked: { increment: 1 } }),
        ...(eventType === "REPLIED" && { emailsReplied: { increment: 1 } }),
        ...(eventType === "BOUNCED" && { emailsBounced: { increment: 1 } }),
        updatedAt: new Date(),
      },
      create: {
        organizationId,
        date: dateOnly,
        hour,
        emailsSent: eventType === "SENT" ? 1 : 0,
        emailsOpened: eventType === "OPENED" ? 1 : 0,
        emailsClicked: eventType === "CLICKED" ? 1 : 0,
        emailsReplied: eventType === "REPLIED" ? 1 : 0,
        emailsBounced: eventType === "BOUNCED" ? 1 : 0,
      },
    });

    // Recalculate rates
    const analytics = await prisma.emailAnalytics.findUnique({
      where: {
        organizationId_date_hour: {
          organizationId,
          date: dateOnly,
          hour,
        },
      },
    });

    if (analytics) {
      const openRate = analytics.emailsSent > 0 ? analytics.emailsOpened / analytics.emailsSent : 0;
      const clickRate = analytics.emailsSent > 0 ? analytics.emailsClicked / analytics.emailsSent : 0;
      const replyRate = analytics.emailsSent > 0 ? analytics.emailsReplied / analytics.emailsSent : 0;
      const bounceRate = analytics.emailsSent > 0 ? analytics.emailsBounced / analytics.emailsSent : 0;

      await prisma.emailAnalytics.update({
        where: { id: analytics.id },
        data: {
          openRate,
          clickRate,
          replyRate,
          bounceRate,
        },
      });
    }

    console.log(`Analytics updated: ${organizationId} - ${eventType}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to update analytics:`, error);
    throw error;
  }
});

// Helper functions
async function scheduleNextSequenceStep(contactId: string, sequenceId: string) {
  const enrollment = await prisma.sequenceEnrollment.findUnique({
    where: {
      contactId_sequenceId: {
        contactId,
        sequenceId,
      },
    },
  });

  if (enrollment && enrollment.status === "ACTIVE") {
    await sequenceQueue.add(
      "process-sequence-step",
      {
        enrollmentId: enrollment.id,
        contactId,
        sequenceId,
        organizationId: enrollment.organizationId,
      } as SequenceJob,
      {
        priority: 2,
      }
    );
  }
}

function calculateNextStepTime(step: any): Date {
  return calculateDeliveryTime(step.delayDays || 0, step.delayHours || 0);
}

// Queue monitoring and error handling
emailQueue.on("completed", (job) => {
  console.log(`Email job completed: ${job.id}`);
});

emailQueue.on("failed", (job, err) => {
  console.error(`Email job failed: ${job.id}`, err);
});

sequenceQueue.on("completed", (job) => {
  console.log(`Sequence job completed: ${job.id}`);
});

sequenceQueue.on("failed", (job, err) => {
  console.error(`Sequence job failed: ${job.id}`, err);
});

// Utility functions for adding jobs
export async function addEmailToQueue(emailData: EmailJob, options?: any) {
  return emailQueue.add("send-email", emailData, {
    priority: emailData.priority || 1,
    ...options,
  });
}

export async function addSequenceToQueue(sequenceData: SequenceJob, options?: any) {
  return sequenceQueue.add("process-sequence-step", sequenceData, {
    priority: 2,
    ...options,
  });
}

export async function addAnalyticsToQueue(analyticsData: AnalyticsJob, options?: any) {
  return analyticsQueue.add("update-analytics", analyticsData, {
    priority: 3,
    ...options,
  });
}

// Queue statistics
export async function getQueueStats() {
  const [emailWaiting, emailActive, emailCompleted, emailFailed] = await Promise.all([
    emailQueue.getWaiting(),
    emailQueue.getActive(),
    emailQueue.getCompleted(),
    emailQueue.getFailed(),
  ]);

  const [sequenceWaiting, sequenceActive, sequenceCompleted, sequenceFailed] = await Promise.all([
    sequenceQueue.getWaiting(),
    sequenceQueue.getActive(),
    sequenceQueue.getCompleted(),
    sequenceQueue.getFailed(),
  ]);

  return {
    email: {
      waiting: emailWaiting.length,
      active: emailActive.length,
      completed: emailCompleted.length,
      failed: emailFailed.length,
    },
    sequence: {
      waiting: sequenceWaiting.length,
      active: sequenceActive.length,
      completed: sequenceCompleted.length,
      failed: sequenceFailed.length,
    },
  };
}