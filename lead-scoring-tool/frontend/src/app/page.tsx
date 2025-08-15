'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  LinearProgress,
  Fade,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Security,
  Analytics,
  AutoGraph,
  Integration,
  PlayArrow,
  GitHub,
  Description,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const MotionCard = motion(Card);
const MotionBox = motion(Box);

export default function HomePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mounted, setMounted] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Simulate demo progress
    const timer = setInterval(() => {
      setDemoProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  // Sample data for charts
  const scoreDistributionData = {
    labels: ['Hot Leads', 'Warm Leads', 'Cold Leads'],
    datasets: [
      {
        data: [25, 45, 30],
        backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const conversionTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Conversion Rate',
        data: [12, 19, 15, 25, 22, 30],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const features = [
    {
      icon: <AutoGraph />,
      title: 'AI-Powered Scoring',
      description: 'Advanced machine learning algorithms automatically score and rank leads based on behavior and demographics.',
      color: '#10B981',
    },
    {
      icon: <Speed />,
      title: 'Real-time Updates',
      description: 'Sub-1 second scoring updates as leads interact with your content and platforms.',
      color: '#3B82F6',
    },
    {
      icon: <Analytics />,
      title: 'Advanced Analytics',
      description: 'Comprehensive dashboards with conversion tracking, ROI analysis, and predictive insights.',
      color: '#8B5CF6',
    },
    {
      icon: <Integration />,
      title: 'Multi-source Integration',
      description: 'Connect CRM, email platforms, social media, and website data for comprehensive scoring.',
      color: '#F59E0B',
    },
    {
      icon: <Security />,
      title: 'Enterprise Security',
      description: 'GDPR/CCPA compliant with enterprise-grade security and multi-tenant architecture.',
      color: '#EF4444',
    },
    {
      icon: <TrendingUp />,
      title: 'Performance Optimization',
      description: '30%+ improvement in conversion rates by focusing on the most promising leads.',
      color: '#06B6D4',
    },
  ];

  const stats = [
    { label: 'Scoring Accuracy', value: '85%+', description: 'vs actual conversions' },
    { label: 'Response Time', value: '<1s', description: 'real-time updates' },
    { label: 'Conversion Improvement', value: '30%+', description: 'increase in sales rates' },
    { label: 'Data Sources', value: '10+', description: 'platform integrations' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Fade in timeout={1000}>
          <Box textAlign="center" mb={8}>
            <MotionBox
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                Lead Scoring Tool
              </Typography>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontSize: { xs: '1.2rem', md: '1.5rem' },
                  fontWeight: 400,
                  color: 'text.secondary',
                  mb: 4,
                  maxWidth: '800px',
                  mx: 'auto',
                }}
              >
                AI-Powered Lead Qualification Platform
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  color: 'text.secondary',
                  mb: 6,
                  maxWidth: '600px',
                  mx: 'auto',
                  lineHeight: 1.6,
                }}
              >
                Enterprise-grade platform that uses machine learning to automatically score, prioritize,
                and qualify leads, helping sales teams focus on the most promising opportunities.
              </Typography>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
                alignItems="center"
                mb={4}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                    },
                  }}
                >
                  Start Demo
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Description />}
                  sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                >
                  View Documentation
                </Button>
                <IconButton
                  size="large"
                  sx={{ color: 'text.secondary' }}
                  href="https://github.com/your-repo"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitHub fontSize="large" />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                <Chip label="Production Ready" color="success" variant="outlined" />
                <Chip label="Enterprise Grade" color="primary" variant="outlined" />
                <Chip label="90%+ Test Coverage" color="secondary" variant="outlined" />
                <Chip label="GDPR Compliant" color="warning" variant="outlined" />
              </Stack>
            </MotionBox>
          </Box>
        </Fade>

        {/* Demo Progress */}
        <MotionCard
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          sx={{ mb: 8, p: 3, textAlign: 'center' }}
        >
          <Typography variant="h6" gutterBottom>
            Live Demo - Lead Scoring in Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={demoProgress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">
                {`${Math.round(demoProgress)}%`}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Processing 1,247 leads through AI scoring engine...
          </Typography>
        </MotionCard>

        {/* Stats Section */}
        <Grid container spacing={3} mb={8}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <MotionCard
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                sx={{ textAlign: 'center', p: 3 }}
              >
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.description}
                </Typography>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        {/* Features Grid */}
        <Typography
          variant="h3"
          component="h3"
          textAlign="center"
          sx={{ mb: 6, fontWeight: 600 }}
        >
          Enterprise Features
        </Typography>

        <Grid container spacing={4} mb={8}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <MotionCard
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                sx={{
                  height: '100%',
                  p: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: (theme) => theme.shadows[8],
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      color: feature.color,
                    }}
                  >
                    {feature.icon}
                    <Typography variant="h6" component="h4" sx={{ ml: 1, fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        {/* Charts Section */}
        <Typography
          variant="h3"
          component="h3"
          textAlign="center"
          sx={{ mb: 6, fontWeight: 600 }}
        >
          Analytics Dashboard Preview
        </Typography>

        <Grid container spacing={4} mb={8}>
          <Grid item xs={12} md={6}>
            <MotionCard
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              sx={{ p: 3, height: '400px' }}
            >
              <Typography variant="h6" gutterBottom textAlign="center">
                Lead Score Distribution
              </Typography>
              <Box sx={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut
                  data={scoreDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </Box>
            </MotionCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <MotionCard
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.7 }}
              sx={{ p: 3, height: '400px' }}
            >
              <Typography variant="h6" gutterBottom textAlign="center">
                Conversion Rate Trend
              </Typography>
              <Box sx={{ height: '300px' }}>
                <Line
                  data={conversionTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 35,
                      },
                    },
                  }}
                />
              </Box>
            </MotionCard>
          </Grid>
        </Grid>

        {/* Technology Stack */}
        <MotionCard
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2 }}
          sx={{ p: 4, textAlign: 'center', mb: 8 }}
        >
          <Typography variant="h4" component="h3" gutterBottom fontWeight={600}>
            Enterprise Technology Stack
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}>
            Built with modern, scalable technologies for enterprise-grade performance and reliability.
          </Typography>
          
          <Grid container spacing={2} justifyContent="center">
            {[
              'Next.js 14', 'FastAPI', 'PostgreSQL', 'Redis', 'TensorFlow',
              'scikit-learn', 'Docker', 'Kubernetes', 'Prometheus', 'Grafana'
            ].map((tech, index) => (
              <Grid item key={index}>
                <Chip
                  label={tech}
                  variant="outlined"
                  sx={{
                    fontSize: '0.9rem',
                    py: 1,
                    px: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    },
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </MotionCard>

        {/* Call to Action */}
        <MotionBox
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2 }}
          textAlign="center"
        >
          <Typography
            variant="h4"
            component="h3"
            gutterBottom
            fontWeight={600}
          >
            Ready to Transform Your Lead Qualification?
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
          >
            Start scoring your leads with AI-powered precision and watch your conversion rates soar.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                },
              }}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              Schedule Demo
            </Button>
          </Stack>
        </MotionBox>
      </Container>
    </Box>
  );
}