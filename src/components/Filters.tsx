import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { getAllMajors, getAllLocations, getAllClassYears, getAllTypes, getAllIndustries } from '../data/opportunities';
import { ClassYear, OpportunityType, Industry } from '../types';

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  gpaFilter: number | null;
  setGpaFilter: (gpa: number | null) => void;
  majorFilter: string | null;
  setMajorFilter: (major: string | null) => void;
  classYearFilter: ClassYear | null;
  setClassYearFilter: (year: ClassYear | null) => void;
  locationFilter: string | null;
  setLocationFilter: (location: string | null) => void;
  typeFilter: OpportunityType | null;
  setTypeFilter: (type: OpportunityType | null) => void;
  industryFilter: Industry | null;
  setIndustryFilter: (industry: Industry | null) => void;
  resetFilters: () => void;
  filtersApplied: boolean;
}

const Filters: React.FC<FiltersProps> = ({
  searchTerm,
  setSearchTerm,
  gpaFilter,
  setGpaFilter,
  majorFilter,
  setMajorFilter,
  classYearFilter,
  setClassYearFilter,
  locationFilter,
  setLocationFilter,
  typeFilter,
  setTypeFilter,
  industryFilter,
  setIndustryFilter,
  resetFilters,
  filtersApplied
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  const allMajors = getAllMajors();
  const allLocations = getAllLocations();
  const allClassYears = getAllClassYears();
  const allTypes = getAllTypes();
  const allIndustries = getAllIndustries();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search opportunities..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-6 py-3 border border-gray-200 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-colors"
        >
          <Filter className="h-5 w-5 mr-2" />
          <span>Filters</span>
          {filtersApplied && (
            <span className="ml-2 w-2 h-2 rounded-full bg-indigo-600"></span>
          )}
        </button>
        
        {filtersApplied && (
          <button
            onClick={resetFilters}
            className="flex items-center px-6 py-3 border border-gray-200 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-colors"
          >
            <X className="h-5 w-5 mr-2" />
            <span>Clear All</span>
          </button>
        )}
      </div>
      
      {showFilters && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum GPA
            </label>
            <select
              value={gpaFilter?.toString() || ''}
              onChange={(e) => setGpaFilter(e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full rounded-xl border border-gray-200 py-3 px-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">All GPAs</option>
              {[2.0, 2.5, 3.0, 3.5, 4.0].map((gpa) => (
                <option key={gpa} value={gpa}>{gpa.toFixed(1)}+</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              value={industryFilter || ''}
              onChange={(e) => setIndustryFilter(e.target.value as Industry || null)}
              className="w-full rounded-xl border border-gray-200 py-3 px-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">All Industries</option>
              {allIndustries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              value={locationFilter || ''}
              onChange={(e) => setLocationFilter(e.target.value || null)}
              className="w-full rounded-xl border border-gray-200 py-3 px-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">All Locations</option>
              {allLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opportunity Type
            </label>
            <select
              value={typeFilter || ''}
              onChange={(e) => setTypeFilter(e.target.value as OpportunityType || null)}
              className="w-full rounded-xl border border-gray-200 py-3 px-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">All Types</option>
              {allTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Major
            </label>
            <select
              value={majorFilter || ''}
              onChange={(e) => setMajorFilter(e.target.value || null)}
              className="w-full rounded-xl border border-gray-200 py-3 px-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">All Majors</option>
              {allMajors.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Year
            </label>
            <select
              value={classYearFilter || ''}
              onChange={(e) => setClassYearFilter(e.target.value as ClassYear || null)}
              className="w-full rounded-xl border border-gray-200 py-3 px-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">All Years</option>
              {allClassYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;