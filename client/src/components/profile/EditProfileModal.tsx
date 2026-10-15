import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Camera, X, Loader2, User as UserIcon, AlertCircle } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useAuth();
  const { showToast } = useToast();
  const prefersReduced = useReducedMotion();

  const [displayName, setDisplayName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const currentPhoto = user?.photoURL;
  const currentName = user?.displayName || '';
  const currentEmail = user?.email || '';

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentName);
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      setIsSaving(false);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, currentName]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showToast({ message: 'Please select a valid image (JPG, PNG, or WEBP).', type: 'error' });
      return;
    }

    // Validate size (5 MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast({ message: 'Image must be smaller than 5MB.', type: 'error' });
      return;
    }

    // Clean up old preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setError(null);
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  const hasNameChanged = displayName.trim() !== currentName.trim();
  const hasPhotoChanged = selectedFile !== null;
  const hasChanges = hasNameChanged || hasPhotoChanged;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) {
      onClose();
      return;
    }

    const trimmedName = displayName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError('Name must be between 2 and 50 characters.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await updateUserProfile({
        displayName: hasNameChanged ? trimmedName : undefined,
        photoFile: selectedFile,
      });

      showToast({ message: 'Profile updated successfully', type: 'success' });
      handleCancel();
    } catch (err: unknown) {
      const e = err as Error;
      console.error('[EditProfile] Error updating profile:', e);
      setError('Unable to update profile. Please try again.');
      showToast({ message: 'Unable to update profile', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const displayAvatarSrc = previewUrl || currentPhoto;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.12 }}
          onClick={isSaving ? undefined : handleCancel}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6 }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-[#161616] border border-[#282828] rounded-xl shadow-2xl p-5 sm:p-6 z-10 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
            <h3 id="edit-profile-title" className="text-sm font-semibold text-[#F5F5F5]">
              Edit Profile
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="p-1 text-[#666666] hover:text-[#F5F5F5] rounded transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Picture Section */}
            <div className="flex items-center gap-4 py-1">
              <div
                onClick={() => !isSaving && fileInputRef.current?.click()}
                className="group relative w-16 h-16 rounded-full bg-[#202020] border border-[#303030] overflow-hidden flex items-center justify-center cursor-pointer shrink-0 shadow-inner"
                title="Change profile picture"
              >
                {displayAvatarSrc ? (
                  <img
                    src={displayAvatarSrc}
                    alt={displayName || 'User Avatar'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-7 h-7 text-[#777777]" />
                )}

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#F5F5F5] block">Profile Picture</label>
                <button
                  type="button"
                  onClick={() => !isSaving && fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="px-2.5 py-1 text-xs text-[#A0A0A0] hover:text-white bg-[#202020] hover:bg-[#282828] border border-[#2E2E2E] rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  Change Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload profile picture"
                />
                <p className="text-[11px] text-[#666666]">JPG, PNG, or WEBP. Max 5MB.</p>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1">
              <label htmlFor="display-name-input" className="block text-xs font-medium text-[#8A8A8A]">
                Display Name
              </label>
              <input
                id="display-name-input"
                ref={nameInputRef}
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSaving}
                placeholder="Your name..."
                maxLength={50}
                className="w-full bg-[#1A1A1A] text-xs text-[#F5F5F5] placeholder-[#555555] border border-[#2A2A2A] focus:border-[#444444] rounded-lg px-3 py-2 focus:outline-none transition-colors disabled:opacity-50"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#8A8A8A]">Email</label>
                <span className="text-[10px] text-[#666666] font-mono">Read-only</span>
              </div>
              <input
                type="email"
                value={currentEmail}
                readOnly
                disabled
                className="w-full bg-[#121212] text-xs text-[#666666] border border-[#202020] rounded-lg px-3 py-2 cursor-not-allowed select-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !hasChanges}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#F5F5F5] hover:bg-white disabled:bg-[#282828] text-black disabled:text-[#666666] rounded-md transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
