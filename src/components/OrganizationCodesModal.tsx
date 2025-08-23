import React, { useState } from 'react';
import { X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useOrganizationCodes } from '../hooks/useOrganizationCodes';

interface OrganizationCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrganizationCodesModal: React.FC<OrganizationCodesModalProps> = ({ isOpen, onClose }) => {
  const { 
    organizationCodes, 
    loading, 
    error,
    createOrganizationCode,
    deleteOrganizationCode 
  } = useOrganizationCodes();

  const [newCode, setNewCode] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgEmail, setNewOrgEmail] = useState('');
  const [newOrgPassword, setNewOrgPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setSubmitError(null);
    
    try {
      // Validate code length
      if (newCode.length < 6) {
        setSubmitError('Access code must be at least 6 characters long.');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newOrgEmail)) {
        setSubmitError('Please enter a valid email address.');
        return;
      }

      // Validate organization name
      if (!newOrgName.trim()) {
        setSubmitError('Organization name is required.');
        return;
      }

      // Validate password
      if (newOrgPassword.length < 6) {
        setSubmitError('Password must be at least 6 characters long.');
        return;
      }

      await createOrganizationCode(newCode, newOrgName, newOrgEmail, newOrgPassword);
      
      // Reset form
      setNewCode('');
      setNewOrgName('');
      setNewOrgEmail('');
      setNewOrgPassword('');
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-50 text-green-800 px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in';
      successMessage.textContent = 'Organization code created successfully!';
      document.body.appendChild(successMessage);

      setTimeout(() => {
        successMessage.classList.add('animate-fade-out');
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 300);
      }, 3500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create organization code');
    }
  };

  const handleDeleteCode = async (code: string) => {
    try {
      await deleteOrganizationCode(code);
    } catch (err) {
      setSubmitError('Failed to delete organization code. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Organization Codes</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg">
            {submitError}
          </div>
        )}

        <form onSubmit={handleAddCode} className="mb-8">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Email
              </label>
              <input
                type="email"
                value={newOrgEmail}
                onChange={(e) => setNewOrgEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Code (minimum 6 characters)
              </label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
                minLength={6}
                pattern=".{6,}"
                title="Access code must be at least 6 characters long"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Password (minimum 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newOrgPassword}
                  onChange={(e) => setNewOrgPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-600 focus:border-transparent pr-10"
                  required
                  minLength={6}
                  pattern=".{6,}"
                  title="Password must be at least 6 characters long"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Organization Code
          </button>
        </form>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Organization Codes</h3>
          {organizationCodes.length === 0 ? (
            <p className="text-gray-600">No organization codes created yet.</p>
          ) : (
            organizationCodes.map((org) => (
              <div
                key={org.code}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{org.organizationName}</p>
                  <p className="text-sm text-gray-600">Code: {org.code}</p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCode(org.code)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationCodesModal;