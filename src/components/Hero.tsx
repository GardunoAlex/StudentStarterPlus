import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useOpportunities } from '../hooks/useOpportunities';
import { supabase } from '../lib/supabase';

interface HeroProps {
  firstName?: string;
  isOrganization?: boolean;
  organizationName?: string;
}

const Hero: React.FC<HeroProps> = ({ firstName, isOrganization, organizationName }) => {
  const { opportunities } = useOpportunities();
  const [organizationCount, setOrganizationCount] = useState(0);

  useEffect(() => {
    const fetchOrganizationCount = async () => {
      try {
        // Try multiple approaches to get the count
        console.log('Fetching organization count...');
        
        // First try with count
        const { count, error: countError } = await supabase
          .from('organization_codes')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.error('Error with count query:', countError);
          
          // Fallback: get all data and count manually
          const { data, error: dataError } = await supabase
            .from('organization_codes')
            .select('code');

          if (dataError) {
            console.error('Error with data query:', dataError);
            setOrganizationCount(0);
          } else {
            console.log('Organization count from data length:', data?.length || 0);
            setOrganizationCount(data?.length || 0);
          }
        } else {
          console.log('Organization count from count query:', count);
          setOrganizationCount(count || 0);
        }
      } catch (error) {
        console.error('Error fetching organization count:', error);
        setOrganizationCount(0);
      }
    };

    fetchOrganizationCount();

    // Set up real-time subscription to organization_codes table
    const subscription = supabase
      .channel('organization_codes_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'organization_codes' 
        }, 
        () => {
          console.log('Organization codes table changed, refetching count...');
          fetchOrganizationCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const opportunityCount = opportunities.length;

  return (
    <div className="relative bg-[#F7F8FA] py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {isOrganization ? (
              <>Welcome back, <span className="gradient-text">{organizationName}</span></>
            ) : firstName ? (
              <>Welcome back, <span className="gradient-text">{firstName}</span></>
            ) : (
              <>Find Your Next <span className="gradient-text">Opportunity</span></>
            )}
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            {isOrganization
              ? "Manage your opportunities and connect with talented students"
              : firstName
              ? "Here's what's new in your personalized opportunity feed"
              : "Discover internships, mentorships, and scholarships tailored for students like you."}
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for opportunities..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-sm"
            />
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <div className="bg-white rounded-xl p-6 card-shadow flex items-center space-x-4 min-w-[200px]">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                <span className="text-indigo-600 text-xl font-bold">{opportunityCount}</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Opportunities</h3>
                <p className="text-sm text-gray-500">Available Now</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 card-shadow flex items-center space-x-4 min-w-[200px]">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                <span className="text-indigo-600 text-xl font-bold">{organizationCount}</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Organizations</h3>
                <p className="text-sm text-gray-500">Posting Opportunities</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;