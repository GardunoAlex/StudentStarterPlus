export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  description: string;
  deadline: string;
  gpa: number;
  majors: string[];
  classYears: string[];
  location: string;
  type: OpportunityType;
  industry: Industry;
  applicationLink: string;
  logo: string;
  organizationCode?: string;
}

export interface OrganizationCode {
  code: string;
  organizationName: string;
  email: string;
  createdAt: string;
}

export type ClassYear = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';
export type OpportunityType = 'mentorship' | 'program' | 'event';
export type Industry = 
  | 'Technology'
  | 'Healthcare'
  | 'Finance'
  | 'Education'
  | 'Engineering'
  | 'Environmental'
  | 'Arts & Media'
  | 'Social Impact'
  | 'Business'
  | 'Research';