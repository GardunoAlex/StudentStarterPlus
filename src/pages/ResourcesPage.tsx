import React from 'react';

const ResourcesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Resources</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume Building</h2>
          <p className="text-gray-600 mb-4">Learn how to create a standout resume that highlights your skills and experiences.</p>
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Learn more →</a>
        </div>
        
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Preparation</h2>
          <p className="text-gray-600 mb-4">Tips and strategies for acing your next interview, including common questions and best practices.</p>
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Learn more →</a>
        </div>
        
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Career Planning</h2>
          <p className="text-gray-600 mb-4">Guidance on mapping out your career path and making informed decisions about your future.</p>
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Learn more →</a>
        </div>
        
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Networking Guide</h2>
          <p className="text-gray-600 mb-4">Learn effective networking strategies to build professional relationships and find opportunities.</p>
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Learn more →</a>
        </div>
        
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Skill Development</h2>
          <p className="text-gray-600 mb-4">Resources for developing both technical and soft skills that employers value.</p>
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Learn more →</a>
        </div>
        
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Industry Insights</h2>
          <p className="text-gray-600 mb-4">Stay updated with the latest trends and developments in your field of interest.</p>
          <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Learn more →</a>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;