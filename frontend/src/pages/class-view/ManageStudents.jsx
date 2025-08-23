import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import {
  Container,
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Chip,
  Stack
} from '@mui/material';
import {
  Group as GroupIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';



const ManageStudents = () => {
  const { classId } = useParams();
  const { authUser } = useAuthContext();
  const baseURL = API_CONFIG.getBaseURL();
  const [studentData, setStudentData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [organizationGh, setOrganizationGh] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Add Students functionality
  const [showModal, setShowModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingUser, setCurrentProcessingUser] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [processingResults, setProcessingResults] = useState({ successful: [], unsuccessful: [] });
  const [createReposStatus, setCreateReposStatus] = useState('');
  
  // Generate Invite Link functionality
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  
  // Add Students functionality (mirroring ClassView)
  const [generateJsonConfig, setGenerateJsonConfig] = useState(null);
  const [myQuests, setMyQuests] = useState([]);
  const [questConfig, setQuestConfig] = useState(null);

  // Fetch organizationGh
  const fetchOrganizationGh = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/repo/prodStatus`);
      setOrganizationGh(response.data.organizationGh);
    } catch (error) {
      setError('Failed to fetch organization info');
    }
  };

  // Fetch class info
  const fetchClassInfo = async () => {
    if (!classId) {
      console.error('No classId available for fetchClassInfo');
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/group/class/${classId}`);
      setClassInfo(response.data);
    } catch (error) {
      setError('Failed to fetch class info');
    }
  };

  // Fetch student repositories (same logic as ClassView)
  const fetchOrganizationRepos = async (org, classInfoObj) => {
    try {
      setIsLoading(true);
      setError('');
      if (!org || !classInfoObj || !classInfoObj.groupName) {
        setError('Missing organization or class info');
        setIsLoading(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/repo/listRepos`, {
        params: { organizationGh: org }
      });
      if (response.data && Array.isArray(response.data.repos)) {
        // Format class name to match repository naming convention
        const formattedClassName = classInfoObj.groupName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        // Filter repositories to only show ones for this class using new username-classname format
        const classRepos = response.data.repos
          .filter(repo => repo.name.endsWith(`-${formattedClassName}`))
          .map(repo => repo.name.replace(`-${formattedClassName}`, ''));
        setStudentData(classRepos);
      } else {
        setError('Invalid response from server');
      }
    } catch (error) {
      setError('Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch GenerateJson config (mirroring ClassView)
  const fetchGenerateJsonConfig = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/group/${classId}/quest-json-config`);
      if (response.data.success) {
        setGenerateJsonConfig(response.data.data.questJsonConfig);
      }
    } catch (error) {
      console.error('Error fetching quest config:', error);
    }
  };

  // Fetch all needed data on mount
  useEffect(() => {
    fetchOrganizationGh();
    fetchClassInfo();
    if (classId) fetchGenerateJsonConfig();
  }, [classId]);

  // Fetch repos when org and classInfo are ready
  useEffect(() => {
    if (organizationGh && classInfo && classInfo.groupName) {
      fetchOrganizationRepos(organizationGh, classInfo);
    }
    // eslint-disable-next-line
  }, [organizationGh, classInfo]);

  // Delete repository function (replicates OSS-Doorway del_repo command)
  const handleDeleteRepository = async (username) => {
    try {
      setIsDeleting(true);
      
      // Format class name to match repository naming convention
      const formattedClassName = classInfo.groupName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const repoName = `${username}-${formattedClassName}`;
      
      console.log(`🗑️ [ManageStudents] Deleting repository: ${repoName}`);
      
      const response = await axios.post(`${API_BASE_URL}/api/repo/deleteRepo`, {
        organizationGh,
        repoName
      });
      
      if (response.data.success) {
        console.log(`✅ [ManageStudents] Repository ${repoName} deleted successfully`);
        // Remove the student from the list
        setStudentData(prev => prev.filter(student => student !== username));
        setDeleteDialogOpen(false);
        setSelectedStudent(null);
        alert(`✅ Repository deleted successfully!`);
      } else {
        console.error(`❌ [ManageStudents] Failed to delete repository:`, response.data.message);
        alert(`Failed to delete repository: ${response.data.message}`);
      }
    } catch (error) {
      console.error(`❌ [ManageStudents] Error deleting repository:`, error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        alert(`❌ Permission Error: ${error.response.data.message}\n\nSolution: ${error.response.data.solution || 'Contact administrator'}`);
      } else if (error.response?.status === 404) {
        alert(`❌ Repository not found: ${error.response.data.message}`);
      } else {
        alert(`Error deleting repository: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (username) => {
    setSelectedStudent(username);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedStudent(null);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // Add Students functionality
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      // Immediately clear the file input so user can re-upload if needed
      event.target.value = '';
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  const handleCreateRepos = async () => {
    if (!csvFile) {
      alert('Please upload a CSV file first');
      return;
    }

    try {
      if (!organizationGh) {
        setCreateReposStatus('Error: Organization information not available');
        return;
      }

      // Debug: Log the classId to see what it looks like
      console.log('🔍 DEBUG: classId from URL params:', classId);
      console.log('🔍 DEBUG: classId type:', typeof classId);
      console.log('🔍 DEBUG: classId length:', classId ? classId.length : 'null');

      // Validate that classId looks like a MongoDB ObjectId (24 hex characters)
      if (!classId || classId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(classId)) {
        console.error('❌ DEBUG: Invalid classId format:', classId);
        setCreateReposStatus(`Error: Invalid class ID format. Expected 24-character hex string, got: ${classId}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        // Skip header if it exists and filter out empty lines
        const usernames = lines
          .slice(lines[0].toLowerCase().includes('github_username') ? 1 : 0)
          .map(line => line.trim())
          .filter(line => line.length > 0);

        console.log('🔍 [CSV-UPLOAD] Processing usernames:', usernames);
        console.log('🔍 [CSV-UPLOAD] Using createCustomRepos for each user individually');

        // Initialize progress tracking
        setIsProcessing(true);
        setTotalUsers(usernames.length);
        setProcessedCount(0);
        setCurrentProcessingUser('');
        setProcessingResults({ successful: [], unsuccessful: [] });

        // Use createCustomRepos (same as individual button) for each user
        const results = {
          successful: [],
          unsuccessful: []
        };

        for (let i = 0; i < usernames.length; i++) {
          const username = usernames[i];
          
          // Update progress state for UI
          setCurrentProcessingUser(username);
          setProcessedCount(i);
          
          // Update status to show progress
          setCreateReposStatus(`Processing ${i + 1}/${usernames.length}: Creating repository for ${username}...`);
          
          try {
            // Ensure myQuests is loaded for task data
            if (myQuests.length === 0) {
              console.log('🔄 [QUEST-CONFIG] Loading myQuests for task data...');
              try {
                const response = await axios.get(`${API_BASE_URL}/api/quest/professor/${authUser._id}`);
                if (response.data.success) {
                  setMyQuests(response.data.data);
                  console.log('✅ [QUEST-CONFIG] Loaded myQuests:', response.data.data.length, 'quests');
                }
              } catch (error) {
                console.error('❌ [QUEST-CONFIG] Error loading myQuests:', error);
              }
            }
            
            const requestBody = {
              users: [username], // Single user per request
              customSequence: generateJsonConfig || questConfig, // Use GenerateJson config if available, else fallback
              className: classInfo?.groupName,
              classId: classInfo?._id
            };

            if (!generateJsonConfig && !questConfig) {
              setCreateReposStatus('❌ No quest configuration found. Please set up quests in GenerateJson or ManageQuests.');
              return;
            }

            // 🎯 KEEP: Detailed custom quest logging
            console.log(`🎮 [CUSTOM-QUESTS] Quest configuration being sent to bot for ${username}:`);
            console.log(`🎮 [CUSTOM-QUESTS] Full questConfig:`, JSON.stringify(requestBody.customSequence, null, 2));
            
            if (requestBody.customSequence?.questSequence) {
              console.log(`🎮 [CUSTOM-QUESTS] Quest sequence breakdown:`);
              requestBody.customSequence.questSequence.forEach((quest, index) => {
                console.log(`🎮 [CUSTOM-QUESTS] Quest ${index + 1}:`, {
                  questId: quest.questId,
                  title: quest.title,
                  type: quest.questType,
                  sequenceNumber: quest.sequenceNumber,
                  taskCount: quest.tasks ? Object.keys(quest.tasks).length : 0
                });
              });
            }

            const response = await axios.post(`${API_BASE_URL}/api/repo/createCustomRepos`, requestBody);
            
            // Debug logging to see the actual response structure
            console.log(`🔍 [CSV-UPLOAD] Response status:`, response.status);
            console.log(`🔍 [CSV-UPLOAD] Response for ${username}:`, response.data);
            console.log(`🔍 [CSV-UPLOAD] Response structure:`, {
              hasResults: !!response.data.results,
              successful: response.data.results?.successful,
              unsuccessful: response.data.results?.unsuccessful,
              message: response.data.message,
              error: response.data.error,
              success: response.data.success
            });
            
            // Log the full response structure for debugging
            console.log(`🔍 [CSV-UPLOAD] Full response keys:`, Object.keys(response.data));
            if (response.data.results) {
              console.log(`🔍 [CSV-UPLOAD] Results keys:`, Object.keys(response.data.results));
              if (response.data.results.successful) {
                console.log(`🔍 [CSV-UPLOAD] First successful result:`, response.data.results.successful[0]);
              }
              if (response.data.results.unsuccessful) {
                console.log(`🔍 [CSV-UPLOAD] First unsuccessful result:`, response.data.results.unsuccessful[0]);
              }
            }
            
            // Log the message content for debugging
            if (response.data.message) {
              console.log(`🔍 [CSV-UPLOAD] Response message: "${response.data.message}"`);
              console.log(`🔍 [CSV-UPLOAD] Message length:`, response.data.message.length);
            }
            
            // Check if the user was in the successful results (try both 'user' and 'username' fields)
            const userResult = response.data.results?.successful?.find(result => 
              result.user === username || result.username === username
            );
            console.log(`🔍 [CSV-UPLOAD] User result for ${username}:`, userResult);
            
            // Also check if the response has a direct success message
            const hasDirectSuccess = response.data.message && response.data.message.includes('success');
            console.log(`🔍 [CSV-UPLOAD] Direct success message:`, hasDirectSuccess);
            
            // Check if the response indicates success in other ways
            const hasSuccessFlag = response.data.success === true || response.data.success === 'true';
            const hasSuccessMessage = response.data.message && (
              response.data.message.toLowerCase().includes('success') || 
              response.data.message.toLowerCase().includes('created') ||
              response.data.message.toLowerCase().includes('completed')
            );
            
            // Check if HTTP status indicates success
            const hasSuccessStatus = response.status >= 200 && response.status < 300;
            
            // Check if the message indicates the repo already exists
            const repoAlreadyExists = response.data.message && (
              response.data.message.toLowerCase().includes('already exists') ||
              response.data.message.toLowerCase().includes('already present') ||
              response.data.message.toLowerCase().includes('duplicate') ||
              response.data.message.toLowerCase().includes('exists') ||
              response.data.message.toLowerCase().includes('name already taken') ||
              response.data.message.toLowerCase().includes('repository name') ||
              response.data.message.toLowerCase().includes('name is already') ||
              response.data.message.toLowerCase().includes('already in use') ||
              response.data.message.toLowerCase().includes('user already has') ||
              response.data.message.toLowerCase().includes('already has repository') ||
              response.data.message.toLowerCase().includes('already in database')
            );
            
            console.log(`🔍 [CSV-UPLOAD] Success indicators:`, {
              hasSuccessFlag,
              hasSuccessMessage,
              hasDirectSuccess,
              hasSuccessStatus,
              repoAlreadyExists
            });
            
            // Only mark as successful if we have a clear success result AND it's not just "already exists"
            if (userResult && !repoAlreadyExists) {
              console.log(`✅ [CSV-UPLOAD] Success for ${username}:`, userResult);
              results.successful.push(username);
              setProcessingResults(prev => ({
                ...prev,
                successful: [...prev.successful, username]
              }));
            } else if (repoAlreadyExists) {
              console.log(`⚠️ [CSV-UPLOAD] Repository already exists for ${username}:`, response.data.message);
              results.unsuccessful.push(username);
              setProcessingResults(prev => ({
                ...prev,
                unsuccessful: [...prev.unsuccessful, username]
              }));
            } else if (hasDirectSuccess || hasSuccessFlag || hasSuccessMessage) {
              // Only use these indicators if we don't have a clear "already exists" message
              console.log(`✅ [CSV-UPLOAD] Success for ${username}:`, 'Success indicators found');
              results.successful.push(username);
              setProcessingResults(prev => ({
                ...prev,
                successful: [...prev.successful, username]
              }));
            } else {
              console.log(`❌ [CSV-UPLOAD] No success result found for ${username}`);
              
              // Check if user is in unsuccessful results (try both 'user' and 'username' fields)
              const userErrorResult = response.data.results?.unsuccessful?.find(result => 
                result.user === username || result.username === username
              );
              if (userErrorResult) {
                console.log(`❌ [CSV-UPLOAD] Error result for ${username}:`, userErrorResult);
              }
              
              // Check if there's a general error message
              if (response.data.error) {
                console.log(`❌ [CSV-UPLOAD] General error:`, response.data.error);
              }
              
              // Check if the response indicates failure in other ways
              const hasErrorFlag = response.data.success === false || response.data.success === 'false';
              const hasErrorMessage = response.data.message && (
                response.data.message.toLowerCase().includes('error') || 
                response.data.message.toLowerCase().includes('failed') ||
                response.data.message.toLowerCase().includes('fail')
              );
              
              console.log(`🔍 [CSV-UPLOAD] Error indicators:`, {
                hasErrorFlag,
                hasErrorMessage,
                hasErrorStatus: response.status >= 400
              });
              
              // If we have clear error indicators, mark as failed
              if (userErrorResult || response.data.error || hasErrorFlag || hasErrorMessage || response.status >= 400) {
                results.unsuccessful.push(username);
                setProcessingResults(prev => ({
                  ...prev,
                  unsuccessful: [...prev.unsuccessful, username]
                }));
              } else {
                // If we can't determine success or failure, be conservative and mark as failed
                console.log(`⚠️ [CSV-UPLOAD] Ambiguous response for ${username}, marking as failed for safety`);
                results.unsuccessful.push(username);
                setProcessingResults(prev => ({
                  ...prev,
                  unsuccessful: [...prev.unsuccessful, username]
                }));
              }
            }
          } catch (error) {
            console.error(`❌ [CSV-UPLOAD] Error creating repo for ${username}:`, error);
            results.unsuccessful.push(username);
            setProcessingResults(prev => ({
              ...prev,
              unsuccessful: [...prev.unsuccessful, username]
            }));
          }
        }

        // Final update
        setProcessedCount(usernames.length);
        setCreateReposStatus(`🎉 Processing completed! ${results.successful.length} successful, ${results.unsuccessful.length} failed.`);
        
        // Refresh student data after processing
        setTimeout(() => {
          fetchOrganizationRepos(organizationGh, classInfo);
          setShowModal(false);
          setCsvFile(null);
          setIsProcessing(false);
        }, 5000);
      };

      reader.readAsText(csvFile);
    } catch (error) {
      console.error('❌ [CSV-UPLOAD] Error:', error);
      setCreateReposStatus(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <Container maxWidth="lg" sx={{ py: 4, width: '100%', textAlign: 'left' }}>
        {/* Page Title */}
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
          Manage Students
        </Typography>
        {/* Action Buttons - Moved Above Students Section */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 1, 
              px: 3, 
              py: 1.5, 
              bgcolor: '#fb5233', 
              color: 'white', 
              borderRadius: 4,
              height: 150,
              fontWeight: 500,
              minWidth: 120,
              cursor: 'pointer',
              '&:hover': { 
                bgcolor: '#e64a19'
              }
            }}
            onClick={() => setShowModal(true)}
            >
              <GroupIcon sx={{ fontSize: '2rem', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', textAlign: 'center' }}>
                Add Students
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.9 }}>
                Upload CSV or add manually
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 1, 
              px: 3, 
              py: 1.5, 
              bgcolor: '#2196f3', 
              color: 'white', 
              borderRadius: 4,
              height: 150,
              fontWeight: 500,
              minWidth: 120,
              cursor: 'pointer',
              '&:hover': { 
                bgcolor: '#1976d2'
              }
            }}
            onClick={() => setShowInviteLinkModal(true)}
            >
              <AddIcon sx={{ fontSize: '2rem', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', textAlign: 'center' }}>
                Add by Invite Link
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.9 }}>
                Share link with students
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Students Section */}
        <Card sx={{ 
          mb: 4, 
          borderRadius: 4, 
          boxShadow: 'none' 
        }}>
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
                Students
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
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
                  {isEditMode ? "Exit Edit Mode" : "Edit Student List"}
                </Button>
              </Box>
            </Box>
            {isLoading ? (
              <Box textAlign="center" py={4}>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography>Loading repositories...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            ) : studentData.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  No student repositories found for this class.
                </Typography>
              </Box>
            ) : (
              <List>
                {studentData.map((username, index) => {
                  // Define a set of colors for the icons
                  const colors = [
                    '#1976d2', // blue
                    '#9c27b0', // purple
                    '#f57c00', // orange
                    '#388e3c', // green
                    '#d32f2f', // red
                    '#7b1fa2', // deep purple
                    '#ff6f00', // amber
                    '#2e7d32'  // dark green
                  ];
                  const colorIndex = index % colors.length;
                  const iconColor = colors[colorIndex];

                  return (
                    <ListItem key={index} sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      borderBottom: '1px solid #e0e0e0',
                      '&:last-child': { borderBottom: 'none' }
                    }}>
                      <AccountCircleIcon 
                        sx={{ 
                          mr: 2, 
                          color: iconColor, 
                          opacity: 0.6, 
                          fontSize: '1.5rem',
                          mt: 0.5
                        }} 
                      />
                      <ListItemText primary={username} />
                      <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push elements apart */}
                      <Button
                        variant="contained"
                        startIcon={<DeleteIcon sx={{ fontSize: '0.7rem' }} />}
                        onClick={() => openDeleteDialog(username)}
                        sx={{ 
                          borderRadius: 4, 
                          fontWeight: 'bold', 
                          px: 2, 
                          py: 1,
                          boxShadow: 'none',
                          border: 'none',
                          bgcolor: isEditMode ? '#f5f5f5' : 'transparent',
                          color: isEditMode ? '#666' : 'transparent',
                          visibility: isEditMode ? 'visible' : 'hidden',
                          '&:hover': {
                            bgcolor: isEditMode ? '#e0e0e0' : 'transparent',
                            boxShadow: 'none'
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
            )}
            
          </Box>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
          <DialogTitle>Delete Student Repository</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the repository for student <strong>{selectedStudent}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action will permanently delete the repository and cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleDeleteRepository(selectedStudent)} 
              color="error" 
              variant="contained"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Repository'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Students Modal */}
        <Dialog 
          open={showModal} 
          onClose={() => {
            if (!isProcessing) {
              setShowModal(false);
              setCsvFile(null);
            }
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: 'none',
              border: '1px solid #e0e0e0'
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid #e0e0e0',
            pb: 2,
            mb: 0
          }}>
            <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
              {isProcessing ? 'Creating Repositories...' : 'Upload GitHub Usernames'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {isProcessing ? (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Processing Users ({processedCount}/{totalUsers})
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(processedCount / totalUsers) * 100}
                  sx={{ mb: 3, height: 8, borderRadius: 4 }}
                />
                {currentProcessingUser && (
                  <Alert severity="info" sx={{ mb: 3, borderRadius: 4 }}>
                    <Typography variant="body2">
                      Currently processing: <strong>{currentProcessingUser}</strong>
                    </Typography>
                  </Alert>
                )}
                
                {processingResults.successful.length > 0 && (
                  <Paper sx={{ p: 3, mb: 3, bgcolor: '#f0f9ff', borderRadius: 4, border: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ fontWeight: 600 }}>
                      ✅ Successfully Created ({processingResults.successful.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {processingResults.successful.map(user => (
                        <Chip key={user} label={user} color="success" size="small" sx={{ borderRadius: 2 }} />
                      ))}
                    </Box>
                  </Paper>
                )}
                
                {processingResults.unsuccessful.length > 0 && (
                  <Paper sx={{ p: 3, mb: 3, bgcolor: '#fef2f2', borderRadius: 4, border: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" color="error.main" gutterBottom sx={{ fontWeight: 600 }}>
                      ❌ Failed ({processingResults.unsuccessful.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {processingResults.unsuccessful.map(user => (
                        <Chip key={user} label={user} color="error" size="small" sx={{ borderRadius: 2 }} />
                      ))}
                    </Box>
                  </Paper>
                )}
                
                {processedCount === totalUsers && (
                  <Alert severity="success" sx={{ mt: 3, borderRadius: 4 }}>
                    <Typography variant="body2">
                      🎉 Processing completed! {processingResults.successful.length} successful, {processingResults.unsuccessful.length} failed.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      ⏳ Refreshing student list... This dialog will close automatically.
                    </Typography>
                  </Alert>
                )}
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" sx={{ mb: 0, color: 'text.secondary', fontWeight: 500, mt: 2 }}>
                  This method will:
                </Typography>
                <List dense sx={{ mb: 0 }}>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="Create student accounts for each GitHub username" 
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="Create private repositories for each student with initial README" 
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="Send invitation emails to join the class" 
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="Set up quest system and initial tasks" 
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItem>
                </List>
                <Typography variant="body1" sx={{ mb: 0, color: 'text.secondary', fontWeight: 500, mt: 3 }}>
                  Upload a CSV file containing GitHub usernames (one per line)
                </Typography>
                <List dense sx={{ mb: 3 }}>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="File must be in .csv format" 
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="One GitHub username per line" 
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="First line can optionally be a header" 
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="Usernames must match existing GitHub accounts" 
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItem>
                </List>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    const csvContent = "github_username\njohndoe\njanesmith";
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'github_usernames_template.csv';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                  sx={{ 
                    mb: 3,
                    borderRadius: 4,
                    px: 3,
                    py: 1,
                    fontWeight: 'bold'
                  }}
                >
                  Download Template
                </Button>
                <Box>
                  <input 
                    type="file" 
                    id="csvFile"
                    accept=".csv" 
                    onChange={handleCsvUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="csvFile">
                    <Button 
                      variant="outlined" 
                      component="span"
                      sx={{ 
                        borderRadius: 4,
                        px: 3,
                        py: 1,
                        fontWeight: 'bold'
                      }}
                    >
                      {csvFile ? csvFile.name : 'Choose CSV file...'}
                    </Button>
                  </label>
                </Box>
                {createReposStatus && (
                  <Alert severity="info" sx={{ mt: 3, borderRadius: 4 }}>
                    {createReposStatus}
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            pt: 2,
            borderTop: '1px solid #e0e0e0'
          }}>
            {isProcessing ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                  Please wait while repositories are being created...
                </Typography>
                {processedCount === totalUsers && (
                  <Button 
                    onClick={() => {
                      setShowModal(false);
                      setCsvFile(null);
                      setIsProcessing(false);
                      setProcessingResults({ successful: [], unsuccessful: [] });
                    }}
                    variant="contained"
                    sx={{ 
                      borderRadius: 4,
                      px: 3,
                      py: 1,
                      fontWeight: 'bold',
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: 'none'
                      }
                    }}
                  >
                    Close
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  variant="contained" 
                  onClick={handleCreateRepos}
                  disabled={!csvFile}
                  sx={{ 
                    borderRadius: 4,
                    px: 3,
                    py: 1,
                    fontWeight: 'bold',
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none'
                    }
                  }}
                >
                  Create Repositories
                </Button>
                <Button 
                  onClick={() => {
                    setShowModal(false);
                    setCsvFile(null);
                  }}
                  sx={{ 
                    borderRadius: 4,
                    px: 3,
                    py: 1,
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Invite Link Modal */}
        <Dialog 
          open={showInviteLinkModal} 
          onClose={() => setShowInviteLinkModal(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: 'none',
              border: '1px solid #e0e0e0'
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid #e0e0e0',
            pb: 2,
            mb: 0
          }}>
            <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
              Generate Invite Link
            </Typography>
          </DialogTitle>

          
          
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body1" sx={{ mb: 0, color: 'text.secondary', mt: 2 }}>
              Share this link with students to invite them to join your class:
            </Typography>
            <Box sx={{ 
              mt: 2, 
              p: 3, 
              bgcolor: '#f8f9fa', 
              borderRadius: 4, 
              border: '1px solid #e0e0e0'
            }}>
              <Typography 
                variant="body2" 
                component="code" 
                sx={{ 
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: '#1976d2',
                  fontWeight: 500
                }}
              >
                {`${window.location.origin}/class/${classId}/invite`}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, lineHeight: 1.6 }}>
              Students can use this link to access the invite page where they can enter their GitHub username to create a repository.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            pt: 2,
            borderTop: '1px solid #e0e0e0',
            flexDirection: 'column',
            gap: 2
          }}>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/class/${classId}/invite`);
                // You could add a toast notification here
              }}
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
              sx={{ 
                borderRadius: 4,
                px: 3,
                py: 1,
                fontWeight: 'bold',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none'
                }
              }}
            >
              Copy Link
            </Button>
            <Button 
              onClick={() => setShowInviteLinkModal(false)}
              sx={{ 
                borderRadius: 4,
                px: 3,
                py: 1,
                fontWeight: 'bold'
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
};

export default ManageStudents;