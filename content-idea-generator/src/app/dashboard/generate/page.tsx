'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Bookmark,
  Copy,
  Download,
  RefreshCw,
  Plus,
  X,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

interface ContentIdea {
  id: string
  title: string
  description: string
  outline: string[]
  keywords: string[]
  primaryKeyword: string
  angle: string
  hookSuggestions: string[]
  ctaSuggestions: string[]
  estimatedReadTime: number
  targetWordCount: number
  difficultyScore: number
  seoScore: number
  contentType: string
  trendScore?: number
}

export default function GenerateIdeasPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    niche: '',
    keywords: [] as string[],
    keywordInput: '',
    contentType: 'blog_post',
    toneOfVoice: 'professional',
    targetAudience: '',
    competitors: [] as string[],
    competitorInput: '',
    count: 3
  })
  const [generatedIdeas, setGeneratedIdeas] = useState<ContentIdea[]>([])
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null)

  const contentTypes = [
    { value: 'blog_post', label: 'Blog Post' },
    { value: 'social_media', label: 'Social Media Post' },
    { value: 'video', label: 'Video Content' },
    { value: 'email', label: 'Email Newsletter' },
    { value: 'podcast', label: 'Podcast Episode' },
    { value: 'infographic', label: 'Infographic' },
    { value: 'case_study', label: 'Case Study' },
    { value: 'whitepaper', label: 'Whitepaper' }
  ]

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'authoritative', label: 'Authoritative' },
    { value: 'conversational', label: 'Conversational' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'inspiring', label: 'Inspiring' }
  ]

  const addKeyword = () => {
    if (formData.keywordInput.trim() && !formData.keywords.includes(formData.keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, prev.keywordInput.trim()],
        keywordInput: ''
      }))
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const addCompetitor = () => {
    if (formData.competitorInput.trim() && !formData.competitors.includes(formData.competitorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        competitors: [...prev.competitors, prev.competitorInput.trim()],
        competitorInput: ''
      }))
    }
  }

  const removeCompetitor = (competitor: string) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c !== competitor)
    }))
  }

  const generateIdeas = async () => {
    if (!formData.niche.trim() || formData.keywords.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a niche and at least one keyword.",
        variant: "destructive"
      })
      return
    }

    if (!session?.user?.credits || session.user.credits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 credit to generate ideas. Please upgrade your plan.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche: formData.niche,
          keywords: formData.keywords,
          contentType: formData.contentType,
          toneOfVoice: formData.toneOfVoice,
          targetAudience: formData.targetAudience,
          competitors: formData.competitors,
          count: formData.count
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate ideas')
      }

      setGeneratedIdeas(data.ideas)
      toast({
        title: "Ideas Generated!",
        description: `Successfully generated ${data.ideas.length} content ideas.`,
      })

    } catch (error) {
      console.error('Error generating ideas:', error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate ideas. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    })
  }

  const saveIdea = async (idea: ContentIdea) => {
    // Implementation for saving idea
    toast({
      title: "Idea Saved!",
      description: "Added to your saved ideas.",
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="h-8 w-8 text-yellow-500" />
            Generate Content Ideas
          </h1>
          <p className="text-muted-foreground mt-1">
            Create AI-powered content ideas tailored to your niche and audience
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            <Zap className="h-3 w-3 mr-1" />
            {session?.user?.credits || 0} credits
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Setup Your Generation
              </CardTitle>
              <CardDescription>
                Provide details about your niche and target audience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Niche */}
              <div className="space-y-2">
                <Label htmlFor="niche">Niche/Industry *</Label>
                <Input
                  id="niche"
                  placeholder="e.g., Digital Marketing, Health & Fitness"
                  value={formData.niche}
                  onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label>Target Keywords *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a keyword"
                    value={formData.keywordInput}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywordInput: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button onClick={addKeyword} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="gap-1">
                      {keyword}
                      <button onClick={() => removeKeyword(keyword)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Content Type */}
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={formData.contentType} onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tone of Voice */}
              <div className="space-y-2">
                <Label>Tone of Voice</Label>
                <Select value={formData.toneOfVoice} onValueChange={(value) => setFormData(prev => ({ ...prev, toneOfVoice: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Textarea
                  id="audience"
                  placeholder="Describe your target audience (age, interests, pain points, etc.)"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Competitors */}
              <div className="space-y-2">
                <Label>Competitors (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add competitor domain or name"
                    value={formData.competitorInput}
                    onChange={(e) => setFormData(prev => ({ ...prev, competitorInput: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                  />
                  <Button onClick={addCompetitor} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.competitors.map((competitor) => (
                    <Badge key={competitor} variant="secondary" className="gap-1">
                      {competitor}
                      <button onClick={() => removeCompetitor(competitor)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Number of Ideas */}
              <div className="space-y-2">
                <Label>Number of Ideas</Label>
                <Select value={formData.count.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, count: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 idea</SelectItem>
                    <SelectItem value="3">3 ideas</SelectItem>
                    <SelectItem value="5">5 ideas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={generateIdeas} 
                disabled={isGenerating || !formData.niche || formData.keywords.length === 0}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Ideas ({formData.count} credit{formData.count !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generated Ideas */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Generated Ideas</h2>
              {generatedIdeas.length > 0 && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              )}
            </div>

            <AnimatePresence>
              {generatedIdeas.length === 0 ? (
                <Card className="min-h-[400px] flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-medium">Ready to Generate Ideas?</h3>
                    <p className="text-muted-foreground max-w-md">
                      Fill out the form on the left with your niche, keywords, and target audience to get started.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {generatedIdeas.map((idea, index) => (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="idea-card">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-2 cursor-pointer hover:text-primary transition-colors" 
                                        onClick={() => setExpandedIdea(expandedIdea === idea.id ? null : idea.id)}>
                                {idea.title}
                              </CardTitle>
                              <CardDescription className="mt-2">
                                {idea.description}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(idea.title)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => saveIdea(idea)}
                              >
                                <Bookmark className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="secondary" className="text-xs">
                              {idea.contentType.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${getScoreColor(idea.seoScore)}`}>
                              SEO: {idea.seoScore}%
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${getScoreColor(idea.difficultyScore)}`}>
                              Difficulty: {idea.difficultyScore}%
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {idea.estimatedReadTime} min read
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {idea.targetWordCount} words
                            </Badge>
                          </div>
                        </CardHeader>

                        <AnimatePresence>
                          {expandedIdea === idea.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <CardContent className="border-t pt-4">
                                <div className="space-y-4">
                                  {/* Outline */}
                                  <div>
                                    <h4 className="font-medium mb-2">Content Outline</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                      {idea.outline.map((point, i) => (
                                        <li key={i}>{point}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Keywords */}
                                  <div>
                                    <h4 className="font-medium mb-2">Target Keywords</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {idea.keywords.map((keyword) => (
                                        <Badge key={keyword} variant="outline" className="text-xs">
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Hook Suggestions */}
                                  <div>
                                    <h4 className="font-medium mb-2">Hook Suggestions</h4>
                                    <div className="space-y-2">
                                      {idea.hookSuggestions.map((hook, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                          <span className="text-xs text-muted-foreground mt-1">{i + 1}.</span>
                                          <span className="text-sm">{hook}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(hook)}
                                            className="ml-auto"
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* CTA Suggestions */}
                                  <div>
                                    <h4 className="font-medium mb-2">Call-to-Action Suggestions</h4>
                                    <div className="space-y-2">
                                      {idea.ctaSuggestions.map((cta, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                          <span className="text-xs text-muted-foreground mt-1">{i + 1}.</span>
                                          <span className="text-sm">{cta}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(cta)}
                                            className="ml-auto"
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Angle */}
                                  <div>
                                    <h4 className="font-medium mb-2">Unique Angle</h4>
                                    <p className="text-sm text-muted-foreground">{idea.angle}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}