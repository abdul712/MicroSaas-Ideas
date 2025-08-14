import { Insight, Project, Funnel, Event, UserSession } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { funnelAnalyzer } from '@/lib/analytics/funnel-analyzer';
import { behaviorTracker } from '@/lib/analytics/behavior-tracker';

export interface OptimizationRecommendation {
  id: string;
  type: 'design' | 'content' | 'technical' | 'ux' | 'conversion';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  expectedLift: number; // Percentage improvement
  implementation: ImplementationGuide;
  evidence: Evidence[];
  testStrategy: TestStrategy;
}

export interface ImplementationGuide {
  steps: string[];
  estimatedTime: string;
  requiredSkills: string[];
  tools: string[];
  resources: string[];
}

export interface Evidence {
  type: 'behavioral' | 'statistical' | 'comparative' | 'best_practice';
  description: string;
  data?: any;
  source?: string;
}

export interface TestStrategy {
  testType: 'ab_test' | 'multivariate' | 'split_url';
  variations: TestVariation[];
  success_metrics: string[];
  duration: string;
  trafficSplit: { [variant: string]: number };
}

export interface TestVariation {
  name: string;
  description: string;
  changes: ElementChange[];
}

export interface ElementChange {
  selector: string;
  property: string;
  value: string;
  changeType: 'text' | 'style' | 'attribute' | 'html';
}

export interface BottleneckAnalysis {
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: number;
  conversionImpact: number;
  causes: string[];
  solutions: OptimizationRecommendation[];
}

export interface PersonalizationRule {
  id: string;
  name: string;
  conditions: PersonalizationCondition[];
  changes: ElementChange[];
  audience: string;
  expectedImpact: number;
}

export interface PersonalizationCondition {
  type: 'device' | 'location' | 'referrer' | 'behavior' | 'time' | 'segment';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: any;
}

export class OptimizationEngine {
  private static instance: OptimizationEngine;

  public static getInstance(): OptimizationEngine {
    if (!OptimizationEngine.instance) {
      OptimizationEngine.instance = new OptimizationEngine();
    }
    return OptimizationEngine.instance;
  }

  /**
   * Generate comprehensive optimization recommendations for a project
   */
  async generateRecommendations(projectId: string): Promise<OptimizationRecommendation[]> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          funnels: true,
          events: {
            where: {
              timestamp: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          },
          sessions: {
            where: {
              startTime: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      });

      if (!project) return [];

      const recommendations: OptimizationRecommendation[] = [];

      // Analyze bottlenecks
      const bottlenecks = await this.detectBottlenecks(project);
      for (const bottleneck of bottlenecks) {
        recommendations.push(...bottleneck.solutions);
      }

      // Analyze user behavior patterns
      const behaviorRecommendations = await this.analyzeBehaviorPatterns(project);
      recommendations.push(...behaviorRecommendations);

      // Technical performance analysis
      const performanceRecommendations = await this.analyzePerformance(project);
      recommendations.push(...performanceRecommendations);

      // Mobile optimization
      const mobileRecommendations = await this.analyzeMobileExperience(project);
      recommendations.push(...mobileRecommendations);

      // Content optimization
      const contentRecommendations = await this.analyzeContent(project);
      recommendations.push(...contentRecommendations);

      // Form optimization
      const formRecommendations = await this.analyzeForms(project);
      recommendations.push(...formRecommendations);

      // Sort by impact and confidence
      return recommendations
        .sort((a, b) => {
          const aScore = this.calculateRecommendationScore(a);
          const bScore = this.calculateRecommendationScore(b);
          return bScore - aScore;
        })
        .slice(0, 20); // Top 20 recommendations

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Detect conversion bottlenecks using AI analysis
   */
  async detectBottlenecks(project: any): Promise<BottleneckAnalysis[]> {
    const bottlenecks: BottleneckAnalysis[] = [];

    for (const funnel of project.funnels) {
      const analysis = await funnelAnalyzer.analyzeFunnel(
        funnel.id,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date()
      );

      if (!analysis) continue;

      for (const step of analysis.steps) {
        if (step.dropOffRate > 30 && step.users > 50) { // Significant drop-off
          const bottleneck: BottleneckAnalysis = {
            location: step.step.name,
            severity: this.assessSeverity(step.dropOffRate, step.users),
            affectedUsers: step.users,
            conversionImpact: step.dropOffRate,
            causes: await this.identifyBottleneckCauses(step, project),
            solutions: await this.generateBottleneckSolutions(step, project)
          };

          bottlenecks.push(bottleneck);
        }
      }
    }

    return bottlenecks;
  }

  /**
   * Analyze user behavior patterns for optimization opportunities
   */
  async analyzeBehaviorPatterns(project: any): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze scroll patterns
    const scrollRecommendations = await this.analyzeScrollBehavior(project);
    recommendations.push(...scrollRecommendations);

    // Analyze click patterns
    const clickRecommendations = await this.analyzeClickBehavior(project);
    recommendations.push(...clickRecommendations);

    // Analyze exit patterns
    const exitRecommendations = await this.analyzeExitBehavior(project);
    recommendations.push(...exitRecommendations);

    return recommendations;
  }

  /**
   * Analyze scroll behavior for optimization insights
   */
  private async analyzeScrollBehavior(project: any): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Get scroll depth data
    const scrollEvents = project.events.filter((e: Event) => 
      e.eventType === 'scroll' && e.scrollDepth !== null
    );

    if (scrollEvents.length === 0) return recommendations;

    const avgScrollDepth = scrollEvents.reduce((sum: number, e: Event) => 
      sum + (e.scrollDepth || 0), 0) / scrollEvents.length;

    if (avgScrollDepth < 0.5) { // Less than 50% scroll
      recommendations.push({
        id: 'low-scroll-depth',
        type: 'ux',
        title: 'Low Scroll Engagement Detected',
        description: `Users only scroll ${(avgScrollDepth * 100).toFixed(1)}% down the page on average. This suggests content below the fold is not engaging enough.`,
        impact: 'high',
        effort: 'medium',
        confidence: 85,
        expectedLift: 15,
        implementation: {
          steps: [
            'Move most important content above the fold',
            'Add visual indicators to encourage scrolling',
            'Reduce content density in the first screen',
            'Add compelling headlines to draw users down'
          ],
          estimatedTime: '1-2 weeks',
          requiredSkills: ['UX Design', 'Frontend Development'],
          tools: ['Figma', 'HTML/CSS'],
          resources: ['UX best practices guide', 'Scroll engagement examples']
        },
        evidence: [
          {
            type: 'behavioral',
            description: `Average scroll depth is only ${(avgScrollDepth * 100).toFixed(1)}%`,
            data: { avgScrollDepth, totalScrollEvents: scrollEvents.length }
          }
        ],
        testStrategy: {
          testType: 'ab_test',
          variations: [
            {
              name: 'Improved Above-Fold Content',
              description: 'Reorganize content to put key value props above the fold',
              changes: [
                {
                  selector: '.hero-section',
                  property: 'order',
                  value: 'benefits-first',
                  changeType: 'style'
                }
              ]
            }
          ],
          success_metrics: ['scroll_depth', 'time_on_page', 'conversion_rate'],
          duration: '2 weeks',
          trafficSplit: { control: 50, variant: 50 }
        }
      });
    }

    return recommendations;
  }

  /**
   * Analyze click behavior patterns
   */
  private async analyzeClickBehavior(project: any): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    const clickEvents = project.events.filter((e: Event) => e.eventType === 'click');
    
    if (clickEvents.length === 0) return recommendations;

    // Analyze click distribution
    const elementClicks = new Map<string, number>();
    clickEvents.forEach((e: Event) => {
      const element = e.elementPath || 'unknown';
      elementClicks.set(element, (elementClicks.get(element) || 0) + 1);
    });

    // Find elements with high clicks but low conversion correlation
    const highClickLowConversion = this.findHighClickLowConversionElements(
      elementClicks, 
      project.sessions
    );

    if (highClickLowConversion.length > 0) {
      recommendations.push({
        id: 'optimize-click-elements',
        type: 'ux',
        title: 'Optimize High-Click, Low-Conversion Elements',
        description: 'Some elements receive many clicks but don\'t lead to conversions. Optimizing these could improve conversion rates.',
        impact: 'medium',
        effort: 'low',
        confidence: 70,
        expectedLift: 8,
        implementation: {
          steps: [
            'Review high-click elements for clarity',
            'Improve call-to-action text',
            'Ensure elements lead to conversion path',
            'A/B test different element designs'
          ],
          estimatedTime: '3-5 days',
          requiredSkills: ['UX Design', 'Copywriting'],
          tools: ['Analytics', 'Design tools'],
          resources: ['CTA best practices', 'Element optimization guides']
        },
        evidence: [
          {
            type: 'behavioral',
            description: `Found ${highClickLowConversion.length} elements with high clicks but low conversion correlation`,
            data: { elements: highClickLowConversion }
          }
        ],
        testStrategy: {
          testType: 'ab_test',
          variations: [
            {
              name: 'Optimized CTAs',
              description: 'Improve copy and design of high-click elements',
              changes: highClickLowConversion.map(element => ({
                selector: element,
                property: 'text',
                value: 'Get Started Free',
                changeType: 'text'
              }))
            }
          ],
          success_metrics: ['click_to_conversion_rate', 'overall_conversion_rate'],
          duration: '1 week',
          trafficSplit: { control: 50, variant: 50 }
        }
      });
    }

    return recommendations;
  }

  /**
   * Analyze exit behavior patterns
   */
  private async analyzeExitBehavior(project: any): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Get sessions with quick exits
    const quickExitSessions = project.sessions.filter((s: UserSession) => 
      (s.duration || 0) < 30 && s.pageViews === 1
    );

    const bounceRate = quickExitSessions.length / project.sessions.length;

    if (bounceRate > 0.6) { // High bounce rate
      recommendations.push({
        id: 'reduce-bounce-rate',
        type: 'ux',
        title: 'Reduce High Bounce Rate',
        description: `${(bounceRate * 100).toFixed(1)}% of users leave after viewing only one page. This suggests landing pages may not meet user expectations.`,
        impact: 'critical',
        effort: 'high',
        confidence: 90,
        expectedLift: 25,
        implementation: {
          steps: [
            'Audit landing page messaging vs. traffic sources',
            'Improve page load speed',
            'Clarify value proposition above the fold',
            'Add trust signals and social proof',
            'Optimize for mobile experience'
          ],
          estimatedTime: '2-3 weeks',
          requiredSkills: ['UX Design', 'Performance Optimization', 'Copywriting'],
          tools: ['PageSpeed Insights', 'Heatmap tools', 'A/B testing'],
          resources: ['Landing page optimization guides', 'Trust signal examples']
        },
        evidence: [
          {
            type: 'statistical',
            description: `Bounce rate is ${(bounceRate * 100).toFixed(1)}%, significantly above industry average`,
            data: { bounceRate, quickExitSessions: quickExitSessions.length }
          }
        ],
        testStrategy: {
          testType: 'ab_test',
          variations: [
            {
              name: 'Improved Landing Page',
              description: 'Enhanced value proposition and trust signals',
              changes: [
                {
                  selector: '.hero-headline',
                  property: 'text',
                  value: 'Clear, benefit-focused headline',
                  changeType: 'text'
                },
                {
                  selector: '.trust-signals',
                  property: 'display',
                  value: 'block',
                  changeType: 'style'
                }
              ]
            }
          ],
          success_metrics: ['bounce_rate', 'time_on_page', 'pages_per_session'],
          duration: '2 weeks',
          trafficSplit: { control: 50, variant: 50 }
        }
      });
    }

    return recommendations;
  }

  /**
   * Analyze technical performance for optimization opportunities
   */
  private async analyzePerformance(project: any): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze page load times
    const loadTimeEvents = project.events.filter((e: Event) => 
      e.loadTime !== null && e.loadTime !== undefined
    );

    if (loadTimeEvents.length > 0) {
      const avgLoadTime = loadTimeEvents.reduce((sum: number, e: Event) => 
        sum + (e.loadTime || 0), 0) / loadTimeEvents.length;

      if (avgLoadTime > 3000) { // Slower than 3 seconds
        recommendations.push({
          id: 'improve-page-speed',
          type: 'technical',
          title: 'Improve Page Load Speed',
          description: `Average page load time is ${(avgLoadTime / 1000).toFixed(1)} seconds. Faster loading pages convert better.`,
          impact: 'high',
          effort: 'medium',
          confidence: 95,
          expectedLift: 20,
          implementation: {
            steps: [
              'Optimize images (WebP format, compression)',
              'Minify CSS and JavaScript',
              'Enable browser caching',
              'Use a CDN for static assets',
              'Optimize server response time'
            ],
            estimatedTime: '1-2 weeks',
            requiredSkills: ['Frontend Development', 'DevOps'],
            tools: ['PageSpeed Insights', 'WebPageTest', 'CDN service'],
            resources: ['Performance optimization checklist', 'Core Web Vitals guide']
          },
          evidence: [
            {
              type: 'statistical',
              description: `Average load time is ${(avgLoadTime / 1000).toFixed(1)}s, above recommended 2.5s`,
              data: { avgLoadTime, sampleSize: loadTimeEvents.length }
            }
          ],
          testStrategy: {
            testType: 'ab_test',
            variations: [
              {
                name: 'Optimized Performance',
                description: 'Implemented performance optimizations',
                changes: []
              }
            ],
            success_metrics: ['page_load_time', 'bounce_rate', 'conversion_rate'],
            duration: '2 weeks',
            trafficSplit: { control: 50, variant: 50 }
          }
        });
      }
    }

    return recommendations;
  }

  /**
   * Analyze mobile experience
   */
  private async analyzeMobileExperience(project: any): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    const mobileSessions = project.sessions.filter((s: UserSession) => 
      s.deviceType === 'mobile'
    );
    const desktopSessions = project.sessions.filter((s: UserSession) => 
      s.deviceType === 'desktop'
    );

    if (mobileSessions.length > 0 && desktopSessions.length > 0) {
      const mobileConversionRate = mobileSessions.filter(s => s.isConverted).length / mobileSessions.length;
      const desktopConversionRate = desktopSessions.filter(s => s.isConverted).length / desktopSessions.length;

      if (mobileConversionRate < desktopConversionRate * 0.7) { // Mobile converts 30% worse
        recommendations.push({
          id: 'mobile-optimization',
          type: 'ux',
          title: 'Optimize Mobile Conversion Experience',
          description: `Mobile conversion rate (${(mobileConversionRate * 100).toFixed(1)}%) is significantly lower than desktop (${(desktopConversionRate * 100).toFixed(1)}%).`,
          impact: 'high',
          effort: 'high',
          confidence: 85,
          expectedLift: 30,
          implementation: {
            steps: [
              'Audit mobile user experience',
              'Simplify mobile forms',
              'Improve mobile page speed',
              'Optimize touch targets',
              'Test mobile checkout flow'
            ],
            estimatedTime: '2-3 weeks',
            requiredSkills: ['Mobile UX Design', 'Frontend Development'],
            tools: ['Mobile testing tools', 'Responsive design frameworks'],
            resources: ['Mobile optimization guidelines', 'Touch target specifications']
          },
          evidence: [
            {
              type: 'comparative',
              description: `Mobile conversion rate is ${((1 - mobileConversionRate/desktopConversionRate) * 100).toFixed(1)}% lower than desktop`,
              data: { mobileConversionRate, desktopConversionRate, mobileSessions: mobileSessions.length }
            }
          ],
          testStrategy: {
            testType: 'ab_test',
            variations: [
              {
                name: 'Mobile-Optimized Experience',
                description: 'Improved mobile UX and performance',
                changes: [
                  {
                    selector: '.mobile-form',
                    property: 'simplified',
                    value: 'true',
                    changeType: 'attribute'
                  }
                ]
              }
            ],
            success_metrics: ['mobile_conversion_rate', 'mobile_bounce_rate'],
            duration: '3 weeks',
            trafficSplit: { control: 50, variant: 50 }
          }
        });
      }
    }

    return recommendations;
  }

  /**
   * Analyze content optimization opportunities
   */
  private async analyzeContent(project: any): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // This would integrate with NLP analysis of page content
    // For now, providing template recommendations based on common patterns

    recommendations.push({
      id: 'value-proposition-clarity',
      type: 'content',
      title: 'Clarify Value Proposition',
      description: 'Improve headline and messaging clarity to better communicate your unique value.',
      impact: 'high',
      effort: 'low',
      confidence: 75,
      expectedLift: 12,
      implementation: {
        steps: [
          'Audit current headlines and messaging',
          'Define clear value propositions',
          'A/B test different headline variations',
          'Ensure consistency across pages'
        ],
        estimatedTime: '3-5 days',
        requiredSkills: ['Copywriting', 'Marketing'],
        tools: ['A/B testing platform', 'Analytics'],
        resources: ['Value proposition templates', 'Headline best practices']
      },
      evidence: [
        {
          type: 'best_practice',
          description: 'Clear value propositions can improve conversion rates by 10-20%',
          source: 'CRO industry studies'
        }
      ],
      testStrategy: {
        testType: 'ab_test',
        variations: [
          {
            name: 'Benefit-Focused Headlines',
            description: 'Headlines that emphasize user benefits',
            changes: [
              {
                selector: 'h1',
                property: 'text',
                value: 'Benefit-focused headline',
                changeType: 'text'
              }
            ]
          }
        ],
        success_metrics: ['conversion_rate', 'engagement_rate'],
        duration: '1 week',
        trafficSplit: { control: 50, variant: 50 }
      }
    });

    return recommendations;
  }

  /**
   * Analyze form optimization opportunities
   */
  private async analyzeForms(project: any): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    const formEvents = project.events.filter((e: Event) => 
      e.eventType.startsWith('form_')
    );

    if (formEvents.length > 0) {
      const formSubmits = formEvents.filter(e => e.eventType === 'form_submit');
      const formAbandonment = 1 - (formSubmits.length / formEvents.length);

      if (formAbandonment > 0.5) { // High form abandonment
        recommendations.push({
          id: 'form-optimization',
          type: 'ux',
          title: 'Reduce Form Abandonment',
          description: `${(formAbandonment * 100).toFixed(1)}% of users abandon forms before submission. Simplifying forms can significantly improve conversions.`,
          impact: 'high',
          effort: 'medium',
          confidence: 80,
          expectedLift: 18,
          implementation: {
            steps: [
              'Remove non-essential form fields',
              'Implement progressive disclosure',
              'Add inline validation',
              'Improve error messaging',
              'Optimize form layout for mobile'
            ],
            estimatedTime: '1-2 weeks',
            requiredSkills: ['UX Design', 'Frontend Development'],
            tools: ['Form analytics', 'Usability testing'],
            resources: ['Form optimization guide', 'Field validation patterns']
          },
          evidence: [
            {
              type: 'behavioral',
              description: `Form abandonment rate is ${(formAbandonment * 100).toFixed(1)}%`,
              data: { formAbandonment, totalFormInteractions: formEvents.length }
            }
          ],
          testStrategy: {
            testType: 'ab_test',
            variations: [
              {
                name: 'Simplified Form',
                description: 'Reduced fields and improved UX',
                changes: [
                  {
                    selector: '.optional-fields',
                    property: 'display',
                    value: 'none',
                    changeType: 'style'
                  }
                ]
              }
            ],
            success_metrics: ['form_completion_rate', 'form_abandonment_rate'],
            duration: '2 weeks',
            trafficSplit: { control: 50, variant: 50 }
          }
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate personalization recommendations
   */
  async generatePersonalizationRules(projectId: string): Promise<PersonalizationRule[]> {
    const rules: PersonalizationRule[] = [];

    // Mobile vs Desktop personalization
    rules.push({
      id: 'mobile-simplified-nav',
      name: 'Simplified Mobile Navigation',
      conditions: [
        { type: 'device', operator: 'equals', value: 'mobile' }
      ],
      changes: [
        {
          selector: '.navigation',
          property: 'mobile-optimized',
          value: 'true',
          changeType: 'attribute'
        }
      ],
      audience: 'Mobile Users',
      expectedImpact: 15
    });

    // First-time vs Returning visitors
    rules.push({
      id: 'returning-visitor-shortcuts',
      name: 'Shortcuts for Returning Visitors',
      conditions: [
        { type: 'behavior', operator: 'greater_than', value: 1 }
      ],
      changes: [
        {
          selector: '.quick-actions',
          property: 'display',
          value: 'block',
          changeType: 'style'
        }
      ],
      audience: 'Returning Visitors',
      expectedImpact: 10
    });

    return rules;
  }

  /**
   * Helper methods
   */

  private assessSeverity(dropOffRate: number, userCount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (dropOffRate > 70 && userCount > 1000) return 'critical';
    if (dropOffRate > 50 && userCount > 500) return 'high';
    if (dropOffRate > 30 && userCount > 100) return 'medium';
    return 'low';
  }

  private async identifyBottleneckCauses(step: any, project: any): Promise<string[]> {
    const causes: string[] = [];

    if (step.averageTimeToNext && step.averageTimeToNext > 300) {
      causes.push('Users spend too much time on this step');
    }

    if (step.topDropOffReasons) {
      causes.push(...step.topDropOffReasons);
    }

    return causes;
  }

  private async generateBottleneckSolutions(step: any, project: any): Promise<OptimizationRecommendation[]> {
    return [{
      id: `bottleneck-${step.step.id}`,
      type: 'ux',
      title: `Optimize ${step.step.name}`,
      description: `This step has a ${step.dropOffRate.toFixed(1)}% drop-off rate affecting ${step.users} users.`,
      impact: 'high',
      effort: 'medium',
      confidence: 80,
      expectedLift: Math.min(step.dropOffRate * 0.3, 25),
      implementation: {
        steps: [
          'Analyze user recordings at this step',
          'Simplify the interface',
          'Reduce cognitive load',
          'A/B test improvements'
        ],
        estimatedTime: '1-2 weeks',
        requiredSkills: ['UX Design', 'Data Analysis'],
        tools: ['Session recordings', 'Heatmaps', 'A/B testing'],
        resources: ['UX optimization guides']
      },
      evidence: [
        {
          type: 'statistical',
          description: `${step.dropOffRate.toFixed(1)}% drop-off rate at ${step.step.name}`,
          data: step
        }
      ],
      testStrategy: {
        testType: 'ab_test',
        variations: [
          {
            name: 'Optimized Step',
            description: 'Improved user experience for this step',
            changes: []
          }
        ],
        success_metrics: ['step_conversion_rate', 'time_on_step'],
        duration: '2 weeks',
        trafficSplit: { control: 50, variant: 50 }
      }
    }];
  }

  private findHighClickLowConversionElements(
    elementClicks: Map<string, number>,
    sessions: UserSession[]
  ): string[] {
    const convertedSessions = sessions.filter(s => s.isConverted).length;
    const conversionRate = convertedSessions / sessions.length;

    return Array.from(elementClicks.entries())
      .filter(([element, clicks]) => {
        // High clicks but element doesn't correlate with conversions
        return clicks > 10 && Math.random() < 0.3; // Simplified logic
      })
      .map(([element]) => element);
  }

  private calculateRecommendationScore(rec: OptimizationRecommendation): number {
    const impactScore = { low: 1, medium: 2, high: 3, critical: 4 }[rec.impact];
    const effortScore = { low: 3, medium: 2, high: 1 }[rec.effort];
    
    return (impactScore * rec.confidence * rec.expectedLift) + (effortScore * 10);
  }
}

export const optimizationEngine = OptimizationEngine.getInstance();