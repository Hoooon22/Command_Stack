import React from 'react';
import type { User } from '../../types';
import { authApi } from '../../api';
import './UserAvatar.css';

interface UserAvatarProps {
  user: User;
  onLogout?: () => void;
  showDropdown?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  onLogout,
  showDropdown = true 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setIsOpen(false);
      onLogout?.();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleDropdown = () => {
    if (showDropdown) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="user-avatar-container">
      <button 
        className="user-avatar-button"
        onClick={toggleDropdown}
        type="button"
        aria-label={`User menu for ${user.name}`}
      >
        {user.pictureUrl ? (
          <img 
            src={user.pictureUrl} 
            alt={user.name}
            className="user-avatar-image"
          />
        ) : (
          <div className="user-avatar-placeholder">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {showDropdown && isOpen && (
        <>
          <div 
            className="user-avatar-backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div className="user-avatar-dropdown">
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <div className="dropdown-divider" />
            <button 
              className="dropdown-item logout-button"
              onClick={handleLogout}
              type="button"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserAvatar;
