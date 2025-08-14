import * as tf from '@tensorflow/tfjs'
import { prisma } from '@/lib/prisma'
import { User, Task, TaskPerformance, WorkloadHistory } from '@prisma/client'

interface TaskFeatures {
  complexity: number
  urgency: number
  skillMatch: number
  workload: number
  timeOfDay: number
  cognitiveLoad: number
}

interface AssigneeCandidate {
  userId: string
  matchScore: number
  confidence: number
  reasons: string[]
  risk: number
}

interface ComplexityAnalysis {
  complexity: number
  confidence: number
  factors: {
    textComplexity: number
    skillRequirement: number
    estimatedEffort: number
    dependencies: number
  }
}

interface TaskInsights {
  riskScore: number
  completionProbability: number
  suggestedDeadline: Date
  cognitiveLoadImpact: number
  flowStateOptimal: boolean
  recommendations: string[]
}

export class AITaskService {
  private static model: tf.LayersModel | null = null
  private static readonly SKILL_WEIGHTS = {
    'frontend': ['javascript', 'typescript', 'react', 'vue', 'angular', 'css', 'html'],
    'backend': ['node.js', 'python', 'java', 'go', 'rust', 'api', 'database'],
    'design': ['figma', 'sketch', 'photoshop', 'ui', 'ux', 'design-systems'],
    'data': ['sql', 'python', 'r', 'analytics', 'machine-learning', 'statistics'],
    'devops': ['docker', 'kubernetes', 'aws', 'ci/cd', 'monitoring', 'security'],
    'mobile': ['react-native', 'flutter', 'ios', 'android', 'swift', 'kotlin'],
    'ai': ['machine-learning', 'tensorflow', 'pytorch', 'nlp', 'computer-vision'],
    'marketing': ['seo', 'content', 'social-media', 'analytics', 'campaigns'],
  }

  static async initializeModel(): Promise<void> {
    try {
      // In a real implementation, this would load a pre-trained model
      // For now, we'll create a simple neural network architecture
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [15], units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.1 }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      })

      this.model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      })

      console.log('AI Task Intelligence model initialized')
    } catch (error) {
      console.error('Failed to initialize AI model:', error)
      // Continue without AI model - use heuristics
    }
  }

  static async analyzeComplexity(taskData: {
    title: string
    description: string
    skillsRequired: string[]
  }): Promise<ComplexityAnalysis> {
    try {
      // Text complexity analysis
      const textComplexity = this.calculateTextComplexity(taskData.title + ' ' + taskData.description)
      
      // Skill requirement complexity
      const skillComplexity = this.calculateSkillComplexity(taskData.skillsRequired)
      
      // Combined complexity score
      const complexity = Math.min(1.0, (textComplexity * 0.3 + skillComplexity * 0.7))
      
      return {
        complexity,
        confidence: 0.8, // High confidence in heuristic approach
        factors: {
          textComplexity,
          skillRequirement: skillComplexity,
          estimatedEffort: complexity,
          dependencies: 0.5, // Default - would analyze actual dependencies
        }
      }
    } catch (error) {
      console.error('Error analyzing task complexity:', error)
      return {
        complexity: 0.5,
        confidence: 0.3,
        factors: {
          textComplexity: 0.5,
          skillRequirement: 0.5,
          estimatedEffort: 0.5,
          dependencies: 0.5,
        }
      }
    }
  }

  static async suggestAssignee(params: {
    organizationId: string
    skillsRequired: string[]
    priority: string
    estimatedHours?: number
    dueDate?: Date
  }): Promise<AssigneeCandidate | null> {
    try {
      // Get available team members
      const users = await prisma.user.findMany({
        where: {
          organizationId: params.organizationId,
          status: 'active',
        },
        include: {
          taskPerformance: {
            take: 50,
            orderBy: { createdAt: 'desc' }
          },
          workloadHistory: {
            where: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          },
          tasksAssigned: {
            where: {
              status: { in: ['todo', 'in_progress', 'review'] }
            }
          }
        }
      })

      if (users.length === 0) return null

      // Calculate match scores for each user
      const candidates = await Promise.all(
        users.map(async (user) => {
          const matchScore = await this.calculateUserMatchScore(user, {
            skillsRequired: params.skillsRequired,
            priority: params.priority,
            estimatedHours: params.estimatedHours,
            dueDate: params.dueDate,
          })

          return {
            userId: user.id,
            matchScore: matchScore.overall,
            confidence: matchScore.confidence,
            reasons: matchScore.reasons,
            risk: matchScore.risk,
          }
        })
      )

      // Sort by match score and return best candidate
      candidates.sort((a, b) => b.matchScore - a.matchScore)
      
      return candidates.length > 0 ? candidates[0] : null
    } catch (error) {
      console.error('Error suggesting assignee:', error)
      return null
    }
  }

  static async calculateMatchScore(taskId: string, userId: string): Promise<{
    overall: number
    confidence: number
    skillMatch: number
    availability: number
    performance: number
    riskScore: number
  }> {
    try {
      const [task, user] = await Promise.all([
        prisma.task.findUnique({
          where: { id: taskId },
          include: { project: true, team: true }
        }),
        prisma.user.findUnique({
          where: { id: userId },
          include: {
            taskPerformance: {
              take: 20,
              orderBy: { createdAt: 'desc' }
            },
            tasksAssigned: {
              where: {
                status: { in: ['todo', 'in_progress', 'review'] }
              }
            }
          }
        })
      ])

      if (!task || !user) {
        throw new Error('Task or user not found')
      }

      // Calculate skill match
      const userSkills = (user.skills as string[]) || []
      const requiredSkills = (task.skillsRequired as string[]) || []
      const skillMatch = this.calculateSkillMatchScore(userSkills, requiredSkills)

      // Calculate availability (inverse of current workload)
      const currentWorkload = user.tasksAssigned.length
      const maxCapacity = user.capacityHours / 8 // Assuming 8 hours per task on average
      const availability = Math.max(0, 1 - (currentWorkload / maxCapacity))

      // Calculate historical performance
      const performance = this.calculatePerformanceScore(user.taskPerformance)

      // Calculate cognitive load impact
      const cognitiveLoadScore = 1 - (user.cognitiveLoad || 0.5)

      // Overall score with weights
      const overall = (
        skillMatch * 0.35 +
        availability * 0.25 +
        performance * 0.25 +
        cognitiveLoadScore * 0.15
      )

      // Risk assessment
      const riskScore = this.calculateRiskScore({
        skillMatch,
        availability,
        performance,
        taskComplexity: task.complexity || 0.5,
        urgency: task.priority === 'urgent' ? 1 : task.priority === 'high' ? 0.8 : 0.5
      })

      return {
        overall,
        confidence: 0.8,
        skillMatch,
        availability,
        performance,
        riskScore
      }
    } catch (error) {
      console.error('Error calculating match score:', error)
      return {
        overall: 0.5,
        confidence: 0.3,
        skillMatch: 0.5,
        availability: 0.5,
        performance: 0.5,
        riskScore: 0.7
      }
    }
  }

  static async getTaskInsights(task: Task & { assignee?: User | null }): Promise<TaskInsights> {
    try {
      const now = new Date()
      const dueDate = task.dueDate ? new Date(task.dueDate) : null
      const timeRemaining = dueDate ? (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) : null

      // Risk assessment
      const riskFactors = []
      let riskScore = 0

      // Due date risk
      if (dueDate && timeRemaining !== null) {
        if (timeRemaining < 1) {
          riskScore += 0.4
          riskFactors.push('Task is overdue or due very soon')
        } else if (timeRemaining < 3) {
          riskScore += 0.2
          riskFactors.push('Task has tight deadline')
        }
      }

      // Complexity risk
      if (task.complexity && task.complexity > 0.7) {
        riskScore += 0.3
        riskFactors.push('Task has high complexity')
      }

      // Assignee workload risk
      if (task.assignee) {
        const currentTasks = await prisma.task.count({
          where: {
            assigneeId: task.assignee.id,
            status: { in: ['todo', 'in_progress', 'review'] }
          }
        })

        if (currentTasks > 5) {
          riskScore += 0.2
          riskFactors.push('Assignee has high workload')
        }
      }

      // Completion probability based on historical data
      let completionProbability = 0.8 // Default
      if (task.assignee) {
        const performance = await prisma.taskPerformance.findMany({
          where: { userId: task.assignee.id },
          take: 10,
          orderBy: { createdAt: 'desc' }
        })

        if (performance.length > 0) {
          const completedOnTime = performance.filter(p => p.onTimeCompletion).length
          completionProbability = completedOnTime / performance.length
        }
      }

      // Suggested deadline based on complexity and assignee performance
      const suggestedDeadline = this.calculateOptimalDeadline(task)

      // Cognitive load impact
      const cognitiveLoadImpact = (task.complexity || 0.5) * 0.8 + 
        (task.priority === 'urgent' ? 0.3 : task.priority === 'high' ? 0.2 : 0.1)

      // Flow state optimization
      const flowStateOptimal = this.assessFlowStateOptimality(task)

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        task,
        riskScore,
        completionProbability,
        cognitiveLoadImpact,
        flowStateOptimal
      })

      return {
        riskScore: Math.min(1, riskScore),
        completionProbability,
        suggestedDeadline,
        cognitiveLoadImpact,
        flowStateOptimal,
        recommendations
      }
    } catch (error) {
      console.error('Error generating task insights:', error)
      return {
        riskScore: 0.5,
        completionProbability: 0.8,
        suggestedDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        cognitiveLoadImpact: 0.5,
        flowStateOptimal: false,
        recommendations: ['Enable detailed monitoring for this task']
      }
    }
  }

  // Helper methods
  private static calculateTextComplexity(text: string): number {
    if (!text) return 0.1

    const words = text.split(/\s+/).length
    const sentences = text.split(/[.!?]+/).length
    const avgWordsPerSentence = words / Math.max(sentences, 1)
    
    // Technical keywords that indicate complexity
    const technicalKeywords = [
      'algorithm', 'architecture', 'database', 'optimization', 'integration',
      'scalability', 'performance', 'security', 'api', 'microservice'
    ]
    
    const technicalCount = technicalKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length

    // Normalize to 0-1 scale
    const wordComplexity = Math.min(1, words / 100)
    const sentenceComplexity = Math.min(1, avgWordsPerSentence / 20)
    const technicalComplexity = Math.min(1, technicalCount / 3)

    return (wordComplexity * 0.3 + sentenceComplexity * 0.3 + technicalComplexity * 0.4)
  }

  private static calculateSkillComplexity(skills: string[]): number {
    if (!skills || skills.length === 0) return 0.3

    // Weight skills by their complexity
    const skillComplexityMap: Record<string, number> = {
      'machine-learning': 0.9,
      'ai': 0.9,
      'blockchain': 0.8,
      'kubernetes': 0.8,
      'system-design': 0.8,
      'react': 0.6,
      'python': 0.6,
      'javascript': 0.5,
      'css': 0.3,
      'html': 0.2,
    }

    const avgComplexity = skills.reduce((sum, skill) => {
      return sum + (skillComplexityMap[skill.toLowerCase()] || 0.5)
    }, 0) / skills.length

    // Factor in number of skills required
    const skillCount = skills.length
    const countFactor = Math.min(1, skillCount / 5)

    return Math.min(1, avgComplexity * (0.7 + countFactor * 0.3))
  }

  private static async calculateUserMatchScore(
    user: User & { 
      taskPerformance: TaskPerformance[]
      workloadHistory: WorkloadHistory[]
      tasksAssigned: Task[]
    },
    taskRequirements: {
      skillsRequired: string[]
      priority: string
      estimatedHours?: number
      dueDate?: Date
    }
  ): Promise<{
    overall: number
    confidence: number
    reasons: string[]
    risk: number
  }> {
    const reasons: string[] = []
    
    // Skill matching
    const userSkills = (user.skills as string[]) || []
    const skillMatch = this.calculateSkillMatchScore(userSkills, taskRequirements.skillsRequired)
    
    if (skillMatch > 0.8) {
      reasons.push('Excellent skill match')
    } else if (skillMatch > 0.6) {
      reasons.push('Good skill match')
    } else if (skillMatch < 0.3) {
      reasons.push('Limited skill match')
    }

    // Availability assessment
    const currentLoad = user.tasksAssigned.length
    const capacity = user.capacityHours / 8 // Rough tasks per capacity
    const availability = Math.max(0, 1 - (currentLoad / capacity))

    if (availability > 0.8) {
      reasons.push('High availability')
    } else if (availability < 0.3) {
      reasons.push('Limited availability')
    }

    // Performance history
    const performance = this.calculatePerformanceScore(user.taskPerformance)
    if (performance > 0.8) {
      reasons.push('Strong track record')
    }

    // Cognitive load consideration
    const cognitiveLoad = user.cognitiveLoad || 0.5
    if (cognitiveLoad > 0.8) {
      reasons.push('High cognitive load - may need support')
    }

    const overall = (
      skillMatch * 0.4 +
      availability * 0.3 +
      performance * 0.2 +
      (1 - cognitiveLoad) * 0.1
    )

    const risk = this.calculateRiskScore({
      skillMatch,
      availability,
      performance,
      taskComplexity: 0.5, // Default
      urgency: taskRequirements.priority === 'urgent' ? 1 : 0.5
    })

    return {
      overall,
      confidence: 0.8,
      reasons,
      risk
    }
  }

  private static calculateSkillMatchScore(userSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 0.8 // No specific skills required
    if (userSkills.length === 0) return 0.2 // User has no skills listed

    // Direct matches
    const directMatches = requiredSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    ).length

    // Category matches (frontend, backend, etc.)
    let categoryMatches = 0
    for (const [category, categorySkills] of Object.entries(this.SKILL_WEIGHTS)) {
      const userHasCategory = userSkills.some(skill => categorySkills.includes(skill.toLowerCase()))
      const taskNeedsCategory = requiredSkills.some(skill => categorySkills.includes(skill.toLowerCase()))
      
      if (userHasCategory && taskNeedsCategory) {
        categoryMatches++
      }
    }

    const directScore = directMatches / requiredSkills.length
    const categoryScore = Math.min(1, categoryMatches / 2) * 0.6 // Category matches worth 60% of direct matches

    return Math.min(1, directScore + categoryScore)
  }

  private static calculatePerformanceScore(performances: TaskPerformance[]): number {
    if (performances.length === 0) return 0.7 // Default for new users

    const recentPerformances = performances.slice(0, 10) // Last 10 tasks
    
    // Calculate various performance metrics
    const onTimeRate = recentPerformances.filter(p => p.onTimeCompletion).length / recentPerformances.length
    const avgQuality = recentPerformances.reduce((sum, p) => sum + (p.qualityScore || 4.0), 0) / recentPerformances.length / 5.0
    
    // Time estimation accuracy
    const estimationAccuracy = recentPerformances
      .filter(p => p.actualHours && p.estimatedHours)
      .reduce((sum, p) => {
        const ratio = Math.min(p.actualHours!, p.estimatedHours!) / Math.max(p.actualHours!, p.estimatedHours!)
        return sum + ratio
      }, 0) / Math.max(1, recentPerformances.filter(p => p.actualHours && p.estimatedHours).length)

    return (onTimeRate * 0.4 + avgQuality * 0.4 + estimationAccuracy * 0.2)
  }

  private static calculateRiskScore(factors: {
    skillMatch: number
    availability: number
    performance: number
    taskComplexity: number
    urgency: number
  }): number {
    // Higher risk when factors are suboptimal
    const skillRisk = 1 - factors.skillMatch
    const availabilityRisk = 1 - factors.availability
    const performanceRisk = 1 - factors.performance
    const complexityRisk = factors.taskComplexity
    const urgencyRisk = factors.urgency

    return (
      skillRisk * 0.3 +
      availabilityRisk * 0.2 +
      performanceRisk * 0.2 +
      complexityRisk * 0.15 +
      urgencyRisk * 0.15
    )
  }

  private static calculateOptimalDeadline(task: Task): Date {
    const baseHours = task.estimatedHours || ((task.complexity || 0.5) * 20)
    const complexity = task.complexity || 0.5
    
    // Add buffer based on complexity and priority
    const bufferMultiplier = complexity > 0.7 ? 1.5 : complexity > 0.4 ? 1.2 : 1.1
    const urgencyMultiplier = task.priority === 'urgent' ? 0.8 : task.priority === 'high' ? 0.9 : 1.0
    
    const totalHours = baseHours * bufferMultiplier * urgencyMultiplier
    const days = Math.ceil(totalHours / 8) // 8 working hours per day
    
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  }

  private static assessFlowStateOptimality(task: Task): boolean {
    const complexity = task.complexity || 0.5
    const priority = task.priority
    
    // Flow state is optimal when task complexity matches user skill level
    // and is neither too easy (boring) nor too hard (anxiety-inducing)
    return complexity > 0.3 && complexity < 0.8 && priority !== 'urgent'
  }

  private static generateRecommendations(params: {
    task: Task
    riskScore: number
    completionProbability: number
    cognitiveLoadImpact: number
    flowStateOptimal: boolean
  }): string[] {
    const recommendations: string[] = []
    
    if (params.riskScore > 0.7) {
      recommendations.push('High risk task - consider breaking into smaller subtasks')
      recommendations.push('Schedule regular check-ins to monitor progress')
    }
    
    if (params.completionProbability < 0.6) {
      recommendations.push('Consider reassigning or providing additional support')
    }
    
    if (params.cognitiveLoadImpact > 0.7) {
      recommendations.push('Schedule during peak productivity hours')
      recommendations.push('Minimize interruptions and context switching')
    }
    
    if (!params.flowStateOptimal) {
      recommendations.push('Consider adjusting task complexity or providing learning resources')
    }
    
    if (params.task.priority === 'urgent' && params.task.complexity && params.task.complexity > 0.6) {
      recommendations.push('Urgent complex task - consider delegating to most experienced team member')
    }

    if (recommendations.length === 0) {
      recommendations.push('Task appears well-structured - monitor normal progress')
    }
    
    return recommendations
  }
}

// Initialize the AI model when the service is imported
AITaskService.initializeModel().catch(console.error)