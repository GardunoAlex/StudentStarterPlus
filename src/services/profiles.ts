import { supabase } from '../lib/supabase';
import { UserRole } from '../hooks/useAuth';

interface Profile {
  id: string;
  email: string;
  role: UserRole;
  organizationCode?: string;
  firstName?: string;
  lastName?: string;
  major?: string;
  classYear?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const createProfile = async (
  userId: string,
  email: string,
  role: UserRole,
  profileData: {
    organizationCode?: string;
    organizationName?: string;
    firstName?: string;
    lastName?: string;
    major?: string;
    classYear?: string;
  }
): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{
      id: userId,
      email,
      role,
      organization_code: profileData.organizationCode,
      organization_name: profileData.organizationName,
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      major: profileData.major,
      class_year: profileData.classYear
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    role: data.role as UserRole,
    organizationCode: data.organization_code,
    firstName: data.first_name,
    lastName: data.last_name,
    major: data.major,
    classYear: data.class_year,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;

  if (!data) return null;

  // Map database column names to frontend property names
  return {
    id: data.id,
    email: data.email,
    role: data.role as UserRole,
    organizationCode: data.organization_code,
    firstName: data.first_name,
    lastName: data.last_name,
    major: data.major,
    classYear: data.class_year,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const updateProfile = async (userId: string, profile: Partial<Profile>): Promise<Profile> => {
  // Map frontend property names to database column names
  const { data, error } = await supabase
    .from('profiles')
    .update({
      first_name: profile.firstName,
      last_name: profile.lastName,
      major: profile.major,
      class_year: profile.classYear,
      avatar_url: profile.avatarUrl,
      organization_code: profile.organizationCode
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  // Map the response back to frontend property names
  return {
    id: data.id,
    email: data.email,
    role: data.role as UserRole,
    organizationCode: data.organization_code,
    firstName: data.first_name,
    lastName: data.last_name,
    major: data.major,
    classYear: data.class_year,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const disassociateProfilesFromOrganization = async (organizationCode: string): Promise<number> => {
  // First, count how many profiles are currently associated with this organization
  const { data: initialProfiles, error: countError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('organization_code', organizationCode);

  if (countError) {
    console.error('Error counting profiles associated with organization:', countError);
    throw new Error(`Failed to count profiles for organization ${organizationCode}: ${countError.message}`);
  }

  const initialCount = initialProfiles?.length || 0;
  console.log(`Found ${initialCount} profiles associated with organization ${organizationCode}`);

  if (initialCount === 0) {
    console.log('No profiles found to disassociate');
    return 0;
  }

  // Attempt to update the profiles
  const { data, error } = await supabase
    .from('profiles')
    .update({
      organization_code: null,
      role: 'student',
      organization_name: null
    })
    .eq('organization_code', organizationCode)
    .select();

  if (error) {
    console.error('Error disassociating profiles from organization:', error);
    throw new Error(`Failed to disassociate profiles from organization ${organizationCode}: ${error.message}`);
  }

  const updatedCount = data?.length || 0;
  console.log(`Successfully updated ${updatedCount} out of ${initialCount} profiles for organization ${organizationCode}`);

  // Check if we were able to update all the profiles we found initially
  if (updatedCount < initialCount) {
    const profileDetails = initialProfiles
      .map(p => `${p.email} (${p.role})`)
      .join(', ');
    
    throw new Error(
      `Unable to disassociate all profiles from organization "${organizationCode}". ` +
      `Found ${initialCount} profiles but only updated ${updatedCount}. ` +
      `This is likely due to insufficient permissions or Row Level Security policies preventing updates to some user profiles. ` +
      `Affected profiles: ${profileDetails}. ` +
      `Please ensure you have admin privileges or contact your system administrator to remove these profile associations before deleting the organization.`
    );
  }

  return updatedCount;
};