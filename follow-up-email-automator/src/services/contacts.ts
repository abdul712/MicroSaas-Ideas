import { prisma } from "@/lib/prisma";
import { validateEmail, calculateEngagementScore, parseCustomFields } from "@/lib/utils";
import Papa from "papaparse";

export interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  website?: string;
  customFields?: Record<string, any>;
  tags?: string[];
  source?: string;
  notes?: string;
}

export interface ContactFilters {
  search?: string;
  tags?: string[];
  status?: "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED" | "COMPLAINED";
  engagementScore?: { min?: number; max?: number };
  dateRange?: { start: Date; end: Date };
  source?: string;
  hasCustomField?: string;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; email: string; error: string }>;
  duplicates: number;
}

export interface ContactListData {
  name: string;
  description?: string;
  tags?: string[];
  contactIds?: string[];
}

class ContactService {
  async createContact(
    organizationId: string,
    userId: string,
    data: ContactData
  ) {
    // Validate email
    if (!validateEmail(data.email)) {
      throw new Error("Invalid email address");
    }

    // Check if contact already exists
    const existing = await prisma.contact.findUnique({
      where: {
        email_organizationId: {
          email: data.email,
          organizationId,
        },
      },
    });

    if (existing) {
      throw new Error("Contact with this email already exists");
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        jobTitle: data.jobTitle,
        phone: data.phone,
        website: data.website,
        customFields: data.customFields || {},
        tags: data.tags || [],
        source: data.source,
        notes: data.notes,
        organizationId,
        userId,
        status: "ACTIVE",
        engagementScore: 0,
      },
    });

    // Update organization contact count
    await prisma.organization.update({
      where: { id: organizationId },
      data: { contactsCount: { increment: 1 } },
    });

    // Log activity
    await this.logActivity(organizationId, userId, "contact.created", "contact", contact.id, {
      email: contact.email,
      source: data.source,
    });

    return contact;
  }

  async updateContact(
    contactId: string,
    organizationId: string,
    userId: string,
    data: Partial<ContactData>
  ) {
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId,
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    // If email is being updated, validate it
    if (data.email && data.email !== contact.email) {
      if (!validateEmail(data.email)) {
        throw new Error("Invalid email address");
      }

      // Check for duplicate
      const existing = await prisma.contact.findUnique({
        where: {
          email_organizationId: {
            email: data.email,
            organizationId,
          },
        },
      });

      if (existing && existing.id !== contactId) {
        throw new Error("Contact with this email already exists");
      }
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.customFields !== undefined && { customFields: data.customFields }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    // Log activity
    await this.logActivity(organizationId, userId, "contact.updated", "contact", contactId, {
      email: updatedContact.email,
      changes: Object.keys(data),
    });

    return updatedContact;
  }

  async deleteContact(contactId: string, organizationId: string, userId: string) {
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId,
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    // Remove from sequences first
    await prisma.sequenceEnrollment.deleteMany({
      where: { contactId },
    });

    // Delete the contact
    await prisma.contact.delete({
      where: { id: contactId },
    });

    // Update organization contact count
    await prisma.organization.update({
      where: { id: organizationId },
      data: { contactsCount: { decrement: 1 } },
    });

    // Log activity
    await this.logActivity(organizationId, userId, "contact.deleted", "contact", contactId, {
      email: contact.email,
    });

    return true;
  }

  async getContacts(
    organizationId: string,
    filters: ContactFilters = {},
    page = 1,
    limit = 50
  ) {
    const where: any = { organizationId };

    // Apply filters
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: "insensitive" } },
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { company: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.engagementScore) {
      where.engagementScore = {};
      if (filters.engagementScore.min !== undefined) {
        where.engagementScore.gte = filters.engagementScore.min;
      }
      if (filters.engagementScore.max !== undefined) {
        where.engagementScore.lte = filters.engagementScore.max;
      }
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    if (filters.source) {
      where.source = filters.source;
    }

    if (filters.hasCustomField) {
      where.customFields = {
        path: [filters.hasCustomField],
        not: null,
      };
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lists: {
            include: { list: true },
          },
          sequenceEnrollments: {
            include: { sequence: true },
          },
          _count: {
            select: {
              emailSends: true,
              emailEvents: {
                where: { type: "OPENED" },
              },
            },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      contacts: contacts.map(contact => ({
        ...contact,
        customFields: parseCustomFields(contact.customFields),
        emailsSent: contact._count.emailSends,
        emailsOpened: contact._count.emailEvents,
      })),
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async getContactById(contactId: string, organizationId: string) {
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId,
      },
      include: {
        lists: {
          include: { list: true },
        },
        sequenceEnrollments: {
          include: {
            sequence: true,
            currentStep: true,
          },
        },
        emailSends: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            template: true,
            events: true,
          },
        },
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    return {
      ...contact,
      customFields: parseCustomFields(contact.customFields),
    };
  }

  async importContacts(
    organizationId: string,
    userId: string,
    csvData: string,
    options: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
      defaultTags?: string[];
      source?: string;
    } = {}
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
      duplicates: 0,
    };

    // Parse CSV
    const parseResult = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
    });

    if (parseResult.errors.length > 0) {
      throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`);
    }

    const rows = parseResult.data as any[];

    // Validate required column
    if (rows.length > 0 && !rows[0].hasOwnProperty("email")) {
      throw new Error("CSV must contain an 'email' column");
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        if (!row.email || !validateEmail(row.email)) {
          result.errors.push({
            row: i + 1,
            email: row.email || "",
            error: "Invalid email address",
          });
          result.failed++;
          continue;
        }

        // Check if contact exists
        const existing = await prisma.contact.findUnique({
          where: {
            email_organizationId: {
              email: row.email,
              organizationId,
            },
          },
        });

        if (existing) {
          if (options.skipDuplicates) {
            result.duplicates++;
            continue;
          } else if (options.updateExisting) {
            // Update existing contact
            await this.updateContact(existing.id, organizationId, userId, {
              firstName: row.firstname || row.first_name || existing.firstName,
              lastName: row.lastname || row.last_name || existing.lastName,
              company: row.company || existing.company,
              jobTitle: row.jobtitle || row.job_title || existing.jobTitle,
              phone: row.phone || existing.phone,
              website: row.website || existing.website,
              notes: row.notes || existing.notes,
              tags: [...(existing.tags || []), ...(options.defaultTags || [])],
            });
            result.success++;
          } else {
            result.duplicates++;
          }
          continue;
        }

        // Create new contact
        const customFields: Record<string, any> = {};
        const standardFields = ["email", "firstname", "first_name", "lastname", "last_name", 
                               "company", "jobtitle", "job_title", "phone", "website", "notes"];
        
        Object.keys(row).forEach(key => {
          if (!standardFields.includes(key) && row[key]) {
            customFields[key] = row[key];
          }
        });

        await this.createContact(organizationId, userId, {
          email: row.email,
          firstName: row.firstname || row.first_name,
          lastName: row.lastname || row.last_name,
          company: row.company,
          jobTitle: row.jobtitle || row.job_title,
          phone: row.phone,
          website: row.website,
          notes: row.notes,
          customFields,
          tags: options.defaultTags || [],
          source: options.source || "csv_import",
        });

        result.success++;
      } catch (error) {
        result.errors.push({
          row: i + 1,
          email: row.email || "",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        result.failed++;
      }
    }

    // Log bulk operation
    await this.logActivity(organizationId, userId, "contacts.bulk_import", "contact", null, {
      result,
      source: options.source || "csv_import",
    });

    return result;
  }

  async exportContacts(
    organizationId: string,
    filters: ContactFilters = {},
    format: "csv" | "json" = "csv"
  ) {
    const contacts = await this.getContacts(organizationId, filters, 1, 10000);
    
    if (format === "json") {
      return JSON.stringify(contacts.contacts, null, 2);
    }

    // CSV export
    const csvData = contacts.contacts.map(contact => ({
      email: contact.email,
      first_name: contact.firstName || "",
      last_name: contact.lastName || "",
      company: contact.company || "",
      job_title: contact.jobTitle || "",
      phone: contact.phone || "",
      website: contact.website || "",
      tags: contact.tags.join(", "),
      status: contact.status,
      engagement_score: contact.engagementScore,
      created_at: contact.createdAt.toISOString(),
      ...contact.customFields,
    }));

    return Papa.unparse(csvData);
  }

  async updateEngagementScore(contactId: string) {
    // Get contact's email activity
    const events = await prisma.emailEvent.groupBy({
      by: ["type"],
      where: { contactId },
      _count: { id: true },
    });

    const totalEmails = await prisma.emailSend.count({
      where: { contactId },
    });

    const eventCounts = events.reduce((acc, event) => {
      acc[event.type] = event._count.id;
      return acc;
    }, {} as Record<string, number>);

    const opens = eventCounts.OPENED || 0;
    const clicks = eventCounts.CLICKED || 0;
    const replies = eventCounts.REPLIED || 0;

    const engagementScore = calculateEngagementScore(opens, clicks, replies, totalEmails);

    await prisma.contact.update({
      where: { id: contactId },
      data: {
        engagementScore,
        lastEngagedAt: opens > 0 || clicks > 0 || replies > 0 ? new Date() : undefined,
      },
    });

    return engagementScore;
  }

  async bulkUpdateTags(
    organizationId: string,
    userId: string,
    contactIds: string[],
    operation: "add" | "remove" | "replace",
    tags: string[]
  ) {
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        organizationId,
      },
    });

    const updates = contacts.map(contact => {
      let newTags: string[];
      
      switch (operation) {
        case "add":
          newTags = [...new Set([...contact.tags, ...tags])];
          break;
        case "remove":
          newTags = contact.tags.filter(tag => !tags.includes(tag));
          break;
        case "replace":
          newTags = tags;
          break;
      }

      return prisma.contact.update({
        where: { id: contact.id },
        data: { tags: newTags },
      });
    });

    await Promise.all(updates);

    // Log activity
    await this.logActivity(organizationId, userId, "contacts.bulk_tag_update", "contact", null, {
      operation,
      tags,
      contactCount: contacts.length,
    });

    return contacts.length;
  }

  async unsubscribeContact(contactId: string, reason?: string) {
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
        notes: reason ? `Unsubscribed: ${reason}` : undefined,
      },
    });

    // Remove from all active sequences
    await prisma.sequenceEnrollment.updateMany({
      where: {
        contactId,
        status: "ACTIVE",
      },
      data: {
        status: "STOPPED",
        pausedAt: new Date(),
      },
    });

    return contact;
  }

  // Contact Lists
  async createContactList(
    organizationId: string,
    userId: string,
    data: ContactListData
  ) {
    const list = await prisma.contactList.create({
      data: {
        name: data.name,
        description: data.description,
        tags: data.tags || [],
        organizationId,
      },
    });

    // Add contacts to list if provided
    if (data.contactIds && data.contactIds.length > 0) {
      await this.addContactsToList(list.id, data.contactIds);
    }

    // Log activity
    await this.logActivity(organizationId, userId, "contact_list.created", "contact_list", list.id, {
      name: list.name,
      contactCount: data.contactIds?.length || 0,
    });

    return list;
  }

  async addContactsToList(listId: string, contactIds: string[]) {
    const members = contactIds.map(contactId => ({
      listId,
      contactId,
    }));

    await prisma.contactListMember.createMany({
      data: members,
      skipDuplicates: true,
    });

    return members.length;
  }

  async removeContactsFromList(listId: string, contactIds: string[]) {
    await prisma.contactListMember.deleteMany({
      where: {
        listId,
        contactId: { in: contactIds },
      },
    });
  }

  async getContactLists(organizationId: string) {
    return prisma.contactList.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getContactStats(organizationId: string) {
    const [total, active, unsubscribed, bounced] = await Promise.all([
      prisma.contact.count({ where: { organizationId } }),
      prisma.contact.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.contact.count({ where: { organizationId, status: "UNSUBSCRIBED" } }),
      prisma.contact.count({ where: { organizationId, status: "BOUNCED" } }),
    ]);

    const avgEngagement = await prisma.contact.aggregate({
      where: { organizationId, status: "ACTIVE" },
      _avg: { engagementScore: true },
    });

    return {
      total,
      active,
      unsubscribed,
      bounced,
      avgEngagementScore: Math.round(avgEngagement._avg.engagementScore || 0),
    };
  }

  private async logActivity(
    organizationId: string,
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    metadata: any
  ) {
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action,
        entityType,
        entityId,
        metadata,
      },
    });
  }
}

export const contactService = new ContactService();