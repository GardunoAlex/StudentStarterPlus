import React, { useState } from 'react';
import { X, User, Building2, Plus, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateOrganizationCode } from '../services/organization-codes';
import { supabase } from '../lib/supabase';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInSuccess: (type: 'student' | 'organization' | 'admin', code?: string) => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, onSignInSuccess }) => {
  const { signUp, signIn, resetPassword, error: authError } = useAuth();
  const [userType, setUserType] = useState<'student' | 'organization' | 'admin' | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPassword, setOrgPassword] = useState('');
  const [localAuthError, setLocalAuthError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    major: '',
    classYear: ''
  });

  if (!isOpen) return null;

  const handleAuthCodeSubmit = async () => {
    try {
      setLocalAuthError('');
      
      // Special case for admin
      if (authCode === '0000') {
        try {
          const { error: signInError } = await signIn(orgEmail, orgPassword);
          if (signInError) {
            setLocalAuthError('Invalid admin credentials');
            return;
          }
          localStorage.setItem('adminPassword', orgPassword);
          localStorage.setItem('adminSettings', JSON.stringify({ isAdmin: true }));
          onSignInSuccess('admin');
          return;
        } catch (err) {
          setLocalAuthError('Invalid admin credentials');
          return;
        }
      }

      // For sign up, just validate the code exists
      if (isSignUp) {
        const { data: orgCode, error: orgError } = await supabase
          .from('organization_codes')
          .select('*')
          .eq('code', authCode)
          .eq('email', orgEmail)
          .maybeSingle();

        if (orgError || !orgCode) {
          setLocalAuthError('Invalid organization code or email combination');
          return;
        }

        try {
          await signUp(orgEmail, orgPassword, 'organization', {
            organizationCode: authCode
          });
          onSignInSuccess('organization', authCode);
        } catch (err) {
          setLocalAuthError(err instanceof Error ? err.message : 'Failed to create account');
        }
      } else {
        // For sign in, validate credentials
        const { error: signInError } = await signIn(orgEmail, orgPassword);
        if (signInError) {
          setLocalAuthError('Invalid email or password');
          return;
        }
        onSignInSuccess('organization', authCode);
      }
    } catch (err) {
      setLocalAuthError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalAuthError('');

    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        setLocalAuthError('Passwords do not match');
        return;
      }

      try {
        await signUp(
          formData.email,
          formData.password,
          'student',
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            major: formData.major,
            classYear: formData.classYear
          }
        );
        onSignInSuccess('student');
      } catch (err) {
        setLocalAuthError(err instanceof Error ? err.message : 'Failed to sign up');
      }
    } else {
      try {
        const { error: signInError } = await signIn(formData.email, formData.password);
        if (signInError) {
          throw signInError;
        }
        onSignInSuccess('student');
      } catch (err) {
        setLocalAuthError('Invalid credentials. Please check your email and password.');
      }
    }
  };

  const handlePasswordReset = async () => {
    try {
      const email = userType === 'student' ? formData.email : orgEmail;
      if (!email) {
        setLocalAuthError('Please enter your email address');
        return;
      }
      await resetPassword(email);
      setResetEmailSent(true);
      setLocalAuthError('');
    } catch (err) {
      setLocalAuthError('Failed to send password reset email. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderUserTypeSelection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Account Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setUserType('student')}
          className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-600 transition-colors"
        >
          <User className="h-8 w-8 text-indigo-600 mb-3" />
          <span className="text-lg font-medium text-gray-900">Student</span>
          <span className="text-sm text-gray-500 text-center mt-2">
            Access student opportunities and resources
          </span>
        </button>

        <button
          onClick={() => setUserType('organization')}
          className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-600 transition-colors"
        >
          <Building2 className="h-8 w-8 text-indigo-600 mb-3" />
          <span className="text-lg font-medium text-gray-900">Organization</span>
          <span className="text-sm text-gray-500 text-center mt-2">
            Post and manage opportunities
          </span>
        </button>
      </div>
    </div>
  );

  const renderPasswordReset = () => (
    <div className="space-y-4">
      <button
        onClick={() => {
          setIsResettingPassword(false);
          setResetEmailSent(false);
        }}
        className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to sign in
      </button>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reset Password</h2>
      
      {resetEmailSent ? (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg">
          Password reset instructions have been sent to your email address.
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
          
          <div>
            <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="resetEmail"
              value={userType === 'student' ? formData.email : orgEmail}
              onChange={(e) => {
                if (userType === 'student') {
                  handleChange({
                    target: { name: 'email', value: e.target.value }
                  } as React.ChangeEvent<HTMLInputElement>);
                } else {
                  setOrgEmail(e.target.value);
                }
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          {localAuthError && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg">
              {localAuthError}
            </div>
          )}

          <button
            onClick={handlePasswordReset}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Reset Password
          </button>
        </>
      )}
    </div>
  );

  const renderStudentForm = () => (
    <div className="space-y-4">
      <button
        onClick={() => setUserType(null)}
        className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to account type
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isSignUp ? 'Create Student Account' : 'Sign In as Student'}
      </h2>

      <form onSubmit={handleStudentSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            required
          />
        </div>

        {isSignUp && (
          <>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">
                  Major
                </label>
                <input
                  type="text"
                  id="major"
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="classYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Class Year
                </label>
                <input
                  type="text"
                  id="classYear"
                  name="classYear"
                  value={formData.classYear}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </>
        )}

        {localAuthError && (
          <div className="p-4 bg-red-50 text-red-800 rounded-lg">
            {localAuthError}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>

        {!isSignUp && !isResettingPassword && (
          <button
            type="button"
            onClick={() => setIsResettingPassword(true)}
            className="w-full text-sm text-indigo-600 hover:text-indigo-700"
          >
            Forgot password?
          </button>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderOrganizationForm = () => (
    <div className="space-y-4">
      <button
        onClick={() => setUserType(null)}
        className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to account type
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isSignUp ? 'Create Organization Account' : 'Sign In as Organization'}
      </h2>

      <div>
        <label htmlFor="authCode" className="block text-sm font-medium text-gray-700 mb-1">
          Organization Code
        </label>
        <input
          type="text"
          id="authCode"
          value={authCode}
          onChange={(e) => setAuthCode(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="orgEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="orgEmail"
          value={orgEmail}
          onChange={(e) => setOrgEmail(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="orgPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          id="orgPassword"
          value={orgPassword}
          onChange={(e) => setOrgPassword(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          required
        />
      </div>

      {localAuthError && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          {localAuthError}
        </div>
      )}

      <button
        onClick={handleAuthCodeSubmit}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </button>

      {!isSignUp && !isResettingPassword && (
        <button
          type="button"
          onClick={() => setIsResettingPassword(true)}
          className="w-full text-sm text-indigo-600 hover:text-indigo-700"
        >
          Forgot password?
        </button>
      )}

      <div className="text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {isResettingPassword ? (
          renderPasswordReset()
        ) : userType === null ? (
          renderUserTypeSelection()
        ) : userType === 'student' ? (
          renderStudentForm()
        ) : (
          renderOrganizationForm()
        )}
      </div>
    </div>
  );
};

export default SignInModal;