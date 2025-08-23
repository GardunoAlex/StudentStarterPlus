import React from 'react';
import { Users, Target, Heart } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">About Student Starter+</h1>
        <p className="text-xl text-gray-600">
          We're on a mission to connect ambitious students with life-changing opportunities that shape their future careers.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">For Students</h3>
          <p className="text-gray-600">
            Access curated opportunities and resources to jumpstart your career journey.
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Mission</h3>
          <p className="text-gray-600">
            Bridge the gap between education and career success through meaningful opportunities.
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Values</h3>
          <p className="text-gray-600">
            Committed to inclusivity, growth, and empowering the next generation of leaders.
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-8 card-shadow mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
        <p className="text-gray-600 mb-4">
          Student Starter+ was founded with a simple yet powerful vision: to make meaningful career opportunities accessible to all students. We recognized the challenges students face in finding and securing opportunities that align with their aspirations.
        </p>
        <p className="text-gray-600 mb-4">
          What started as a small platform has grown into a comprehensive resource hub, connecting thousands of students with programs, mentorships, and events that shape their professional journeys.
        </p>
        <p className="text-gray-600">
          Today, we continue to expand our network and enhance our platform, always keeping our core mission at heart: empowering students to build successful careers.
        </p>
      </div>
      
      <div className="bg-indigo-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Join Our Community</h2>
        <p className="text-gray-600 mb-6">
          Be part of a growing community of ambitious students and professionals. Stay updated with the latest opportunities and resources.
        </p>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors">
          Sign Up Now
        </button>
      </div>
    </div>
  );
};

export default AboutPage;