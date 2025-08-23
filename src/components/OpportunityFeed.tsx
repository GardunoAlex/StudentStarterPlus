import React, { useState } from 'react';
import OpportunityCard from './OpportunityCard';
import Filters from './Filters';
import { ClassYear, OpportunityType, Industry } from '../types';
import { Calendar, Users, Award, BookmarkCheck } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import { useOpportunities } from '../hooks/useOpportunities';
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../services/profiles';
import CreateOpportunityModal from './CreateOpportunityModal';

const OpportunityFeed: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gpaFilter, setGpaFilter] = useState<number | null>(null);
  const [majorFilter, setMajorFilter] = useState<string | null>(null);
  const [classYearFilter, setClassYearFilter] = useState<ClassYear | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<OpportunityType | null>(null);
  const [industryFilter, setIndustryFilter] = useState<Industry | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { bookmarks } = useBookmarks();
  const { opportunities, loading, error, createOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities();
  const { user } = useAuth();
  const [isOrganization, setIsOrganization] = useState(false);
  const [organizationCode, setOrganizationCode] = useState<string | null>(null);
  
  // Fetch user profile to determine if they're an organization
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const profile = await getProfile(user.id);
          if (profile) {
            setIsOrganization(profile.role === 'organization');
            setOrganizationCode(profile.organizationCode || null);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };
    fetchProfile();
  }, [user]);
  
  const resetFilters = () => {
    setSearchTerm('');
    setGpaFilter(null);
    setMajorFilter(null);
    setClassYearFilter(null);
    setLocationFilter(null);
    setTypeFilter(null);
    setIndustryFilter(null);
    setShowBookmarked(false);
  };
  
  const filtersApplied = !!(
    searchTerm || 
    gpaFilter || 
    majorFilter || 
    classYearFilter || 
    locationFilter || 
    typeFilter || 
    industryFilter || 
    showBookmarked
  );

  // Filter opportunities based on organization and other criteria
  const filteredOpportunities = opportunities.filter((opportunity) => {
    // For organization users, only show their opportunities
    if (isOrganization && organizationCode) {
      if (opportunity.organizationCode !== organizationCode) {
        return false;
      }
    }

    if (searchTerm && !opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !opportunity.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !opportunity.organization.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (gpaFilter !== null && opportunity.gpa < gpaFilter) {
      return false;
    }
    
    if (majorFilter !== null && !opportunity.majors.includes(majorFilter) && !opportunity.majors.includes('All Majors')) {
      return false;
    }
    
    if (classYearFilter !== null && !opportunity.classYears.includes(classYearFilter)) {
      return false;
    }
    
    if (locationFilter !== null && opportunity.location !== locationFilter) {
      return false;
    }
    
    if (typeFilter !== null && opportunity.type !== typeFilter) {
      return false;
    }
    
    if (industryFilter !== null && opportunity.industry !== industryFilter) {
      return false;
    }
    
    if (showBookmarked && !bookmarks.includes(opportunity.id)) {
      return false;
    }
    
    return true;
  });

  const handleCreateOpportunity = async (opportunityData: any) => {
    try {
      await createOpportunity(opportunityData);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  };

  const handleEditOpportunity = (opportunity: any) => {
    // Handle edit functionality
    console.log('Edit opportunity:', opportunity);
  };

  const handleDeleteOpportunity = async (id: string) => {
    try {
      await deleteOpportunity(id);
    } catch (error) {
      console.error('Error deleting opportunity:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-xl text-red-800">
        <p>Error loading opportunities. Please try again later.</p>
      </div>
    );
  }

  const opportunityStats = {
    programs: filteredOpportunities.filter(opp => opp.type === 'program').length,
    mentorships: filteredOpportunities.filter(opp => opp.type === 'mentorship').length,
    events: filteredOpportunities.filter(opp => opp.type === 'event').length,
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isOrganization ? 'Your Opportunities' : 'Browse Opportunities'}
          </h2>
          <p className="text-gray-600">
            {isOrganization 
              ? 'Manage and track your posted opportunities' 
              : 'Find and apply to opportunities that match your interests'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          {isOrganization && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Create Opportunity
            </button>
          )}
          
          {!isOrganization && (
            <button
              onClick={() => setShowBookmarked(!showBookmarked)}
              className={`flex items-center px-6 py-3 rounded-xl transition-colors ${
                showBookmarked 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-600 hover:text-indigo-600'
              }`}
            >
              <BookmarkCheck className="h-5 w-5 mr-2" />
              <span>Saved</span>
              {bookmarks.length > 0 && (
                <span className={`ml-2 text-sm px-2 py-0.5 rounded-full ${
                  showBookmarked ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
                }`}>
                  {bookmarks.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 card-shadow flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
            <Award className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Programs</h3>
            <p className="text-2xl font-bold text-purple-600">{opportunityStats.programs}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 card-shadow flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Mentorships</h3>
            <p className="text-2xl font-bold text-indigo-600">{opportunityStats.mentorships}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 card-shadow flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Events</h3>
            <p className="text-2xl font-bold text-blue-600">{opportunityStats.events}</p>
          </div>
        </div>
      </div>

      <Filters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        gpaFilter={gpaFilter}
        setGpaFilter={setGpaFilter}
        majorFilter={majorFilter}
        setMajorFilter={setMajorFilter}
        classYearFilter={classYearFilter}
        setClassYearFilter={setClassYearFilter}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        industryFilter={industryFilter}
        setIndustryFilter={setIndustryFilter}
        resetFilters={resetFilters}
        filtersApplied={filtersApplied}
      />
      
      {filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard 
              key={opportunity.id} 
              opportunity={opportunity}
              onEdit={handleEditOpportunity}
              onDelete={handleDeleteOpportunity}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No opportunities found</h3>
          <p className="text-gray-600 mb-6">
            {isOrganization 
              ? "You haven't posted any opportunities yet." 
              : "Try adjusting your filters or search terms to find more opportunities."}
          </p>
          <button
            onClick={isOrganization ? () => setIsCreateModalOpen(true) : resetFilters}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            {isOrganization ? 'Create New Opportunity' : 'Reset Filters'}
          </button>
        </div>
      )}

      <CreateOpportunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOpportunity}
      />
    </div>
  );
};

export default OpportunityFeed;