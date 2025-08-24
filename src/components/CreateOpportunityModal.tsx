import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { Industry, OpportunityType, Opportunity } from '../types';
import { getAllMajors, getAllLocations, getAllClassYears, getAllIndustries } from '../data/opportunities';
import { getOrganizationByCode, getOrganizationCodes } from '../services/organization-codes';
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../services/profiles';
import Cropper from 'react-easy-crop';




// import { Area } from 'react-easy-crop/types'; MIGHT NEED THIS LATER. 

interface CreateOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityToEdit?: Opportunity;
  onSubmit?: (opportunity: Omit<Opportunity, 'id'>) => Promise<void>;
  organizationCode?: string;
}

const CreateOpportunityModal: React.FC<CreateOpportunityModalProps> = ({ 
  isOpen, 
  onClose, 
  opportunityToEdit,
  onSubmit,
  organizationCode: propOrganizationCode
}) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [organizationCode, setOrganizationCode] = useState<string>('');
  const [availableOrganizations, setAvailableOrganizations] = useState<Array<{code: string, name: string}>>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    description: '',
    deadline: '',
    gpa: 0,
    majors: [] as string[],
    classYears: [] as string[],
    location: '',
    type: 'program' as OpportunityType,
    industry: '' as Industry,
    applicationLink: '',
    logo: ''
  });

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Fetch user profile and organization data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const profile = await getProfile(user.id);
          if (profile) {
            if (profile.role === 'admin') {
              setIsAdmin(true);
              // Fetch all available organizations for admin
              const orgCodes = await getOrganizationCodes();
              const orgs = orgCodes.map(org => ({
                code: org.code,
                name: org.organizationName
              }));
              setAvailableOrganizations(orgs);
              
              // If editing an opportunity, set the organization
              if (opportunityToEdit?.organizationCode) {
                setOrganizationCode(opportunityToEdit.organizationCode);
                const orgData = await getOrganizationByCode(opportunityToEdit.organizationCode);
                if (orgData) {
                  setOrganizationName(orgData.organizationName);
                }
              }
            } else if (profile.role === 'organization' && profile.organizationCode) {
              setIsAdmin(false);
              setOrganizationCode(profile.organizationCode);
              
              const orgData = await getOrganizationByCode(profile.organizationCode);
              if (orgData) {
                setOrganizationName(orgData.organizationName);
                setFormData(prev => ({
                  ...prev,
                  organization: orgData.organizationName
                }));
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    if (isOpen) {
      fetchUserData();
    }
  }, [user, isOpen, opportunityToEdit]);

  useEffect(() => {
    if (opportunityToEdit) {
      setFormData({
        title: opportunityToEdit.title,
        organization: opportunityToEdit.organization,
        description: opportunityToEdit.description,
        deadline: opportunityToEdit.deadline,
        gpa: opportunityToEdit.gpa,
        majors: opportunityToEdit.majors,
        classYears: opportunityToEdit.classYears,
        location: opportunityToEdit.location,
        type: opportunityToEdit.type,
        industry: opportunityToEdit.industry,
        applicationLink: opportunityToEdit.applicationLink,
        logo: opportunityToEdit.logo
      });
      setImagePreview(opportunityToEdit.logo || null);
      setOriginalImage(opportunityToEdit.logo || null);
    } else {
      // Reset form for new opportunity
      setFormData({
        title: '',
        organization: organizationName,
        description: '',
        deadline: '',
        gpa: 0,
        majors: [],
        classYears: [],
        location: '',
        type: 'program',
        industry: '' as Industry,
        applicationLink: '',
        logo: ''
      });
      setImagePreview(null);
      setOriginalImage(null);
    }
  }, [opportunityToEdit, organizationName]);

  if (!isOpen) return null;

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<string> => {
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context available');
      }

      const targetWidth = 400;
      const targetHeight = 300;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.clearRect(0, 0, targetWidth, targetHeight);

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        targetWidth,
        targetHeight
      );

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read blob'));
            reader.readAsDataURL(blob);
          },
          'image/jpeg',
          0.8
        );
      });
    } catch (error) {
      console.error('Error in getCroppedImg:', error);
      throw new Error('Failed to process image');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setError(null);
      setIsProcessing(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setOriginalImage(result);
        setImagePreview(result);
        setIsCropping(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (!originalImage || !croppedAreaPixels) {
      setError('No image or crop area selected');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const croppedImage = await getCroppedImg(originalImage, croppedAreaPixels);
      setFormData(prev => ({
        ...prev,
        logo: croppedImage
      }));
      setImagePreview(croppedImage);
      setIsCropping(false);
    } catch (error) {
      console.error('Crop error:', error);
      setError('Failed to crop image. Please try again or select a different image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setImagePreview(formData.logo || null);
    setOriginalImage(null);
    setCroppedAreaPixels(null);
    setError(null);
  };

  const handleOrganizationChange = async (selectedCode: string) => {
    setOrganizationCode(selectedCode);
    try {
      const orgData = await getOrganizationByCode(selectedCode);
      if (orgData) {
        setOrganizationName(orgData.organizationName);
        setFormData(prev => ({
          ...prev,
          organization: orgData.organizationName
        }));
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setError('Failed to load organization data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);
    
    try {
      // For admin users, ensure they have selected an organization
      if (isAdmin && !organizationCode) {
        setError('Please select an organization to create this opportunity for.');
        setIsProcessing(false);
        return;
      }

      // Validate organization code for new opportunities
      if (!opportunityToEdit && !organizationCode) {
        setError('Organization code is required. Please ensure you are logged in with an organization account.');
        setIsProcessing(false);
        return;
      }

      // Validate required fields
      if (!formData.title || !formData.description || !formData.deadline || !formData.location || 
          !formData.type || !formData.industry || !formData.applicationLink || !formData.logo ||
          formData.majors.length === 0 || formData.classYears.length === 0) {
        setError('Please fill in all required fields including the opportunity image');
        setIsProcessing(false);
        return;
      }

      // Validate GPA range
      if (formData.gpa < 0 || formData.gpa > 4.0) {
        setError('GPA must be between 0 and 4.0');
        setIsProcessing(false);
        return;
      }

      const submissionData = {
        ...formData,
        organization: organizationName || formData.organization,
        organizationCode: organizationCode || opportunityToEdit?.organizationCode
      };

      // Use the onSubmit prop if provided
      if (onSubmit) {
        await onSubmit(submissionData);
        
        // I wonder if this is where I have to fetch the opportunities again. 
      }
      
      // Close modal and reset form
      onClose();
      
      // Reset form data only for new opportunities
      if (!opportunityToEdit) {
        setFormData({
          title: '',
          organization: organizationName,
          description: '',
          deadline: '',
          gpa: 0,
          majors: [],
          classYears: [],
          location: '',
          type: 'program',
          industry: '' as Industry,
          applicationLink: '',
          logo: ''
        });
        setImagePreview(null);
        setOriginalImage(null);
        setOrganizationCode('');
        setOrganizationName('');
      }
      setError(null);

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-white border border-green-200 text-gray-800 px-6 py-4 rounded-xl shadow-lg z-50 animate-fade-in max-w-sm';
      
      if (opportunityToEdit) {
        successMessage.innerHTML = `
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <p class="font-medium text-green-800">Opportunity updated successfully!</p>
            </div>
          </div>
        `;
      } else {
        successMessage.innerHTML = `
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <p class="font-medium text-green-800">Opportunity created successfully!</p>
              <p class="text-sm text-gray-600 mt-1">Refresh the page to see your new opportunity.</p>
            </div>
          </div>
        `;
      }
      
      document.body.appendChild(successMessage);

      setTimeout(() => {
        successMessage.classList.add('animate-fade-out');
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 300);
      }, 5000);
      
    } catch (err) {
      console.error('Error saving opportunity:', err);
      setError('Failed to save opportunity. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const values = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    setFormData(prev => ({
      ...prev,
      [name]: values
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {opportunityToEdit ? 'Edit Opportunity' : 'Create New Opportunity'}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Opportunity Image *
            </label>
            {isCropping ? (
              <div className="w-full">
                <div className="relative w-full h-64 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                  {originalImage && (
                    <Cropper
                      image={originalImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={4/3}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-2">Zoom</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={handleCropCancel}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCropSave}
                    disabled={isProcessing || !croppedAreaPixels}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Save Image'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative w-full h-48 mb-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Opportunity preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Upload an image for your opportunity</p>
                    </div>
                  )}
                  <label
                    htmlFor="image-upload"
                    className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-10 transition-all"
                  >
                    <div className="bg-white rounded-full p-2 shadow-lg opacity-0 hover:opacity-100 transition-opacity">
                      <Upload className="h-5 w-5 text-gray-600" />
                    </div>
                  </label>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isProcessing}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {isProcessing ? 'Processing image...' : 'Click to upload an image (max 5MB). Recommended size: 400x300px'}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            {/* Organization Selection for Admin */}
            {isAdmin ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization *
                </label>
                <select
                  value={organizationCode}
                  onChange={(e) => handleOrganizationChange(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="">Select an organization...</option>
                  {availableOrganizations.map((org) => (
                    <option key={org.code} value={org.code}>
                      {org.name} ({org.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  As an admin, you can create opportunities for any organization.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={organizationName || formData.organization}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="program">Program</option>
                <option value="mentorship">Mentorship</option>
                <option value="event">Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry *
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="">Select Industry</option>
                {getAllIndustries().map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum GPA *
              </label>
              <input
                type="number"
                name="gpa"
                value={formData.gpa}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="4.0"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Deadline *
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Link *
              </label>
              <input
                type="url"
                name="applicationLink"
                value={formData.applicationLink}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eligible Majors * (Hold Ctrl/Cmd to select multiple)
              </label>
              <select
                name="majors"
                multiple
                value={formData.majors}
                onChange={handleMultiSelect}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                size={5}
              >
                {getAllMajors().map(major => (
                  <option key={major} value={major}>{major}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Years * (Hold Ctrl/Cmd to select multiple)
              </label>
              <select
                name="classYears"
                multiple
                value={formData.classYears}
                onChange={handleMultiSelect}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                size={5}
              >
                {getAllClassYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5 mr-2" />
            {isProcessing ? 'Processing...' : (opportunityToEdit ? 'Update Opportunity' : 'Create Opportunity')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateOpportunityModal;