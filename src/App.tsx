import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import { BookmarksProvider } from './hooks/useBookmarks';
import ResourcesPage from './pages/ResourcesPage';
import ContactPage from './pages/ContactPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import HomePage from './pages/HomePage';
import { useAuth } from './hooks/useAuth';
import { useOpportunities } from './hooks/useOpportunities';
import { getProfile } from './services/profiles';
import { getOrganizationByCode } from './services/organization-codes';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const { user } = useAuth();
  const { createOpportunity } = useOpportunities();
  const [firstName, setFirstName] = useState<string | undefined>();
  const [isOrganization, setIsOrganization] = useState(false);
  const [organizationName, setOrganizationName] = useState<string | undefined>();
  const [organizationCode, setOrganizationCode] = useState<string | undefined>();

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const profile = await getProfile(user.id);
          if (profile) {
            setFirstName(profile.firstName || undefined);
            setIsOrganization(profile.role === 'organization');
            
            if (profile.role === 'organization' && profile.organizationCode) {
              setOrganizationCode(profile.organizationCode);
              const orgData = await getOrganizationByCode(profile.organizationCode);
              setOrganizationName(orgData?.organizationName);
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setFirstName(undefined);
        setIsOrganization(false);
        setOrganizationName(undefined);
        setOrganizationCode(undefined);
      }
    };

    fetchProfile();
  }, [user]);

  const handleCreateOpportunity = async (opportunityData: any) => {
    try {
      await createOpportunity(opportunityData);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error; // Re-throw so the modal can handle the error
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'opportunities':
        return <OpportunitiesPage />;
      case 'resources':
        return <ResourcesPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return null;
    }
  };

  return (
    <BookmarksProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          onCreateOpportunity={handleCreateOpportunity}
          organizationCode={organizationCode}
        />
        {currentPage === 'home' && (
          <Hero 
            firstName={firstName} 
            isOrganization={isOrganization}
            organizationName={organizationName}
          />
        )}
        {renderPage()}
        <Footer />
      </div>
    </BookmarksProvider>
  );
}

export default App;