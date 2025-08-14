'use client'

import { useState } from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  LinearProgress,
  Avatar,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  TrendingUp,
  AutoAwesome,
  Speed,
  Security,
  Analytics,
  Integration,
  Psychology,
  Timeline,
  PlayArrow,
  Star,
  ArrowForward,
  CheckCircle
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import Link from 'next/link'

const features = [
  {
    icon: <AutoAwesome />,
    title: 'AI-Powered Scoring',
    description: 'Machine learning algorithms analyze behavioral patterns and demographics to provide accurate lead scores in real-time.',
    color: '#8b5cf6'
  },
  {
    icon: <Speed />,
    title: 'Real-time Updates',
    description: 'Scores update instantly as leads interact with your content, emails, and website for immediate insights.',
    color: '#0ea5e9'
  },
  {
    icon: <Integration />,
    title: 'Multi-source Integration',
    description: 'Connect with CRM, email platforms, websites, and social media for comprehensive lead intelligence.',
    color: '#22c55e'
  },
  {
    icon: <Psychology />,
    title: 'Explainable AI',
    description: 'Understand exactly why each lead received their score with detailed breakdowns and reasoning.',
    color: '#f59e0b'
  },
  {
    icon: <Analytics />,
    title: 'Advanced Analytics',
    description: 'Track conversion rates, model performance, and ROI with comprehensive dashboards and reports.',
    color: '#ef4444'
  },
  {
    icon: <Security />,
    title: 'Enterprise Security',
    description: 'GDPR/CCPA compliant with enterprise-grade security, encryption, and audit trails.',
    color: '#6366f1'
  }
]

const stats = [
  { label: 'Increase in Conversion Rate', value: '85%', icon: <TrendingUp /> },
  { label: 'Faster Lead Qualification', value: '10x', icon: <Speed /> },
  { label: 'Scoring Accuracy', value: '94%', icon: <Analytics /> },
  { label: 'Customer Satisfaction', value: '4.9', icon: <Star /> }
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'VP of Sales, TechCorp',
    avatar: '/avatars/sarah.jpg',
    quote: 'Lead Scoring Tool increased our qualified leads by 65% and helped our sales team focus on the right prospects.',
    rating: 5
  },
  {
    name: 'Marcus Johnson',
    role: 'Marketing Director, GrowthCo',
    avatar: '/avatars/marcus.jpg',
    quote: 'The AI explanations are incredibly helpful. We finally understand which marketing efforts drive quality leads.',
    rating: 5
  },
  {
    name: 'Elena Rodriguez',
    role: 'CEO, StartupXYZ',
    avatar: '/avatars/elena.jpg',
    quote: 'Implementation was seamless and ROI was immediate. Our conversion rate improved by 40% in the first month.',
    rating: 5
  }
]

const pricingPlans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'Perfect for small teams getting started with lead scoring',
    features: [
      'Up to 1,000 leads/month',
      'Basic behavioral scoring',
      'Email & web tracking',
      'Standard integrations',
      'Email support'
    ],
    popular: false
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/month',
    description: 'Advanced features for growing sales teams',
    features: [
      'Up to 10,000 leads/month',
      'AI-powered scoring models',
      'CRM integrations',
      'Custom scoring rules',
      'Advanced analytics',
      'Priority support'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: '$399',
    period: '/month',
    description: 'Complete solution for large organizations',
    features: [
      'Unlimited leads',
      'Custom ML models',
      'White-label solution',
      'API access',
      'GDPR compliance tools',
      'Dedicated success manager'
    ],
    popular: false
  }
]

export default function HomePage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 12 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box textAlign="center" mb={8}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                fontWeight: 800,
                mb: 3,
                background: 'linear-gradient(135deg, #0ea5e9, #3b82f6, #8b5cf6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.1
              }}
            >
              AI-Powered Lead Scoring
              <br />
              That Actually Works
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}
            >
              Stop guessing which leads to prioritize. Our machine learning platform 
              automatically scores and routes your best prospects in real-time.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  }
                }}
              >
                Start Free Trial
              </Button>
              <Button
                variant="outlined"
                size="large"
                endIcon={<ArrowForward />}
                sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
              >
                View Demo
              </Button>
            </Stack>
          </Box>

          {/* Stats Section */}
          <Grid container spacing={4} mb={8}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      textAlign: 'center', 
                      p: 2,
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <CardContent>
                      <Box sx={{ color: 'primary.main', mb: 1 }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color="primary.main">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h2" fontWeight="bold" mb={2}>
            Everything You Need to Score Leads Like a Pro
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth="600px" mx="auto">
            Our comprehensive platform combines cutting-edge AI with intuitive design 
            to help you identify and convert your best prospects.
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: hoveredFeature === index ? 'translateY(-8px)' : 'translateY(0)',
                    boxShadow: hoveredFeature === index ? 8 : 2,
                    borderLeft: `4px solid ${feature.color}`
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box 
                      sx={{ 
                        color: feature.color, 
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '2rem'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" fontWeight="bold" mb={2}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Testimonials Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h2" fontWeight="bold" mb={2}>
              Trusted by High-Performing Teams
            </Typography>
            <Typography variant="h6" color="text.secondary">
              See how companies are transforming their sales process
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card sx={{ height: '100%', p: 3 }}>
                    <CardContent>
                      <Box display="flex" mb={2}>
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} sx={{ color: '#f59e0b', fontSize: '1.2rem' }} />
                        ))}
                      </Box>
                      <Typography variant="body1" mb={3} fontStyle="italic">
                        "{testimonial.quote}"
                      </Typography>
                      <Box display="flex" alignItems="center">
                        <Avatar 
                          src={testimonial.avatar} 
                          sx={{ mr: 2, bgcolor: 'primary.main' }}
                        >
                          {testimonial.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {testimonial.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {testimonial.role}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h2" fontWeight="bold" mb={2}>
            Simple, Transparent Pricing
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Choose the plan that fits your team size and needs
          </Typography>
        </Box>
        
        <Grid container spacing={4} justifyContent="center">
          {pricingPlans.map((plan, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    position: 'relative',
                    border: plan.popular ? '2px solid' : '1px solid',
                    borderColor: plan.popular ? 'primary.main' : 'divider',
                    transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                    zIndex: plan.popular ? 2 : 1
                  }}
                >
                  {plan.popular && (
                    <Chip
                      label="Most Popular"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" mb={1}>
                      {plan.name}
                    </Typography>
                    <Box display="flex" alignItems="baseline" justifyContent="center" mb={2}>
                      <Typography variant="h3" fontWeight="bold" color="primary.main">
                        {plan.price}
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        {plan.period}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      {plan.description}
                    </Typography>
                    <Button
                      variant={plan.popular ? 'contained' : 'outlined'}
                      fullWidth
                      size="large"
                      sx={{ mb: 3 }}
                    >
                      Start Free Trial
                    </Button>
                    <Box textAlign="left">
                      {plan.features.map((feature, featureIndex) => (
                        <Box 
                          key={featureIndex} 
                          display="flex" 
                          alignItems="center" 
                          mb={1}
                        >
                          <CheckCircle 
                            sx={{ 
                              color: 'success.main', 
                              mr: 1, 
                              fontSize: '1.2rem' 
                            }} 
                          />
                          <Typography variant="body2">
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="md" textAlign="center">
          <Typography variant="h3" fontWeight="bold" mb={2}>
            Ready to Transform Your Sales Process?
          </Typography>
          <Typography variant="h6" mb={4} sx={{ opacity: 0.9 }}>
            Join thousands of sales teams already using AI to identify and convert 
            their best prospects. Start your free trial today.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'white'
                }
              }}
            >
              Schedule Demo
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Lead Scoring Tool
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                AI-powered lead qualification platform that helps sales teams 
                identify and convert their best prospects.
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Product
              </Typography>
              <Stack spacing={1}>
                <Link href="/features">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    Features
                  </Typography>
                </Link>
                <Link href="/pricing">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    Pricing
                  </Typography>
                </Link>
                <Link href="/integrations">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    Integrations
                  </Typography>
                </Link>
              </Stack>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Company
              </Typography>
              <Stack spacing={1}>
                <Link href="/about">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    About
                  </Typography>
                </Link>
                <Link href="/blog">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    Blog
                  </Typography>
                </Link>
                <Link href="/careers">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    Careers
                  </Typography>
                </Link>
              </Stack>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Support
              </Typography>
              <Stack spacing={1}>
                <Link href="/help">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    Help Center
                  </Typography>
                </Link>
                <Link href="/docs">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    Documentation
                  </Typography>
                </Link>
                <Link href="/contact">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    Contact
                  </Typography>
                </Link>
              </Stack>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Legal
              </Typography>
              <Stack spacing={1}>
                <Link href="/privacy">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    Privacy
                  </Typography>
                </Link>
                <Link href="/terms">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    Terms
                  </Typography>
                </Link>
                <Link href="/security">
                  <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer' }}>
                    Security
                  </Typography>
                </Link>
              </Stack>
            </Grid>
          </Grid>
          <Box textAlign="center" mt={4} pt={4} borderTop="1px solid rgba(255, 255, 255, 0.1)">
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2024 Lead Scoring Tool. All rights reserved. 
              🤖 Generated with <Link href="https://claude.ai/code" target="_blank" sx={{ color: 'inherit' }}>Claude Code</Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}