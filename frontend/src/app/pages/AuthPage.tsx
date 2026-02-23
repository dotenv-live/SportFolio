import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { ArrowLeft, Mail, Lock, User, Phone, Trophy, TrendingUp } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') || 'investor';
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === 'investor') {
      navigate('/dashboard');
    } else {
      navigate('/athlete-dashboard');
    }
  };

  const isInvestor = userType === 'investor';
  const accentColor = isInvestor ? 'emerald' : 'blue';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/">
            <button className="w-8 h-8 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <span className="font-semibold text-sm">Sports Folio</span>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* User Type Badge */}
          <div className="flex items-center justify-center mb-8">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              isInvestor 
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-blue-500/10 border border-blue-500/20'
            }`}>
              {isInvestor ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <Trophy className="w-4 h-4 text-blue-500" />
              )}
              <span className={`text-sm font-medium ${
                isInvestor ? 'text-emerald-500' : 'text-blue-500'
              }`}>
                {isInvestor ? 'Investor Account' : 'Athlete Account'}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm text-neutral-400">
              {isLogin 
                ? `Sign in to your ${isInvestor ? 'investor' : 'athlete'} account`
                : `Join as ${isInvestor ? 'an investor' : 'an athlete'} on Sports Folio`
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs text-neutral-400 mb-2 block uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 bg-[#0a0a0a] border-white/[0.08] h-12 text-sm placeholder:text-neutral-600"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-neutral-400 mb-2 block uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 bg-[#0a0a0a] border-white/[0.08] h-12 text-sm placeholder:text-neutral-600"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="text-xs text-neutral-400 mb-2 block uppercase tracking-wide">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 bg-[#0a0a0a] border-white/[0.08] h-12 text-sm placeholder:text-neutral-600"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-neutral-400 mb-2 block uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 bg-[#0a0a0a] border-white/[0.08] h-12 text-sm placeholder:text-neutral-600"
                  required
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className={`w-full h-12 font-semibold ${
                isInvestor
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-neutral-400"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className={`font-medium ${
                isInvestor ? 'text-emerald-500' : 'text-blue-500'
              }`}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-black text-neutral-500 uppercase tracking-wide">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0a0a] border border-white/[0.08] rounded-lg hover:border-white/[0.15] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1818182,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0a0a] border border-white/[0.08] rounded-lg hover:border-white/[0.15] transition-colors">
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-neutral-500">
            <p>
              By continuing, you agree to Sports Folio's{' '}
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
