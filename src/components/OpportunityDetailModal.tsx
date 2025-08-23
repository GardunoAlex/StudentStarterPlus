import React from 'react';
import { X, Calendar, MapPin, GraduationCap, ExternalLink, Users, Award, Building2 } from 'lucide-react';
import { Opportunity } from '../types';
import { formatDate } from '../utils/formatters';

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
}

const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opportunity,
  isOpen,
  onClose
}) => {
  if (!isOpen || !opportunity) return null;

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'mentorship': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'program': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'event': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'mentorship': return <Users className="h-5 w-5" />;
      case 'program': return <Award className="h-5 w-5" />;
      case 'event': return <Calendar className="h-5 w-5" />;
      default: return <Building2 className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative">
          <div className="h-80 overflow-hidden">
            <img 
              src={opportunity.logo} 
              alt={opportunity.organization}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
          </div>
          
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border ${getTypeColor(opportunity.type)}`}>
                {getTypeIcon(opportunity.type)}
                <span>{opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}</span>
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/90 text-gray-800 border border-white/20">
                {opportunity.industry}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{opportunity.title}</h1>
            <p className="text-xl text-white/90 font-medium">{opportunity.organization}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-320px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Opportunity</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {opportunity.description}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Requirements & Eligibility</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2 text-indigo-600" />
                      Academic Requirements
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Minimum GPA:</span> {Number(opportunity.gpa).toFixed(1)}
                      </p>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Eligible Class Years:</p>
                        <div className="flex flex-wrap gap-1">
                          {opportunity.classYears.map((year, index) => (
                            <span key={index} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                              {year}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Award className="h-5 w-5 mr-2 text-indigo-600" />
                      Field of Study
                    </h4>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Eligible Majors:</p>
                      <div className="flex flex-wrap gap-1">
                        {opportunity.majors.slice(0, 6).map((major, index) => (
                          <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {major}
                          </span>
                        ))}
                        {opportunity.majors.length > 6 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            +{opportunity.majors.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Details */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Key Details</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Application Deadline</p>
                      <p className="text-sm text-gray-600">{formatDate(opportunity.deadline)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">{opportunity.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Building2 className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Industry</p>
                      <p className="text-sm text-gray-600">{opportunity.industry}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Button */}
              <div className="bg-white border-2 border-indigo-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ready to Apply?</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Click the button below to visit the application page and submit your application.
                </p>
                <a 
                  href={opportunity.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  Apply Now <ExternalLink className="h-5 w-5 ml-2" />
                </a>
              </div>

              {/* All Majors List (if many) */}
              {opportunity.majors.length > 6 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">All Eligible Majors</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {opportunity.majors.map((major, index) => (
                      <div key={index} className="text-sm text-gray-700 py-1 border-b border-gray-200 last:border-b-0">
                        {major}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailModal;