import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import type { Opportunity } from '../types';

type DBOpportunity = Database['public']['Tables']['opportunities']['Row'];

const mapToOpportunity = (dbOpp: DBOpportunity): Opportunity => ({
  id: dbOpp.id,
  title: dbOpp.title,
  organization: dbOpp.organization,
  description: dbOpp.description,
  deadline: dbOpp.deadline,
  gpa: Number(dbOpp.gpa),
  majors: dbOpp.majors,
  classYears: dbOpp.class_years,
  location: dbOpp.location,
  type: dbOpp.type as Opportunity['type'],
  industry: dbOpp.industry as Opportunity['industry'],
  applicationLink: dbOpp.application_link,
  logo: dbOpp.logo,
  organizationCode: dbOpp.organization_code || undefined
});

export const getOpportunities = async (): Promise<Opportunity[]> => {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching opportunities:', error);
    throw error;
  }
  
  return (data || []).map(mapToOpportunity);
};

export const getOpportunitiesByOrganization = async (organizationCode: string): Promise<Opportunity[]> => {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('organization_code', organizationCode)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching organization opportunities:', error);
    throw error;
  }
  
  return (data || []).map(mapToOpportunity);
};

export const createOpportunity = async (opportunity: Omit<Opportunity, 'id'>): Promise<Opportunity> => {
  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      title: opportunity.title,
      organization: opportunity.organization,
      description: opportunity.description,
      deadline: opportunity.deadline,
      gpa: opportunity.gpa,
      majors: opportunity.majors,
      class_years: opportunity.classYears,
      location: opportunity.location,
      type: opportunity.type,
      industry: opportunity.industry,
      application_link: opportunity.applicationLink,
      logo: opportunity.logo,
      organization_code: opportunity.organizationCode
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating opportunity:', error);
    throw error;
  }

  return mapToOpportunity(data);
};

export const updateOpportunity = async (id: string, opportunity: Partial<Omit<Opportunity, 'id'>>): Promise<Opportunity> => {
  // First, get the current opportunity to preserve the organization_code
  const { data: currentOpp, error: fetchError } = await supabase
    .from('opportunities')
    .select('organization_code')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching current opportunity:', fetchError);
    throw fetchError;
  }

  const updateData: any = {
    organization_code: currentOpp.organization_code // Always include the organization_code
  };
  
  if (opportunity.title) updateData.title = opportunity.title;
  if (opportunity.organization) updateData.organization = opportunity.organization;
  if (opportunity.description) updateData.description = opportunity.description;
  if (opportunity.deadline) updateData.deadline = opportunity.deadline;
  if (opportunity.gpa) updateData.gpa = opportunity.gpa;
  if (opportunity.majors) updateData.majors = opportunity.majors;
  if (opportunity.classYears) updateData.class_years = opportunity.classYears;
  if (opportunity.location) updateData.location = opportunity.location;
  if (opportunity.type) updateData.type = opportunity.type;
  if (opportunity.industry) updateData.industry = opportunity.industry;
  if (opportunity.applicationLink) updateData.application_link = opportunity.applicationLink;
  if (opportunity.logo) updateData.logo = opportunity.logo;

  const { data, error } = await supabase
    .from('opportunities')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating opportunity:', error);
    throw error;
  }

  return mapToOpportunity(data);
};

export const deleteOpportunity = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting opportunity:', error);
    throw error;
  }
};