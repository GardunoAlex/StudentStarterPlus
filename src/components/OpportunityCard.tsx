import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, GraduationCap, ExternalLink, Bookmark, BookmarkCheck, Edit, Trash2 } from 'lucide-react';
import { Opportunity } from '../types';
import { formatDate } from '../utils/formatters';
import { useBookmarks } from '../hooks/useBookmarks';
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../services/profiles';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onEdit?: (opportunity: Opportunity) => void;
  onDelete?: (id: string) => void;
  onClick?: (opportunity: Opportunity) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ 
  opportunity,
  onEdit,
  onDelete,
  onClick
}) => {
  const { bookmarks, toggleBookmark } = useBookmarks();
  const { user } = useAuth();
  const [canManagePost, setCanManagePost] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isBookmarked = bookmarks.includes(opportunity.id);

  // Check if the current user can manage this post
  useEffect(() => {
    const checkPermissions = async () => {
      if (user) {
        try {
          const profile = await getProfile(user.id);
          if (profile) {
            // Check if user is admin OR if user is organization owner of this post
            const isAdmin = profile.role === 'admin';
            const isOwner = profile.role === 'organization' && 
                          profile.organizationCode && 
                          opportunity.organizationCode && 
                          profile.organizationCode === opportunity.organizationCode;
            
            setCanManagePost(isAdmin || isOwner);
          }
        } catch (error) {
          console.error('Error checking permissions:', error);
          setCanManagePost(false);
        }
      } else {
        setCanManagePost(false);
      }
    };
    
    checkPermissions();
  }, [user, opportunity.organizationCode]);
  
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'mentorship': return 'bg-purple-50 text-purple-600';
      case 'program': return 'bg-indigo-50 text-indigo-600';
      case 'event': return 'bg-blue-50 text-blue-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await onDelete?.(opportunity.id);
      setShowDeleteConfirm(false);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-50 text-green-800 px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in';
      successMessage.textContent = 'Opportunity deleted successfully!';
      document.body.appendChild(successMessage);

      setTimeout(() => {
        successMessage.classList.add('animate-fade-out');
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 300);
      }, 3500);
    } catch (error) {
      console.error('Error deleting opportunity:', error);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.(opportunity);
  };

  return (
    <div 
      className="bg-white rounded-xl card-shadow overflow-hidden hover:translate-y-[-4px] transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative h-48">
        <img 
          src={opportunity.logo} 
          alt={opportunity.organization} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/60"></div>
        
        {canManagePost && (
          <div className="absolute top-4 right-4 flex space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(opportunity);
              }}
              className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
              aria-label="Edit opportunity"
            >
              <Edit className="h-5 w-5 text-indigo-600" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
              aria-label="Delete opportunity"
            >
              <Trash2 className="h-5 w-5 text-red-600" />
            </button>
          </div>
        )}
        
        {!canManagePost && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(opportunity.id);
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
            aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-5 w-5 text-indigo-600" />
            ) : (
              <Bookmark className="h-5 w-5 text-gray-600" />
            )}
          </button>
        )}
        
        <div className="absolute bottom-4 left-4 flex items-center space-x-2">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${getTypeColor(opportunity.type)}`}>
            {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{opportunity.title}</h3>
        <p className="text-indigo-600 font-medium mb-6">{opportunity.organization}</p>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-3 text-gray-400" />
            <span>Deadline: <span className="font-medium">{formatDate(opportunity.deadline)}</span></span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-3 text-gray-400" />
            <span>{opportunity.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <GraduationCap className="h-4 w-4 mr-3 text-gray-400" />
            <span>Min GPA: <span className="font-medium">{Number(opportunity.gpa).toFixed(1)}</span></span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {opportunity.classYears.slice(0, 3).map((year, index) => (
            <span key={index} className="text-sm bg-gray-50 text-gray-600 px-3 py-1 rounded-full">
              {year}
            </span>
          ))}
          {opportunity.classYears.length > 3 && (
            <span className="text-sm bg-gray-50 text-gray-600 px-3 py-1 rounded-full">
              +{opportunity.classYears.length - 3} more
            </span>
          )}
        </div>
        
        <a 
          href={opportunity.applicationLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-full block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
        >
          Apply Now <ExternalLink className="h-4 w-4 ml-2" />
        </a>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Opportunity</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{opportunity.title}"? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityCard;