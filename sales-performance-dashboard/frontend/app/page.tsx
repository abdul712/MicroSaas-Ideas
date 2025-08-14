import Link from 'next/link';
import { 
  ArrowRightIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-brand-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">
                  Sales Performance Dashboard
                </h1>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
              </a>
            </nav>
            
            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Transform Your
                <span className="text-brand-600"> Sales Data</span>
                <br />
                Into Actionable Insights
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl">
                Enterprise-grade sales performance analytics with real-time insights, 
                AI-powered forecasting, and seamless CRM integrations. Make data-driven 
                decisions that drive revenue growth.
              </p>
              
              {/* Key Benefits */}
              <div className="mt-8 flex flex-wrap gap-6">
                <div className="flex items-center text-gray-700">
                  <ChartBarIcon className="h-5 w-5 text-brand-500 mr-2" />
                  Real-time Analytics
                </div>
                <div className="flex items-center text-gray-700">
                  <LightBulbIcon className="h-5 w-5 text-brand-500 mr-2" />
                  AI Forecasting
                </div>
                <div className="flex items-center text-gray-700">
                  <GlobeAltIcon className="h-5 w-5 text-brand-500 mr-2" />
                  CRM Integrations
                </div>
              </div>
              
              {/* CTA */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="btn-primary text-lg px-8 py-3"
                >
                  Start Free Trial
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/demo"
                  className="btn-outline text-lg px-8 py-3"
                >
                  View Demo
                </Link>
              </div>
              
              {/* Social Proof */}
              <div className="mt-8 text-sm text-gray-500">
                Trusted by 500+ sales teams worldwide
              </div>
            </div>
            
            {/* Hero Image/Dashboard Preview */}
            <div className="lg:col-span-6 mt-12 lg:mt-0">
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-1 transition-transform duration-300">
                  <div className="space-y-4">
                    {/* Mock Dashboard Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Revenue Dashboard
                      </h3>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Mock Charts */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-brand-50 to-brand-100 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-brand-700">$2.4M</div>
                        <div className="text-sm text-brand-600">Total Revenue</div>
                      </div>
                      <div className="bg-gradient-to-br from-success-50 to-success-100 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-success-700">156</div>
                        <div className="text-sm text-success-600">Deals Closed</div>
                      </div>
                      <div className="bg-gradient-to-br from-warning-50 to-warning-100 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-warning-700">89%</div>
                        <div className="text-sm text-warning-600">Goal Achievement</div>
                      </div>
                    </div>
                    
                    {/* Mock Chart */}
                    <div className="bg-gray-50 h-32 rounded-lg flex items-end justify-center p-4">
                      <div className="flex items-end space-x-2">
                        {[40, 65, 45, 80, 55, 70, 90].map((height, index) => (
                          <div
                            key={index}
                            className="bg-brand-400 w-4 rounded-t"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 transform -rotate-12">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-700">Live Data</span>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3 transform rotate-12">
                  <div className="text-xs font-medium text-gray-700">AI Forecast</div>
                  <div className="text-lg font-bold text-brand-600">↗ +23%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need to optimize sales performance
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive analytics, powerful integrations, and intelligent insights 
              in one unified platform.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card hover:shadow-medium transition-shadow">
              <div className="card-body">
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                  <ChartBarIcon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Real-time Analytics
                </h3>
                <p className="text-gray-600">
                  Monitor sales performance with live dashboards, instant KPI updates, 
                  and real-time data synchronization from all your sources.
                </p>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="card hover:shadow-medium transition-shadow">
              <div className="card-body">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                  <LightBulbIcon className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  AI-Powered Forecasting
                </h3>
                <p className="text-gray-600">
                  Predict future sales with machine learning models that analyze 
                  historical data, seasonality, and market trends.
                </p>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="card hover:shadow-medium transition-shadow">
              <div className="card-body">
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mb-4">
                  <GlobeAltIcon className="h-6 w-6 text-warning-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  CRM Integrations
                </h3>
                <p className="text-gray-600">
                  Connect with Salesforce, HubSpot, Pipedrive, and more. 
                  Seamless data sync with your existing sales tools.
                </p>
              </div>
            </div>
            
            {/* Feature 4 */}
            <div className="card hover:shadow-medium transition-shadow">
              <div className="card-body">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <UserGroupIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Team Performance
                </h3>
                <p className="text-gray-600">
                  Track individual and team metrics, set goals, and identify 
                  top performers with detailed performance analytics.
                </p>
              </div>
            </div>
            
            {/* Feature 5 */}
            <div className="card hover:shadow-medium transition-shadow">
              <div className="card-body">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Revenue Intelligence
                </h3>
                <p className="text-gray-600">
                  Advanced revenue analytics with pipeline tracking, conversion 
                  optimization, and deal intelligence insights.
                </p>
              </div>
            </div>
            
            {/* Feature 6 */}
            <div className="card hover:shadow-medium transition-shadow">
              <div className="card-body">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Enterprise Security
                </h3>
                <p className="text-gray-600">
                  SOC 2 compliant with enterprise-grade security, GDPR compliance, 
                  and role-based access control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to transform your sales performance?
          </h2>
          <p className="mt-4 text-xl text-brand-100 max-w-2xl mx-auto">
            Join hundreds of sales teams who are already using our platform 
            to drive revenue growth and optimize performance.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-3 bg-white text-brand-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-lg"
            >
              Start Your Free Trial
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-brand-200">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-brand-400" />
                <span className="ml-3 text-xl font-bold">Sales Performance Dashboard</span>
              </div>
              <p className="mt-4 text-gray-400 max-w-md">
                Transform your sales data into actionable insights with our 
                enterprise-grade analytics platform.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Product
              </h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Company
              </h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Sales Performance Dashboard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}