import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Fab,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';

function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedGroupForMenu, setSelectedGroupForMenu] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/groups/my`);
      setGroups(response.data);
    } catch (error) {
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/groups/`, {
        name: newGroupName
      });
      setSuccess('Group created successfully!');
      setNewGroupName('');
      setCreateDialogOpen(false);
      fetchGroups();
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to create group');
    }
  };

  const handleInviteUser = async () => {
    if (!inviteUsername.trim()) {
      setError('Username is required');
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/groups/${selectedGroup.id}/add_user`, {
        username: inviteUsername
      });
      setSuccess('User invited successfully!');
      setInviteUsername('');
      setInviteDialogOpen(false);
      fetchGroups();
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to invite user');
    }
  };

  const handleRemoveUser = async (username) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/groups/${selectedGroup.id}/remove_user`, {
        username: username
      });
      setSuccess('User removed successfully!');
      fetchGroups();
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to remove user');
    }
  };

  const handleMenuOpen = (event, group) => {
    setAnchorEl(event.currentTarget);
    setSelectedGroupForMenu(group);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGroupForMenu(null);
  };

  const handleDeleteGroup = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/groups/${selectedGroupForMenu.id}`);
      setSuccess('Group deleted successfully!');
      handleMenuClose();
      fetchGroups();
    } catch (error) {
      setError('Failed to delete group');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Groups
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Group
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {groups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <GroupIcon />
                    </Avatar>
                    <Typography variant="h6" component="div">
                      {group.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, group)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${group.member_count || 0} members`}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`${group.file_count || 0} files`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {group.members && group.members.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Members:
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {group.members.slice(0, 3).map((member, index) => (
                        <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                          <ListItemAvatar sx={{ minWidth: 32 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              {member.username.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={member.username}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                      {group.members.length > 3 && (
                        <ListItem sx={{ px: 0, py: 0.5 }}>
                          <ListItemText
                            primary={`+${group.members.length - 3} more`}
                            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}
              </CardContent>

              <CardActions sx={{ pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => {
                    setSelectedGroup(group);
                    setInviteDialogOpen(true);
                  }}
                >
                  Invite
                </Button>
                <Button
                  size="small"
                  startIcon={<FolderIcon />}
                  onClick={() => window.location.href = `/files?group=${group.id}`}
                >
                  Files
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {groups.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No groups yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first group to start sharing files with others
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Your First Group
          </Button>
        </Box>
      )}

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateGroup} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite User to {selectedGroup?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            variant="outlined"
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleInviteUser} variant="contained">Invite</Button>
        </DialogActions>
      </Dialog>

      {/* Group Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Group
        </MenuItem>
        <MenuItem onClick={handleDeleteGroup}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Group
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Groups; 