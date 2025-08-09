import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { MdLogout } from 'react-icons/md';
import { apiUtils } from '../../../api';

interface UserAvatarProps {
  initials?: string;
  name?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  initials = "FL", 
  name = "First Last" 
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    apiUtils.removeAuthToken();
    handleClose();
    navigate('/');
  };

  return (
    <>
      <IconButton
        onClick={handleAvatarClick}
        sx={{ p: 0 }}
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar
          sx={{
            bgcolor: '#4338ca',
            color: 'white',
            width: 48,
            height: 48,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#3730a3',
            },
          }}
        >
          {initials}
        </Avatar>
      </IconButton>
      
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        disableScrollLock={true}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#1e293b',
            color: 'white',
            minWidth: 180,
            mt: 1,
            border: '1px solid #334155',
          },
        }}
      >
        <MenuItem
          onClick={handleLogout}
          sx={{
            '&:hover': {
              backgroundColor: '#334155',
            },
          }}
        >
          <ListItemIcon>
            <MdLogout fontSize="small" color="white" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserAvatar;
