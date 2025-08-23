import React, { useState } from 'react';
import { useOpportunities } from '../hooks/useOpportunities';
import OpportunityCard from '../components/OpportunityCard';
import Filters from '../components/Filters';
import { ClassYear, OpportunityType, Industry } from '../types';

const EventsPage: React.FC = () => {
  const { opportunities, loading, error } = useOpportunities();
  const [searchTerm, setSearchTerm] = useState('');
  const [gpaFilter, setGpaFilter] = useState<number | null>(null);
  const [majorFilter, setMajorFilter] = useState<string | null>(null);
  const [classYearFilter, setClassYearFilter] = useState<ClassYear | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [industryFilter, setIndustryFilter] = useState<Industry | null>(null);
  
  const resetFilters = () => {
    setSearchTerm('');
    setGpaFilter(null);
    setMajorFilter(null);
    setClassYearFilter(null);
    setLocationFilter(null);
    setIndustryFilter(null);
  };
  
  const filtersApplied = !!(
    searchTerm || 
    gpaFilter || 
    majorFilter || 
    classYearFilter || 
    locationFilter || 
    industryFilter
  );
  
  const eventOpportunities = (opportunities || []).filter(opp => opp.type === 'event');
  
  const filteredOpportunities = eventOpportunities.filter((opportunity) => {
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
    
    if (industryFilter !== null && opportunity.industry !== industryFilter) {
      return false;
    }
    
    return true;
  });

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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Events</h2>
          <p className="text-gray-600">Join industry events and expand your network</p>
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
        typeFilter={null}
        setTypeFilter={() => {}}
        industryFilter={industryFilter}
        setIndustryFilter={setIndustryFilter}
        resetFilters={resetFilters}
        filtersApplied={filtersApplied}
      />
      
      {filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your filters or search terms to find more opportunities.</p>
          <button
            onClick={resetFilters}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default EventsPage;