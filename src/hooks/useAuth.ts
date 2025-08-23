import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { validateOrganizationCode } from '../services/organization-codes';

export type UserRole = 'student' | 'organization' | 'admin';

interface AuthUser extends User {
  role?: UserRole;
  organizationCode?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userData = {
            ...session.user,
            role: session.user.user_metadata.role,
            organizationCode: session.user.user_metadata.organization_code
          };
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get session');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userData = {
          ...session.user,
          role: session.user.user_metadata.role,
          organizationCode: session.user.user_metadata.organization_code
        };
        setUser(userData);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    role: UserRole = 'student',
    profileData?: {
      firstName?: string;
      lastName?: string;
      major?: string;
      classYear?: string;
      organizationCode?: string;
      organizationName?: string;
    }
  ) => {
    try {
      // For organization signups, validate the code first
      if (role === 'organization' && profileData?.organizationCode) {
        const isValid = await validateOrganizationCode(
          profileData.organizationCode,
          email
        );
        if (!isValid) {
          throw new Error('Invalid organization code or email');
        }
      }

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            first_name: profileData?.firstName,
            last_name: profileData?.lastName,
            major: profileData?.major,
            class_year: profileData?.classYear,
            organization_code: profileData?.organizationCode,
            organization_name: profileData?.organizationName
          }
        }
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset password email');
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword
  };
};