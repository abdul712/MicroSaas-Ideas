import * as tf from '@tensorflow/tfjs'
import { TaskIntelligence, AIDelegationSuggestion, WorkloadAnalysis, CognitiveLoadMetrics } from '@/types'
import { prisma } from '@/lib/prisma'

/**
 * AI-powered Task Intelligence Engine
 * Handles task complexity analysis, assignment optimization, and workload balancing
 */
export class TaskIntelligenceEngine {
  private static instance: TaskIntelligenceEngine
  private models: Map<string, tf.LayersModel> = new Map()
  private isInitialized = false

  private constructor() {}

  public static getInstance(): TaskIntelligenceEngine {
    if (!TaskIntelligenceEngine.instance) {
      TaskIntelligenceEngine.instance = new TaskIntelligenceEngine()
    }
    return TaskIntelligenceEngine.instance
  }

  /**
   * Initialize the AI models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize TensorFlow.js backend
      await tf.ready()

      // Load or create models
      await this.loadOrCreateModels()
      
      this.isInitialized = true
      console.log('Task Intelligence Engine initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Task Intelligence Engine:', error)
      throw error
    }
  }

  /**
   * Load pre-trained models or create new ones
   */
  private async loadOrCreateModels(): Promise<void> {
    // Task Complexity Prediction Model
    const complexityModel = await this.createComplexityModel()
    this.models.set('complexity', complexityModel)

    // Task Duration Prediction Model
    const durationModel = await this.createDurationModel()
    this.models.set('duration', durationModel)

    // Task Assignment Optimization Model
    const assignmentModel = await this.createAssignmentModel()
    this.models.set('assignment', assignmentModel)

    // Workload Prediction Model
    const workloadModel = await this.createWorkloadModel()
    this.models.set('workload', workloadModel)
  }

  /**
   * Create task complexity prediction model
   */
  private async createComplexityModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.1 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }) // Complexity score 0-1
      ]
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    })

    return model
  }

  /**
   * Create task duration prediction model
   */
  private async createDurationModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [25], units: 128, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' }) // Duration in hours
      ]
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanAbsoluteError',
      metrics: ['mse']
    })

    return model
  }

  /**
   * Create task assignment optimization model
   */
  private async createAssignmentModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [30], units: 256, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.1 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }) // Assignment score 0-1
      ]
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    })

    return model
  }

  /**
   * Create workload prediction model
   */
  private async createWorkloadModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [15], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }) // Workload percentage 0-1
      ]
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    })

    return model
  }

  /**
   * Extract features from task for AI processing
   */
  private extractTaskFeatures(task: any, assignee?: any): number[] {
    const features: number[] = []

    // Task features
    features.push(
      task.title?.length || 0,
      task.description?.length || 0,
      task.priority === 'CRITICAL' ? 1 : task.priority === 'HIGH' ? 0.75 : task.priority === 'MEDIUM' ? 0.5 : 0.25,
      task.skillRequirements?.length || 0,
      task.dependencies?.length || 0,
      task.storyPoints || 1,
      task.reworkCount || 0
    )

    // Assignee features (if provided)
    if (assignee) {
      features.push(
        assignee.productivityScore || 0,
        assignee.workloadCapacity || 1,
        assignee.averageTaskTime || 0,
        assignee.completionRate || 0,
        assignee.qualityScore || 0,
        assignee.collaborationScore || 0,
        assignee.skills?.length || 0
      )
    } else {
      // Fill with zeros if no assignee
      features.push(...Array(7).fill(0))
    }

    // Time features
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()
    
    features.push(
      hour / 24, // Normalized hour
      dayOfWeek / 7, // Normalized day of week
      task.dueDate ? Math.max(0, (new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 7, // Days until due
      task.createdAt ? (now.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60) : 0, // Hours since creation
    )

    // Organizational features
    features.push(
      Math.random(), // Team load (placeholder - should be calculated)
      Math.random()  // Overall org load (placeholder - should be calculated)
    )

    return features
  }

  /**
   * Predict task complexity
   */
  async predictTaskComplexity(task: any): Promise<{ score: number; confidence: number }> {
    if (!this.isInitialized) await this.initialize()

    const model = this.models.get('complexity')
    if (!model) throw new Error('Complexity model not loaded')

    const features = this.extractTaskFeatures(task)
    const tensor = tf.tensor2d([features.slice(0, 20)])
    
    const prediction = model.predict(tensor) as tf.Tensor
    const score = (await prediction.data())[0]
    
    tensor.dispose()
    prediction.dispose()

    // Calculate confidence based on feature quality
    const confidence = this.calculateConfidence(features, 'complexity')

    return { score, confidence }
  }

  /**
   * Predict task duration
   */
  async predictTaskDuration(task: any, assignee?: any): Promise<{ duration: number; confidence: number }> {
    if (!this.isInitialized) await this.initialize()

    const model = this.models.get('duration')
    if (!model) throw new Error('Duration model not loaded')

    const features = this.extractTaskFeatures(task, assignee)
    const tensor = tf.tensor2d([features.slice(0, 25)])
    
    const prediction = model.predict(tensor) as tf.Tensor
    const duration = Math.max(0.5, (await prediction.data())[0]) // Minimum 30 minutes
    
    tensor.dispose()
    prediction.dispose()

    const confidence = this.calculateConfidence(features, 'duration')

    return { duration: duration * 60, confidence } // Return in minutes
  }

  /**
   * Get AI-powered task assignment suggestions
   */
  async getAssignmentSuggestions(
    task: any,
    candidateUsers: any[],
    organizationId: string
  ): Promise<AIDelegationSuggestion> {
    if (!this.isInitialized) await this.initialize()

    const model = this.models.get('assignment')
    if (!model) throw new Error('Assignment model not loaded')

    const suggestions = []

    for (const user of candidateUsers) {
      const features = this.extractTaskFeatures(task, user)
      const skillMatch = this.calculateSkillMatch(task.skillRequirements || [], user.skills || [])
      const workloadFactor = await this.calculateWorkloadFactor(user.id, organizationId)
      
      // Add additional features
      features.push(skillMatch, workloadFactor, user.cognitiveLoadThreshold || 0.8)

      const tensor = tf.tensor2d([features.slice(0, 30)])
      const prediction = model.predict(tensor) as tf.Tensor
      const score = (await prediction.data())[0]
      
      tensor.dispose()
      prediction.dispose()

      const reasoning = this.generateAssignmentReasoning(score, skillMatch, workloadFactor, user)

      suggestions.push({
        userId: user.id,
        score,
        reasoning
      })
    }

    // Sort by score and get the best suggestion
    suggestions.sort((a, b) => b.score - a.score)
    const bestSuggestion = suggestions[0]

    const confidence = bestSuggestion ? bestSuggestion.score : 0

    return {
      taskId: task.id,
      suggestedAssignee: bestSuggestion?.userId || '',
      confidence,
      reasoning: bestSuggestion?.reasoning || ['No suitable assignee found'],
      alternativeAssignees: suggestions.slice(1, 4) // Top 3 alternatives
    }
  }

  /**
   * Analyze user workload and predict burnout risk
   */
  async analyzeWorkload(userId: string, organizationId: string): Promise<WorkloadAnalysis> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTasks: {
          where: {
            status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
            organizationId
          }
        }
      }
    })

    if (!user) throw new Error('User not found')

    const currentTasks = user.assignedTasks
    const totalEstimatedHours = currentTasks.reduce((sum, task) => {
      return sum + (task.estimatedDuration || 0) / 60 // Convert minutes to hours
    }, 0)

    const capacity = user.workloadCapacity * 40 // Assuming 40 hours per week
    const utilization = totalEstimatedHours / capacity

    // Predict burnout risk using workload model
    const burnoutRisk = await this.predictBurnoutRisk(user, currentTasks)

    const recommendedActions = this.generateWorkloadRecommendations(utilization, burnoutRisk)

    return {
      userId,
      currentLoad: totalEstimatedHours,
      capacity,
      utilization,
      burnoutRisk,
      recommendedActions
    }
  }

  /**
   * Calculate cognitive load metrics
   */
  async calculateCognitiveLoad(userId: string, organizationId: string): Promise<CognitiveLoadMetrics> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTasks: {
          where: {
            status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
            organizationId
          },
          include: {
            updates: {
              where: {
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
              }
            }
          }
        }
      }
    })

    if (!user) throw new Error('User not found')

    const factors = []
    let totalLoad = 0

    // Task switching factor
    const taskCount = user.assignedTasks.length
    const switchingPenalty = Math.min(taskCount * 0.1, 0.5)
    factors.push({
      type: 'task_switching',
      impact: switchingPenalty,
      description: `Managing ${taskCount} concurrent tasks`
    })
    totalLoad += switchingPenalty

    // Complexity factor
    const avgComplexity = user.assignedTasks.reduce((sum, task) => {
      return sum + (task.complexityScore || 0.5)
    }, 0) / Math.max(taskCount, 1)
    factors.push({
      type: 'task_complexity',
      impact: avgComplexity * 0.3,
      description: `Average task complexity: ${(avgComplexity * 100).toFixed(0)}%`
    })
    totalLoad += avgComplexity * 0.3

    // Interruption factor
    const totalUpdates = user.assignedTasks.reduce((sum, task) => {
      return sum + task.updates.length
    }, 0)
    const interruptionFactor = Math.min(totalUpdates * 0.05, 0.3)
    factors.push({
      type: 'interruptions',
      impact: interruptionFactor,
      description: `${totalUpdates} interruptions in last 24 hours`
    })
    totalLoad += interruptionFactor

    const recommendations = this.generateCognitiveLoadRecommendations(totalLoad, factors)

    return {
      userId,
      currentLoad: totalLoad,
      threshold: user.cognitiveLoadThreshold,
      factors,
      recommendations
    }
  }

  /**
   * Calculate skill match between task requirements and user skills
   */
  private calculateSkillMatch(taskSkills: string[], userSkills: string[]): number {
    if (taskSkills.length === 0) return 1 // No specific skills required

    const matches = taskSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    ).length

    return matches / taskSkills.length
  }

  /**
   * Calculate workload factor for assignment scoring
   */
  private async calculateWorkloadFactor(userId: string, organizationId: string): Promise<number> {
    const activeTasks = await prisma.task.count({
      where: {
        assigneeId: userId,
        organizationId,
        status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] }
      }
    })

    // Normalize to 0-1 scale, where 0.8 represents optimal load
    return Math.max(0, 1 - (activeTasks / 10))
  }

  /**
   * Predict burnout risk using workload model
   */
  private async predictBurnoutRisk(user: any, tasks: any[]): Promise<number> {
    const model = this.models.get('workload')
    if (!model) return 0

    const features = [
      tasks.length / 10, // Normalized task count
      user.productivityScore || 0,
      user.workloadCapacity || 1,
      user.averageTaskTime || 0,
      user.completionRate || 0,
      tasks.filter(t => t.priority === 'CRITICAL').length / Math.max(tasks.length, 1),
      tasks.filter(t => t.status === 'BLOCKED').length / Math.max(tasks.length, 1),
      user.cognitiveLoadThreshold || 0.8,
      ...Array(7).fill(Math.random()) // Placeholder features
    ]

    const tensor = tf.tensor2d([features])
    const prediction = model.predict(tensor) as tf.Tensor
    const risk = (await prediction.data())[0]
    
    tensor.dispose()
    prediction.dispose()

    return risk
  }

  /**
   * Calculate confidence score based on feature quality
   */
  private calculateConfidence(features: number[], modelType: string): number {
    // Base confidence
    let confidence = 0.7

    // Adjust based on feature completeness
    const nonZeroFeatures = features.filter(f => f !== 0).length
    const completeness = nonZeroFeatures / features.length
    confidence *= completeness

    // Model-specific adjustments
    switch (modelType) {
      case 'complexity':
        confidence *= features[0] > 0 && features[1] > 0 ? 1.1 : 0.8 // Title and description
        break
      case 'duration':
        confidence *= features[7] > 0 ? 1.1 : 0.9 // Assignee productivity score
        break
    }

    return Math.min(Math.max(confidence, 0.1), 0.95)
  }

  /**
   * Generate assignment reasoning
   */
  private generateAssignmentReasoning(
    score: number,
    skillMatch: number,
    workloadFactor: number,
    user: any
  ): string[] {
    const reasoning = []

    if (skillMatch > 0.8) {
      reasoning.push('Strong skill match for task requirements')
    } else if (skillMatch > 0.5) {
      reasoning.push('Good skill match for task requirements')
    } else {
      reasoning.push('Limited skill match - consider for learning opportunity')
    }

    if (workloadFactor > 0.7) {
      reasoning.push('Low current workload, available for assignment')
    } else if (workloadFactor > 0.4) {
      reasoning.push('Moderate workload, manageable assignment')
    } else {
      reasoning.push('High current workload, may need priority adjustment')
    }

    if (user.productivityScore > 0.8) {
      reasoning.push('High productivity track record')
    } else if (user.productivityScore > 0.6) {
      reasoning.push('Good productivity performance')
    }

    if (score > 0.8) {
      reasoning.push('Highly recommended assignment')
    } else if (score > 0.6) {
      reasoning.push('Good assignment candidate')
    } else {
      reasoning.push('Consider alternative assignees')
    }

    return reasoning
  }

  /**
   * Generate workload recommendations
   */
  private generateWorkloadRecommendations(utilization: number, burnoutRisk: number): string[] {
    const recommendations = []

    if (utilization > 0.9) {
      recommendations.push('Consider redistributing tasks to prevent overload')
      recommendations.push('Schedule buffer time for unexpected tasks')
    } else if (utilization < 0.5) {
      recommendations.push('Capacity available for additional tasks')
      recommendations.push('Consider taking on stretch assignments')
    }

    if (burnoutRisk > 0.7) {
      recommendations.push('High burnout risk detected - immediate attention needed')
      recommendations.push('Consider reducing task complexity or extending deadlines')
      recommendations.push('Schedule regular check-ins and support')
    } else if (burnoutRisk > 0.5) {
      recommendations.push('Monitor workload closely to prevent burnout')
      recommendations.push('Ensure adequate breaks and recovery time')
    }

    return recommendations
  }

  /**
   * Generate cognitive load recommendations
   */
  private generateCognitiveLoadRecommendations(load: number, factors: any[]): string[] {
    const recommendations = []

    if (load > 0.8) {
      recommendations.push('Critical cognitive load - immediate intervention needed')
      recommendations.push('Block time for focused work without interruptions')
      recommendations.push('Consider delegating or postponing non-critical tasks')
    } else if (load > 0.6) {
      recommendations.push('High cognitive load - monitor closely')
      recommendations.push('Minimize task switching where possible')
    }

    const highestFactor = factors.reduce((prev, current) => 
      prev.impact > current.impact ? prev : current
    )

    switch (highestFactor.type) {
      case 'task_switching':
        recommendations.push('Try to group similar tasks together')
        recommendations.push('Use time-blocking to reduce context switching')
        break
      case 'task_complexity':
        recommendations.push('Break complex tasks into smaller components')
        recommendations.push('Schedule complex work during peak energy hours')
        break
      case 'interruptions':
        recommendations.push('Set designated focus time with no interruptions')
        recommendations.push('Use communication tools to batch non-urgent requests')
        break
    }

    return recommendations
  }

  /**
   * Analyze complete task intelligence
   */
  async analyzeTask(task: any, candidateAssignees?: any[]): Promise<TaskIntelligence> {
    const [complexity, duration] = await Promise.all([
      this.predictTaskComplexity(task),
      this.predictTaskDuration(task)
    ])

    // Calculate predicted completion date
    const predictedCompletion = new Date()
    predictedCompletion.setTime(predictedCompletion.getTime() + duration.duration * 60 * 1000)

    // Extract skill requirements and dependencies from task
    const skillRequirements = task.skillRequirements || []
    const dependencies = task.dependencies || []
    
    // Identify risk factors
    const riskFactors = []
    if (complexity.score > 0.8) riskFactors.push('High complexity task')
    if (duration.duration > 8 * 60) riskFactors.push('Long duration task')
    if (dependencies.length > 0) riskFactors.push('Has dependencies')
    if (task.priority === 'CRITICAL') riskFactors.push('Critical priority')

    return {
      complexityScore: complexity.score,
      estimatedDuration: duration.duration,
      predictedCompletion,
      confidence: (complexity.confidence + duration.confidence) / 2,
      skillRequirements,
      dependencies,
      riskFactors
    }
  }

  /**
   * Dispose of all models and clean up resources
   */
  dispose(): void {
    this.models.forEach(model => model.dispose())
    this.models.clear()
    this.isInitialized = false
  }
}

// Export singleton instance
export const taskIntelligence = TaskIntelligenceEngine.getInstance()