import React from 'react';
import { 
  Brain, 
  Users, 
  Target, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Building,
  Calendar,
  BarChart3,
  Shield
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Job Creation',
      description: 'Receive job emails from clients and automatically create job postings in the system with AI assistance.',
      highlight: true
    },
    {
      icon: Target,
      title: 'Smart Candidate Matching',
      description: 'Upload candidate profiles and get AI-powered recommendations on whether they\'re the right fit for specific roles.',
      highlight: true
    },
    {
      icon: Users,
      title: 'Comprehensive Talent Pool',
      description: 'Build and manage your talent database with advanced search and filtering capabilities.'
    },
    {
      icon: Calendar,
      title: 'Interview Management',
      description: 'Schedule, track, and manage interview processes with automated notifications and reminders.'
    },
    {
      icon: Building,
      title: 'Client & SPOC Management',
      description: 'Manage client relationships and external/internal points of contact efficiently.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Get insights into recruitment performance with comprehensive analytics and reporting tools.'
    }
  ];

  const benefits = [
    'Reduce time-to-hire by 60% with AI automation',
    'Improve candidate quality with smart matching',
    'Streamline client communication and job intake',
    'Track recruitment metrics and performance',
    'Centralize all recruitment activities in one platform',
    'Scale your recruitment operations efficiently'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ATS Pro</h1>
                <p className="text-sm text-gray-500">AI-Powered Recruitment</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={onLogin}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onSignup}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Recruitment Platform
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Recruitment </span>
            Process
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Streamline hiring with AI-powered job creation, smart candidate matching, and comprehensive recruitment management. 
            From email-to-job automation to intelligent candidate scoring.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onSignup}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 font-semibold text-lg flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={onLogin}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all font-semibold text-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Recruitment
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your recruitment process efficiently, powered by artificial intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`p-8 rounded-xl border transition-all hover:shadow-lg ${
                    feature.highlight
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${
                    feature.highlight
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  {feature.highlight && (
                    <div className="mt-4">
                      <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        <Brain className="w-3 h-3 mr-1" />
                        AI-Powered
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose ATS Pro?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join hundreds of companies that have transformed their recruitment process with our AI-powered platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-4 text-white">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Shield className="w-16 h-16 text-blue-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Recruitment?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Start your free trial today and experience the power of AI-driven recruitment management.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onSignup}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 font-semibold text-lg"
            >
              Start Free Trial
            </button>
            <button
              onClick={onLogin}
              className="px-8 py-4 border-2 border-gray-600 text-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-400 transition-all font-semibold text-lg"
            >
              Sign In to Your Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-white font-semibold">ATS Pro</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 ATS Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
