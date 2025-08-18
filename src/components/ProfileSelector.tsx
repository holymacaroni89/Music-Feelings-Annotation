import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { UserIcon, PlusIcon, CheckIcon } from './icons';
import { Profile } from '../types';

interface ProfileSelectorProps {
  profiles: Profile[];
  activeProfileId: string;
  onProfileChange: (profileId: string) => void;
  onAddNewProfile: () => void;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  profiles,
  activeProfileId,
  onProfileChange,
  onAddNewProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  
  const handleProfileSelect = (profileId: string) => {
    onProfileChange(profileId);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    setIsOpen(false);
    onAddNewProfile();
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 transition-colors duration-200"
      >
        <UserIcon />
        <span className="text-sm truncate max-w-20 sm:max-w-24">
          {activeProfile?.name || 'Select Profile'}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {/* Profile Selection Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-100">
              <UserIcon />
              Select Profile
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {profiles.map((profile) => (
              <Button
                key={profile.id}
                onClick={() => handleProfileSelect(profile.id)}
                variant="ghost"
                className={`w-full justify-between p-3 h-auto text-left transition-colors duration-200 ${
                  profile.id === activeProfileId
                    ? 'bg-accent-600 hover:bg-accent-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    profile.id === activeProfileId
                      ? 'bg-white text-accent-600'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{profile.name}</span>
                </div>
                {profile.id === activeProfileId && (
                  <CheckIcon className="w-5 h-5 text-white" />
                )}
              </Button>
            ))}
            
            {/* Add New Profile Button */}
            <Button
              onClick={handleAddNew}
              variant="outline"
              className="w-full justify-center p-3 h-auto border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-200 border-dashed"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add New Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileSelector;
