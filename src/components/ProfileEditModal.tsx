import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, User } from 'lucide-react';
import { updateProfile } from '../services/profiles';
import { updateOrganizationName } from '../services/organization-codes';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop/types';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentProfile: {
    firstName?: string;
    lastName?: string;
    major?: string;
    classYear?: string;
    avatarUrl?: string;
  };
  onProfileUpdate: () => void;
  isOrganization?: boolean;
  organizationName?: string;
  organizationCode?: string;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentProfile,
  onProfileUpdate,
  isOrganization,
  organizationName,
  organizationCode
}) => {
  const [formData, setFormData] = useState({
    firstName: currentProfile.firstName || '',
    lastName: currentProfile.lastName || '',
    major: currentProfile.major || '',
    classYear: currentProfile.classYear || '',
    avatarUrl: currentProfile.avatarUrl || '',
    organizationName: organizationName || ''
  });

  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  useEffect(() => {
    setFormData({
      firstName: currentProfile.firstName || '',
      lastName: currentProfile.lastName || '',
      major: currentProfile.major || '',
      classYear: currentProfile.classYear || '',
      avatarUrl: currentProfile.avatarUrl || '',
      organizationName: organizationName || ''
    });
    setImagePreview(currentProfile.avatarUrl || null);
  }, [currentProfile, organizationName]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = 400;
    canvas.height = 400;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      400,
      400
    );

    return canvas.toDataURL('image/jpeg');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsCropping(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    try {
      if (imagePreview && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imagePreview, croppedAreaPixels);
        setFormData(prev => ({
          ...prev,
          avatarUrl: croppedImage
        }));
        setImagePreview(croppedImage);
        setIsCropping(false);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to crop image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isOrganization && organizationCode) {
        await updateOrganizationName(organizationCode, formData.organizationName);
      }
      await updateProfile(userId, formData);
      onProfileUpdate();
      onClose();
      setError(null);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isOrganization ? 'Organization Settings' : 'Edit Profile'}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-6">
            {isCropping ? (
              <div className="w-full">
                <div className="relative w-full h-64 mb-4">
                  <Cropper
                    image={imagePreview || ''}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCropping(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCropSave}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Crop
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-24 h-24 mb-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-12 w-12 text-indigo-600" />
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors"
                >
                  <Upload className="h-4 w-4 text-white" />
                </label>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}
            {!isCropping && (
              <p className="text-sm text-gray-500">Click to upload a profile picture</p>
            )}
          </div>

          {isOrganization ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Major
                </label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Year
                </label>
                <input
                  type="text"
                  name="classYear"
                  value={formData.classYear}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal