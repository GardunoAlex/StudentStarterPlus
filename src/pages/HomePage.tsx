import React, { useState } from 'react';
import { useOpportunities } from '../hooks/useOpportunities';
import OpportunityCard from '../components/OpportunityCard';
import OpportunityDetailModal from '../components/OpportunityDetailModal';
import Filters from '../components/Filters';
import { ClassYear, OpportunityType, Industry, Opportunity } from '../types';
import { Calendar, Users, Award } from 'lucide-react';
import CreateOpportunityModal from '../components/CreateOpportunityModal';

const HomePage: React.FC = () => {
  const { opportunities, loading, error, createOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities();
  const [searchTerm, setSearchTerm] = useState('');
  const [gpaFilter, setGpaFilter] = useState<number | null>(null);
  const [majorFilter, setMajorFilter] = useState<string | null>(null);
  const [classYearFilter, setClassYearFilter] = useState<ClassYear | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<OpportunityType | null>(null);
  const [industryFilter, setIndustryFilter] = useState<Industry | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [opportunityToEdit, setOpportunityToEdit] = useState<Opportunity | undefined>();
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isOrganization, setIsOrganization] = useState(false);
  
  const resetFilters = () => {
    setSearchTerm('');
    setGpaFilter(null);
    setMajorFilter(null);
    setClassYearFilter(null);
    setLocationFilter(null);
    setTypeFilter(null);
    setIndustryFilter(null);
  };
  
  const filtersApplied = !!(
    searchTerm || 
    gpaFilter || 
    majorFilter || 
    classYearFilter || 
    locationFilter || 
    typeFilter ||
    industryFilter
  );

  // Sort opportunities by deadline (most recent first)
  const sortedOpportunities = [...(opportunities || [])].sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );
  
  const filteredOpportunities = sortedOpportunities.filter((opportunity) => {
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
    
    return true;
  });

  const opportunityStats = {
    programs: (opportunities || []).filter(opp => opp.type === 'program').length,
    mentorships: (opportunities || []).filter(opp => opp.type === 'mentorship').length,
    events: (opportunities || []).filter(opp => opp.type === 'event').length,
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setOpportunityToEdit(opportunity);
    setIsCreateModalOpen(true);
  };

  const handleDeleteOpportunity = async (id: string) => {
    await deleteOpportunity(id);
    // No need to call refreshOpportunities since deleteOpportunity already updates state
  };

  const handleCreateOrUpdateOpportunity = async (opportunity: Omit<Opportunity, 'id'>) => {
    try {
      if (opportunityToEdit) {
        await updateOpportunity(opportunityToEdit.id, opportunity);
      } else {
        await createOpportunity(opportunity);
      }
      // Close modal and reset state
      setIsCreateModalOpen(false);
      setOpportunityToEdit(undefined);
    } catch (error) {
      console.error('Error saving opportunity:', error);
      throw error; // Re-throw so the modal can handle the error
    }
  };

  const handleOpportunityClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOpportunity(null);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setOpportunityToEdit(undefined);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">Loading opportunities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-600">Error loading opportunities: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Latest Opportunities</h2>
          <p className="text-gray-600">Discover new opportunities across all categories</p>
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
              isOrganization={isOrganization}
              onEdit={handleEditOpportunity}
              onDelete={handleDeleteOpportunity}
              onClick={handleOpportunityClick}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No opportunities found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your filters or search terms to find more opportunities.</p>
          <button
            onClick={resetFilters}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      <CreateOpportunityModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateOrUpdateOpportunity}
        opportunityToEdit={opportunityToEdit}
      />

      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />
    </div>
  );
};

export default HomePage;