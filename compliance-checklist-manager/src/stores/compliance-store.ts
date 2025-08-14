import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types for the compliance store
interface ComplianceScore {
  id: string;
  overallScore: number;
  regulatoryScore: number;
  processScore: number;
  documentScore: number;
  riskScore: number;
  calculationDate: string;
  recommendations: string[];
}

interface Checklist {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'ARCHIVED';
  dueDate?: string;
  completionRate: number;
  totalItems: number;
  completedItems: number;
  regulation: {
    name: string;
    code: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'OVERDUE' | 'APPROVED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate?: string;
  completedAt?: string;
  assignedTo?: {
    name: string;
    email: string;
  };
  requirement: {
    title: string;
    category: string;
    priority: string;
  };
}

interface RiskAssessment {
  id: string;
  title: string;
  description?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probability: number;
  impact: number;
  riskScore: number;
  status: 'IDENTIFIED' | 'ASSESSING' | 'MITIGATING' | 'MONITORING' | 'RESOLVED';
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'TASK_DUE' | 'TASK_OVERDUE' | 'COMPLIANCE_ALERT' | 'AUDIT_REMINDER' | 'REGULATION_UPDATE' | 'DOCUMENT_EXPIRING' | 'RISK_IDENTIFIED' | 'SYSTEM_NOTIFICATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  readAt?: string;
  createdAt: string;
  actionUrl?: string;
}

interface ComplianceStoreState {
  // Dashboard data
  complianceScore: ComplianceScore | null;
  dashboardStats: {
    totalChecklists: number;
    activeChecklists: number;
    overdueTasks: number;
    completionRate: number;
    riskAlerts: number;
  };
  
  // Checklists
  checklists: Checklist[];
  currentChecklist: Checklist | null;
  checklistItems: ChecklistItem[];
  
  // Risk management
  riskAssessments: RiskAssessment[];
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // UI state
  loading: {
    dashboard: boolean;
    checklists: boolean;
    checklistItems: boolean;
    riskAssessments: boolean;
  };
  
  // Filters
  filters: {
    checklist: {
      status?: string;
      regulationId?: string;
      search?: string;
    };
    tasks: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      search?: string;
    };
    risks: {
      level?: string;
      status?: string;
      search?: string;
    };
  };
}

interface ComplianceStoreActions {
  // Dashboard actions
  setComplianceScore: (score: ComplianceScore) => void;
  setDashboardStats: (stats: Partial<ComplianceStoreState['dashboardStats']>) => void;
  
  // Checklist actions
  setChecklists: (checklists: Checklist[]) => void;
  addChecklist: (checklist: Checklist) => void;
  updateChecklist: (id: string, updates: Partial<Checklist>) => void;
  removeChecklist: (id: string) => void;
  setCurrentChecklist: (checklist: Checklist | null) => void;
  
  // Checklist item actions
  setChecklistItems: (items: ChecklistItem[]) => void;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
  completeChecklistItem: (id: string) => void;
  
  // Risk management actions
  setRiskAssessments: (risks: RiskAssessment[]) => void;
  addRiskAssessment: (risk: RiskAssessment) => void;
  updateRiskAssessment: (id: string, updates: Partial<RiskAssessment>) => void;
  
  // Notification actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  
  // Loading actions
  setLoading: (key: keyof ComplianceStoreState['loading'], value: boolean) => void;
  
  // Filter actions
  setChecklistFilter: (filter: Partial<ComplianceStoreState['filters']['checklist']>) => void;
  setTaskFilter: (filter: Partial<ComplianceStoreState['filters']['tasks']>) => void;
  setRiskFilter: (filter: Partial<ComplianceStoreState['filters']['risks']>) => void;
  clearFilters: () => void;
  
  // Utility actions
  refreshDashboard: () => void;
  reset: () => void;
}

type ComplianceStore = ComplianceStoreState & ComplianceStoreActions;

const initialState: ComplianceStoreState = {
  complianceScore: null,
  dashboardStats: {
    totalChecklists: 0,
    activeChecklists: 0,
    overdueTasks: 0,
    completionRate: 0,
    riskAlerts: 0,
  },
  checklists: [],
  currentChecklist: null,
  checklistItems: [],
  riskAssessments: [],
  notifications: [],
  unreadCount: 0,
  loading: {
    dashboard: false,
    checklists: false,
    checklistItems: false,
    riskAssessments: false,
  },
  filters: {
    checklist: {},
    tasks: {},
    risks: {},
  },
};

export const useComplianceStore = create<ComplianceStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Dashboard actions
        setComplianceScore: (score) => set({ complianceScore: score }),
        
        setDashboardStats: (stats) => 
          set((state) => ({
            dashboardStats: { ...state.dashboardStats, ...stats }
          })),
        
        // Checklist actions
        setChecklists: (checklists) => set({ checklists }),
        
        addChecklist: (checklist) =>
          set((state) => ({
            checklists: [checklist, ...state.checklists],
            dashboardStats: {
              ...state.dashboardStats,
              totalChecklists: state.dashboardStats.totalChecklists + 1,
              activeChecklists: checklist.status === 'ACTIVE' 
                ? state.dashboardStats.activeChecklists + 1 
                : state.dashboardStats.activeChecklists,
            },
          })),
        
        updateChecklist: (id, updates) =>
          set((state) => ({
            checklists: state.checklists.map((checklist) =>
              checklist.id === id ? { ...checklist, ...updates } : checklist
            ),
            currentChecklist: state.currentChecklist?.id === id 
              ? { ...state.currentChecklist, ...updates }
              : state.currentChecklist,
          })),
        
        removeChecklist: (id) =>
          set((state) => ({
            checklists: state.checklists.filter((checklist) => checklist.id !== id),
            currentChecklist: state.currentChecklist?.id === id ? null : state.currentChecklist,
            dashboardStats: {
              ...state.dashboardStats,
              totalChecklists: Math.max(0, state.dashboardStats.totalChecklists - 1),
            },
          })),
        
        setCurrentChecklist: (checklist) => set({ currentChecklist: checklist }),
        
        // Checklist item actions
        setChecklistItems: (items) => set({ checklistItems: items }),
        
        updateChecklistItem: (id, updates) =>
          set((state) => ({
            checklistItems: state.checklistItems.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            ),
          })),
        
        completeChecklistItem: (id) =>
          set((state) => ({
            checklistItems: state.checklistItems.map((item) =>
              item.id === id 
                ? { 
                    ...item, 
                    status: 'COMPLETED' as const,
                    completedAt: new Date().toISOString(),
                  }
                : item
            ),
          })),
        
        // Risk management actions
        setRiskAssessments: (risks) => set({ riskAssessments: risks }),
        
        addRiskAssessment: (risk) =>
          set((state) => ({
            riskAssessments: [risk, ...state.riskAssessments],
            dashboardStats: {
              ...state.dashboardStats,
              riskAlerts: ['HIGH', 'CRITICAL'].includes(risk.riskLevel)
                ? state.dashboardStats.riskAlerts + 1
                : state.dashboardStats.riskAlerts,
            },
          })),
        
        updateRiskAssessment: (id, updates) =>
          set((state) => ({
            riskAssessments: state.riskAssessments.map((risk) =>
              risk.id === id ? { ...risk, ...updates } : risk
            ),
          })),
        
        // Notification actions
        setNotifications: (notifications) => 
          set((state) => ({
            notifications,
            unreadCount: notifications.filter(n => !n.readAt).length,
          })),
        
        addNotification: (notification) =>
          set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: !notification.readAt ? state.unreadCount + 1 : state.unreadCount,
          })),
        
        markNotificationAsRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((notification) =>
              notification.id === id && !notification.readAt
                ? { ...notification, readAt: new Date().toISOString() }
                : notification
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          })),
        
        markAllNotificationsAsRead: () =>
          set((state) => ({
            notifications: state.notifications.map((notification) => ({
              ...notification,
              readAt: notification.readAt || new Date().toISOString(),
            })),
            unreadCount: 0,
          })),
        
        removeNotification: (id) =>
          set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            return {
              notifications: state.notifications.filter((n) => n.id !== id),
              unreadCount: notification && !notification.readAt 
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
            };
          }),
        
        // Loading actions
        setLoading: (key, value) =>
          set((state) => ({
            loading: { ...state.loading, [key]: value },
          })),
        
        // Filter actions
        setChecklistFilter: (filter) =>
          set((state) => ({
            filters: {
              ...state.filters,
              checklist: { ...state.filters.checklist, ...filter },
            },
          })),
        
        setTaskFilter: (filter) =>
          set((state) => ({
            filters: {
              ...state.filters,
              tasks: { ...state.filters.tasks, ...filter },
            },
          })),
        
        setRiskFilter: (filter) =>
          set((state) => ({
            filters: {
              ...state.filters,
              risks: { ...state.filters.risks, ...filter },
            },
          })),
        
        clearFilters: () =>
          set((state) => ({
            filters: {
              checklist: {},
              tasks: {},
              risks: {},
            },
          })),
        
        // Utility actions
        refreshDashboard: async () => {
          // This would typically make API calls to refresh dashboard data
          // For now, we'll just trigger a loading state
          set((state) => ({
            loading: { ...state.loading, dashboard: true },
          }));
          
          // Simulate API call
          setTimeout(() => {
            set((state) => ({
              loading: { ...state.loading, dashboard: false },
            }));
          }, 1000);
        },
        
        reset: () => set(initialState),
      }),
      {
        name: 'compliance-store',
        // Only persist certain parts of the state
        partialize: (state) => ({
          filters: state.filters,
          // Don't persist sensitive data or loading states
        }),
      }
    ),
    {
      name: 'compliance-store',
    }
  )
);

// Selectors for computed values
export const useComplianceSelectors = () => {
  const store = useComplianceStore();
  
  return {
    // Computed dashboard metrics
    overallComplianceHealth: () => {
      const { complianceScore } = store;
      if (!complianceScore) return 'unknown';
      
      if (complianceScore.overallScore >= 90) return 'excellent';
      if (complianceScore.overallScore >= 75) return 'good';
      if (complianceScore.overallScore >= 60) return 'warning';
      if (complianceScore.overallScore >= 40) return 'poor';
      return 'critical';
    },
    
    // Filtered checklists
    filteredChecklists: () => {
      const { checklists, filters } = store;
      const filter = filters.checklist;
      
      return checklists.filter((checklist) => {
        if (filter.status && checklist.status !== filter.status) return false;
        if (filter.regulationId && checklist.regulation.code !== filter.regulationId) return false;
        if (filter.search) {
          const searchTerm = filter.search.toLowerCase();
          return (
            checklist.title.toLowerCase().includes(searchTerm) ||
            checklist.regulation.name.toLowerCase().includes(searchTerm) ||
            checklist.regulation.code.toLowerCase().includes(searchTerm)
          );
        }
        return true;
      });
    },
    
    // Filtered tasks
    filteredTasks: () => {
      const { checklistItems, filters } = store;
      const filter = filters.tasks;
      
      return checklistItems.filter((item) => {
        if (filter.status && item.status !== filter.status) return false;
        if (filter.priority && item.priority !== filter.priority) return false;
        if (filter.assignedTo && item.assignedTo?.email !== filter.assignedTo) return false;
        if (filter.search) {
          const searchTerm = filter.search.toLowerCase();
          return (
            item.title.toLowerCase().includes(searchTerm) ||
            item.requirement.title.toLowerCase().includes(searchTerm) ||
            item.requirement.category.toLowerCase().includes(searchTerm)
          );
        }
        return true;
      });
    },
    
    // Filtered risks
    filteredRisks: () => {
      const { riskAssessments, filters } = store;
      const filter = filters.risks;
      
      return riskAssessments.filter((risk) => {
        if (filter.level && risk.riskLevel !== filter.level) return false;
        if (filter.status && risk.status !== filter.status) return false;
        if (filter.search) {
          const searchTerm = filter.search.toLowerCase();
          return (
            risk.title.toLowerCase().includes(searchTerm) ||
            (risk.description && risk.description.toLowerCase().includes(searchTerm))
          );
        }
        return true;
      });
    },
    
    // Urgent notifications
    urgentNotifications: () => {
      const { notifications } = store;
      return notifications.filter(
        (notification) => 
          !notification.readAt && 
          ['HIGH', 'URGENT'].includes(notification.priority)
      );
    },
  };
};