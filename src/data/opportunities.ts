// This file now only provides helper functions for static data
// Actual opportunity data comes from the database

export const getAllMajors = (): string[] => [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Biomedical Engineering',
  'Pre-Med',
  'Health Sciences',
  'Nursing',
  'Political Science',
  'Sociology',
  'Social Work',
  'Public Policy',
  'Finance',
  'Economics',
  'Mathematics',
  'Business Administration',
  'Engineering',
  'Physics',
  'Environmental Science',
  'Biology',
  'Ecology',
  'Geography',
  'Fine Arts',
  'Music',
  'Theater',
  'Film Studies',
  'Aerospace Engineering',
  'Mechanical Engineering',
  'Biotechnology',
  'Data Science',
  'All Majors'
].sort();

export const getAllLocations = (): string[] => [
  'Remote',
  'San Francisco, CA',
  'New York, NY',
  'Boston, MA',
  'Seattle, WA',
  'Los Angeles, CA',
  'Chicago, IL',
  'Austin, TX',
  'Washington, DC',
  'Portland, OR',
  'Houston, TX',
  'San Diego, CA'
].sort();

export const getAllClassYears = (): string[] => [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate'
].sort();

export const getAllTypes = (): string[] => [
  'mentorship',
  'program',
  'event'
].sort();

export const getAllIndustries = (): string[] => [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Engineering',
  'Environmental',
  'Arts & Media',
  'Social Impact',
  'Business',
  'Research'
].sort();