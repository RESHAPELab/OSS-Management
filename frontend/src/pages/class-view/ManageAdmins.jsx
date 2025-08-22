import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import API_CONFIG from '../../config/api';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Paper,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  School as SchoolIcon,
  Grade as GradeIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  MoreHoriz as MoreHorizIcon
} from '@mui/icons-material';

const ManageAdmins = () => {
  const { classId } = useParams();
  const baseURL = API_CONFIG.getBaseURL();
  
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    githubUsername: '',
    role: 'assistant'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const roleOptions = [
    { value: 'professor', label: 'Professor', icon: <SchoolIcon />, color: 'primary' },
    { value: 'assistant', label: 'Assistant', icon: <AdminIcon />, color: 'secondary' },
    { value: 'grader', label: 'Grader', icon: <GradeIcon />, color: 'success' },
    { value: 'mentor', label: 'Mentor', icon: <PersonIcon />, color: 'info' },
    { value: 'moderator', label: 'Moderator', icon: <SettingsIcon />, color: 'warning' },
    { value: 'other', label: 'Other', icon: <MoreHorizIcon />, color: 'default' }
  ];

  // Load admins from backend
  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await axios.get(`${baseURL}/api/admin/groups/${classId}/admins`);
      
      if (response.data.success) {
        setAdmins(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to load admins');
      }
    } catch (error) {
      console.error('[loadAdmins] Error:', error);
      setError(error.response?.data?.message || 'Failed to load admins');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize - load admins when component mounts
  useEffect(() => {
    if (classId) {
      loadAdmins();
    }
  }, [classId]);

  useEffect(() => {
    if (editingAdmin) {
      setFormData({
        githubUsername: editingAdmin.githubUsername,
        role: editingAdmin.role
      });
    } else {
      setFormData({
        githubUsername: '',
        role: 'assistant'
      });
    }
  }, [editingAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.githubUsername.trim()) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (editingAdmin) {
        // Edit existing admin
        const response = await axios.put(
          `${baseURL}/api/admin/groups/${classId}/admins/${editingAdmin._id}`,
          {
            githubUsername: formData.githubUsername.trim(),
            role: formData.role
          }
        );

        if (response.data.success) {
          // Update local state
          setAdmins(prev => prev.map(admin => 
            admin._id === editingAdmin._id 
              ? response.data.data
              : admin
          ));
          setEditingAdmin(null);
        } else {
          setError(response.data.message || 'Failed to update admin');
          return;
        }
      } else {
        // Add new admin
        const response = await axios.post(
          `${baseURL}/api/admin/groups/${classId}/admins`,
          {
            githubUsername: formData.githubUsername.trim(),
            role: formData.role
          }
        );

        if (response.data.success) {
          // Add to local state
          setAdmins(prev => [...prev, response.data.data]);
        } else {
          setError(response.data.message || 'Failed to add admin');
          return;
        }
      }

      setFormData({ githubUsername: '', role: 'assistant' });
      setShowAddAdminModal(false);
    } catch (error) {
      console.error('[handleSubmit] Error:', error);
      setError(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (admin) => {
    setAdminToDelete(admin);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;

    setIsSaving(true);
    setError('');

    try {
      const response = await axios.delete(
        `${baseURL}/api/admin/groups/${classId}/admins/${adminToDelete._id}`
      );

      if (response.data.success) {
        // Remove from local state
        setAdmins(prev => prev.filter(admin => admin._id !== adminToDelete._id));
        setDeleteDialogOpen(false);
        setAdminToDelete(null);
      } else {
        setError(response.data.message || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('[confirmDelete] Error:', error);
      setError(error.response?.data?.message || 'Failed to delete admin');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setAdminToDelete(null);
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setShowAddAdminModal(true);
  };

  const handleCloseModal = () => {
    setShowAddAdminModal(false);
    setEditingAdmin(null);
    setFormData({ githubUsername: '', role: 'assistant' });
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const getRoleIcon = (role) => {
    const roleOption = roleOptions.find(option => option.value === role);
    return roleOption ? roleOption.icon : <PersonIcon />;
  };

  const getRoleColor = (role) => {
    const roleOption = roleOptions.find(option => option.value === role);
    return roleOption ? roleOption.color : 'default';
  };

  const getRoleLabel = (role) => {
    const roleOption = roleOptions.find(option => option.value === role);
    return roleOption ? roleOption.label : 'Unknown';
  };

  const getRolePriority = (role) => {
    const priorities = {
      'professor': 1,
      'assistant': 2,
      'grader': 3,
      'mentor': 4,
      'moderator': 5,
      'other': 6
    };
    return priorities[role] || 7;
  };

  const sortedAdmins = [...admins].sort((a, b) => {
    const priorityA = getRolePriority(a.role);
    const priorityB = getRolePriority(b.role);
    
    // Sort by role priority first
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same role, sort by username alphabetically
    return a.githubUsername.toLowerCase().localeCompare(b.githubUsername.toLowerCase());
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Manage Admins
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage administrative users for this class. Admins can view student repositories, grades, and have administrative functions.
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddAdminModal(true)}
          sx={{ 
            bgcolor: '#fb5233', 
            '&:hover': { bgcolor: '#e04a2e' },
            borderRadius: 4,
            fontWeight: 'bold',
            px: 2,
            py: 1
          }}
        >
          Add Admin
        </Button>
        
        <Button
          variant="text"
          color={isEditMode ? "error" : "primary"}
          onClick={toggleEditMode}
          startIcon={isEditMode ? <CloseIcon /> : <EditIcon />}
          sx={{ 
            fontWeight: 'bold',
            borderRadius: 4,
            bgcolor: isEditMode ? 'error.main' : 'primary.main',
            color: 'white',
            px: 2,
            py: 1,
            '&:hover': {
              bgcolor: isEditMode ? 'error.dark' : 'primary.dark'
            }
          }}
        >
          {isEditMode ? "Exit Edit Mode" : "Edit Admin List"}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Admins List */}
      <Card sx={{ mb: 4 }}>
        <Box p={3}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700, textAlign: 'left' }}>
            Current Admins
          </Typography>
          
          {isLoading ? (
            <Box textAlign="center" py={4}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Loading admins...</Typography>
            </Box>
          ) : error && admins.length === 0 ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : admins.length === 0 ? (
            <Box textAlign="center" py={4}>
              <AdminIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No admins added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Add Admin" to add the first administrative user to this class.
              </Typography>
            </Box>
          ) : (
            <List>
              {sortedAdmins.map((admin) => (
                <ListItem
                  key={admin.id}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    mb: 1,
                    '&:hover': { bgcolor: '#f8f9fa' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {admin.githubUsername}
                          </Typography>
                                                     {!isEditMode && (
                             <Chip
                               icon={getRoleIcon(admin.role)}
                               label={getRoleLabel(admin.role)}
                               color={getRoleColor(admin.role)}
                               size="small"
                               sx={{
                                 display: 'flex',
                                 flexDirection: 'row',
                                 alignItems: 'center',
                                 '& .MuiChip-icon': {
                                   marginRight: '4px',
                                   marginLeft: '8px'
                                 },
                                 '& .MuiChip-label': {
                                   paddingLeft: 0
                                 }
                               }}
                             />
                           )}
                        </Box>
                        {isEditMode && (
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Button
                              variant="contained"
                              startIcon={<EditIcon sx={{ fontSize: '0.7rem' }} />}
                              onClick={() => handleEdit(admin)}
                              sx={{ 
                                borderRadius: 4, 
                                fontWeight: 'bold', 
                                px: 2, 
                                py: 1,
                                boxShadow: 'none',
                                border: 'none',
                                bgcolor: '#1976d2',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: '#1565c0',
                                  boxShadow: 'none'
                                }
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="contained"
                              startIcon={<DeleteIcon sx={{ fontSize: '0.7rem' }} />}
                              onClick={() => handleDelete(admin)}
                              sx={{ 
                                borderRadius: 4, 
                                fontWeight: 'bold', 
                                px: 2, 
                                py: 1,
                                boxShadow: 'none',
                                border: 'none',
                                bgcolor: '#f5f5f5',
                                color: '#666',
                                '&:hover': {
                                  bgcolor: '#e0e0e0',
                                  boxShadow: 'none'
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    }
                                          secondary={
                        !isEditMode && (
                          <Typography variant="body2" color="text.secondary">
                            Added: {admin.addedAt ? new Date(admin.addedAt).toLocaleDateString() : 'Unknown'}
                          </Typography>
                        )
                      }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={cancelDelete} maxWidth="sm">
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete admin <strong>{adminToDelete?.githubUsername}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
                  <DialogActions>
            <Button onClick={cancelDelete} color="primary" disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete} 
              color="error" 
              variant="contained"
              disabled={isSaving}
              sx={{ 
                bgcolor: 'error.main',
                '&:hover': { bgcolor: 'error.dark' }
              }}
            >
              {isSaving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
      </Dialog>

      {/* Add/Edit Admin Modal */}
      <Dialog open={showAddAdminModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={3}>
              <TextField
                label="GitHub Username"
                value={formData.githubUsername}
                onChange={(e) => setFormData(prev => ({ ...prev, githubUsername: e.target.value }))}
                placeholder="github-username"
                fullWidth
                required
                helperText="Enter the GitHub username of the person you want to add as an admin"
              />
              
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        width: '300px'
                      }
                    }
                  }}
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Role Descriptions:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  <li><strong>Professor:</strong> Full access to all class features</li>
                  <li><strong>Assistant:</strong> Can manage students and quests</li>
                  <li><strong>Grader:</strong> Can grade assignments and provide feedback</li>
                  <li><strong>Mentor:</strong> Can provide guidance and support</li>
                  <li><strong>Moderator:</strong> Can manage discussions and content</li>
                  <li><strong>Other:</strong> Custom role with specific permissions</li>
                </Box>
              </Paper>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} disabled={isSaving}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSaving || !formData.githubUsername.trim()}
              sx={{ bgcolor: '#fb5233', '&:hover': { bgcolor: '#e04a2e' } }}
            >
              {isSaving 
                ? (editingAdmin ? 'Updating...' : 'Adding...') 
                : (editingAdmin ? 'Update Admin' : 'Add Admin')
              }
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default ManageAdmins;
