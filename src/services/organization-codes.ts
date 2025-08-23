import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import type { OrganizationCode } from '../types';

type DBOrganizationCode = Database['public']['Tables']['organization_codes']['Row'];

const mapToOrganizationCode = (dbCode: DBOrganizationCode): OrganizationCode => ({
  code: dbCode.code,
  organizationName: dbCode.organization_name,
  email: dbCode.email,
  createdAt: dbCode.created_at
});

export const getOrganizationCodes = async (): Promise<OrganizationCode[]> => {
  const { data, error } = await supabase
    .from('organization_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching organization codes:', error);
    throw error;
  }
  
  return (data || []).map(mapToOrganizationCode);
};

export const getOrganizationByCode = async (code: string): Promise<OrganizationCode | null> => {
  const { data, error } = await supabase
    .from('organization_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    console.error('Error fetching organization by code:', error);
    throw error;
  }
  
  return data ? mapToOrganizationCode(data) : null;
};

export const validateOrganizationCode = async (code: string, email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('organization_codes')
      .select('*')
      .eq('code', code)
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error validating organization code:', error);
    return false;
  }
};

export const updateOrganizationName = async (code: string, newName: string): Promise<OrganizationCode | null> => {
  const { data, error } = await supabase
    .from('organization_codes')
    .update({ organization_name: newName })
    .eq('code', code)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating organization name:', error);
    throw error;
  }
  
  return data ? mapToOrganizationCode(data) : null;
};

export const createOrganizationCode = async (
  code: string,
  organizationName: string,
  email: string
): Promise<OrganizationCode> => {
  const { data: orgCode, error: orgError } = await supabase
    .from('organization_codes')
    .insert({
      code,
      organization_name: organizationName,
      email
    })
    .select()
    .single();

  if (orgError) {
    console.error('Error creating organization code:', orgError);
    throw orgError;
  }
  
  return mapToOrganizationCode(orgCode);
};

export const deleteOrganizationCode = async (code: string): Promise<void> => {
  try {
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authentication session found');
    }

    // Call the Edge Function to handle the deletion
    const { data, error } = await supabase.functions.invoke('delete-organization', {
      body: { code },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Error calling delete-organization function:', error);
      
      // Extract specific error message from the Edge Function response
      let errorMessage = 'Failed to delete organization';
      
      if (error.context?.body) {
        try {
          const errorBody = typeof error.context.body === 'string' 
            ? JSON.parse(error.context.body) 
            : error.context.body;
          
          if (errorBody.error) {
            errorMessage = errorBody.error;
          } else if (errorBody.message) {
            errorMessage = errorBody.message;
          }
        } catch (parseError) {
          // If we can't parse the error body, check if it's already a string
          if (typeof error.context.body === 'string') {
            errorMessage = error.context.body;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    console.log(`Successfully deleted organization code: ${code}`);
  } catch (error) {
    console.error('Error in deleteOrganizationCode:', error);
    throw error;
  }
};