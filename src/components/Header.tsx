import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Shield, User, LogOut, Settings, FileText } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import SignInModal from './SignInModal';
import CreateOpportunityModal from './CreateOpportunityModal';
import OrganizationCodesModal from './OrganizationCodesModal';
import ProfileEditModal from './ProfileEditModal';
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../services/profiles';
import { getOpportunitiesByOrganization } from '../services/opportunities';
import { getOrganizationByCode } from '../services/organization-codes';

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onCreateOpportunity: (opportunityData: any) => Promise<void>;
  organizationCode?: string;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, onCreateOpportunity, organizationCode: propOrganizationCode }) => {
  const { bookmarks } = useBookmarks();
  const { user, signOut } = useAuth();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isOrganizationCodesModalOpen, setIsOrganizationCodesModalOpen] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [isOrganization, setIsOrganization] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [organizationCode, setOrganizationCode] = useState<string>('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [postCount, setPostCount] = useState(0);
  const [profile, setProfile] = useState<{
    firstName?: string;
    lastName?: string;
    major?: string;
    classYear?: string;
    avatarUrl?: string;
  }>({});

  const refreshPostCount = async () => {
    if (organizationCode) {
      try {
        const opportunities = await getOpportunitiesByOrganization(organizationCode);
        setPostCount(opportunities.length);
      } catch (error) {
        console.error('Error refreshing post count:', error);
      }
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const profileData = await getProfile(user.id);
          if (profileData) {
            setProfile({
              firstName: profileData.firstName || '',
              lastName: profileData.lastName || '',
              major: profileData.major || '',
              classYear: profileData.classYear || '',
              avatarUrl: profileData.avatarUrl || ''
            });
            setIsOrganization(profileData.role === 'organization');
            setIsAdmin(profileData.role === 'admin');
            
            if (profileData.role === 'organization' && profileData.organizationCode) {
              setOrganizationCode(profileData.organizationCode);
              
              // Fetch organization details
              const orgData = await getOrganizationByCode(profileData.organizationCode);
              if (orgData) {
                setOrganizationName(orgData.organizationName);
              }
              
              // Fetch post count
              const opportunities = await getOpportunitiesByOrganization(profileData.organizationCode);
              setPostCount(opportunities.length);
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setProfile({});
        setIsOrganization(false);
        setIsAdmin(false);
        setOrganizationCode('');
        setOrganizationName('');
        setPostCount(0);
      }
    };

    fetchProfile();
  }, [user]);

  // Use prop organization code if provided, otherwise use state
  const effectiveOrganizationCode = propOrganizationCode || organizationCode;

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSignInSuccess = async (type: 'student' | 'organization' | 'admin', code?: string) => {
    setIsSignInModalOpen(false);
    if (type === 'organization') {
      setIsOrganization(true);
      setIsAdmin(false);
      if (code) {
        setOrganizationCode(code);
        // Fetch opportunities for this organization
        const opportunities = await getOpportunitiesByOrganization(code);
        setPostCount(opportunities.length);
      }
    } else if (type === 'admin') {
      setIsAdmin(true);
      setIsOrganization(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setProfileDropdownOpen(false);
      setIsOrganization(false);
      setIsAdmin(false);
      setOrganizationCode('');
      handleNavigation('home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAdminSignOut = async () => {
    try {
      await signOut();
      setProfileDropdownOpen(false);
      setIsOrganization(false);
      setIsAdmin(false);
      setOrganizationCode('');
      handleNavigation('home');
      localStorage.removeItem('adminSettings');
    } catch (error) {
      console.error('Error signing out admin:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (user) {
      const updatedProfile = await getProfile(user.id);
      if (updatedProfile) {
        setProfile({
          firstName: updatedProfile.firstName || '',
          lastName: updatedProfile.lastName || '',
          major: updatedProfile.major || '',
          classYear: updatedProfile.classYear || '',
          avatarUrl: updatedProfile.avatarUrl || ''
        });

        if (updatedProfile.role === 'organization' && updatedProfile.organizationCode) {
          const orgData = await getOrganizationByCode(updatedProfile.organizationCode);
          if (orgData) {
            setOrganizationName(orgData.organizationName);
          }
        }
      }
    }
    // I think this is where we have to fetch the user profile again. There is a useEffect at the top of the file, but I'm not sure how to call it here. 
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    // Refresh post count after modal closes
    refreshPostCount();
  };

  const handleCreateOpportunitySubmit = async (opportunityData: any) => {
    try {
      await onCreateOpportunity(opportunityData);
      setIsCreateModalOpen(false);
      // Refresh post count
      await refreshPostCount();
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error; // Re-throw so the modal can handle the error
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => handleNavigation('home')}
            className="flex items-center space-x-2"
          >
            <GraduationCap className="h-6 w-6 text-gray-900" />
            <span className="text-lg font-semibold">
              <span className="text-indigo-600">Student</span>
              <span className="text-yellow-500">Starter</span>
              <span className="text-indigo-600">+</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            {['opportunities', 'resources', 'contact'].map((page) => (
              <button 
                key={page}
                onClick={() => handleNavigation(page)}
                className={`text-sm ${
                  currentPage === page 
                    ? 'text-indigo-600 font-medium' 
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                {page.charAt(0).toUpperCase() + page.slice(1)}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {(isOrganization || isAdmin) && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Opportunity
              </button>
            )}
            
            {isAdmin && (
              <button
                onClick={() => setIsOrganizationCodesModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Shield className="h-4 w-4 mr-2" />
                Manage Codes
              </button>
            )}
            
            {user ? (
              <div className="relative profile-dropdown">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.firstName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {isAdmin ? 'Admin' : (isOrganization ? organizationName : (profile.firstName || 'Profile'))}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                    {isOrganization && !isAdmin && (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm text-gray-600">Organization</p>
                          <p className="font-medium text-gray-900">{organizationName}</p>
                          <div className="mt-2 flex items-center text-sm text-gray-600">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>{postCount} opportunities posted</span>
                          </div>
                        </div>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setIsProfileEditModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {isOrganization ? 'Organization Settings' : 'Edit Profile'}
                    </button>
                    {isAdmin ? (
                      <button
                        onClick={handleAdminSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Admin Sign Out
                      </button>
                    ) : (
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setIsSignInModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      <SignInModal 
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSignInSuccess={handleSignInSuccess}
      />

      <CreateOpportunityModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateModalClose}
        onSubmit={handleCreateOpportunitySubmit}
        organizationCode={effectiveOrganizationCode}
      />

      <OrganizationCodesModal
        isOpen={isOrganizationCodesModalOpen}
        onClose={() => setIsOrganizationCodesModalOpen(false)}
      />

      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={() => setIsProfileEditModalOpen(false)}
        userId={user?.id || ''}
        currentProfile={profile}
        onProfileUpdate={handleProfileUpdate}
        isOrganization={isOrganization}
        organizationName={organizationName}
        organizationCode={effectiveOrganizationCode}
      />
    </header>
  );
};

export default Header;