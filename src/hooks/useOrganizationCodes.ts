import { useState, useEffect } from 'react';
import { OrganizationCode } from '../types';
import * as organizationCodeService from '../services/organization-codes';
import { supabase } from '../lib/supabase';

export const useOrganizationCodes = () => {
  const [organizationCodes, setOrganizationCodes] = useState<OrganizationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizationCodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await organizationCodeService.getOrganizationCodes();
      setOrganizationCodes(data);
    } catch (err) {
      console.error('Error fetching organization codes:', err);
      setError('Failed to fetch organization codes');
    } finally {
      setLoading(false);
    }
  };

  const createOrganizationCode = async (
    code: string,
    organizationName: string,
    email: string,
    password: string
  ) => {
    try {
      setError(null);

      // Store current admin session
      const { data: { session: adminSession } } = await supabase.auth.getSession();
      if (!adminSession?.user) {
        throw new Error('Admin session not found');
      }

      // Validate password length
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // First validate the code doesn't already exist
      const existingCode = await organizationCodeService.getOrganizationByCode(code);
      if (existingCode) {
        throw new Error('This organization code is already in use');
      }

      // Create the organization code and auth entry
      const newCode = await organizationCodeService.createOrganizationCode(
        code,
        organizationName,
        email,
        // password // Pass the password to the service - part of the problem lmao, need to get rid of the 
      );

      // Then create the auth user with organization metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'organization',
            organization_code: code,
            organization_name: organizationName
          }
        }
      });

      if (authError) {
        // If auth fails, delete the organization code
        await organizationCodeService.deleteOrganizationCode(code);
        throw authError;
      }

      if (!authData.user) {
        await organizationCodeService.deleteOrganizationCode(code);
        throw new Error('Failed to create user account');
      }

      // Sign back in as admin using stored credentials
      const adminPassword = localStorage.getItem('adminPassword');
      if (!adminPassword) {
        throw new Error('Admin credentials not found');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminSession.user.email!,
        password: adminPassword
      });

      if (signInError) {
        throw new Error('Failed to re-authenticate as admin');
      }

      setOrganizationCodes(prev => [newCode, ...prev]);
      return newCode;
    } catch (err) {
      console.error('Error creating organization:', err);
      throw err;
    }
  };

  const deleteOrganizationCode = async (code: string): Promise<void> => {
    try {
      setError(null);
      
      // Delete the organization code - the service handles profile disassociation
      await organizationCodeService.deleteOrganizationCode(code);
      setOrganizationCodes(prev => prev.filter(c => c.code !== code));
    } catch (err) {
      console.error('Error deleting organization code:', err);
      throw err;
    }
  };

  const validateOrganizationCode = async (code: string, email: string): Promise<boolean> => {
    try {
      return await organizationCodeService.validateOrganizationCode(code, email);
    } catch (err) {
      console.error('Error validating organization code:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchOrganizationCodes();
  }, []);

  return {
    organizationCodes,
    loading,
    error,
    createOrganizationCode,
    deleteOrganizationCode,
    validateOrganizationCode,
    refreshOrganizationCodes: fetchOrganizationCodes
  };
};