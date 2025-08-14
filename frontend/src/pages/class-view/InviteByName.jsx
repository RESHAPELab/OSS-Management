import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  GitHub as GitHubIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import HomeHeader from '../home/components/HomeHeader';

const InviteByName = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [githubUsername, setGithubUsername] = useState('');
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [repoCreationStatus, setRepoCreationStatus] = useState('');
  const [questConfig, setQuestConfig] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentInvites, setRecentInvites] = useState([]);

  // Load quest configuration and class info on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Loading data for class:', classId);
        
        // Load quest configuration
        const questResponse = await axios.get(`http://localhost:8080/api/group/${classId}/quest-json-config`);
        
        if (questResponse.data.success && questResponse.data.data.hasConfig && questResponse.data.data.questJsonConfig) {
          console.log('✅ Loaded quest configuration');
          setQuestConfig(questResponse.data.data.questJsonConfig);
        } else {
          console.log('❌ No quest configuration found');
          setRepoCreationStatus('❌ No quest configuration found for this class. Please set up quests first.');
        }
        
        // Load class info
        const classResponse = await axios.get(`http://localhost:8080/api/group/class/${classId}`);
        if (classResponse.data) {
          console.log('✅ Loaded class info:', classResponse.data);
          setClassInfo(classResponse.data);
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setRepoCreationStatus('❌ Error loading data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (classId) {
      loadData();
    }
  }, [classId]);

  // Create repository for student
  const handleInviteStudent = async () => {
    if (!githubUsername.trim()) {
      setRepoCreationStatus('❌ Please enter a GitHub username');
      return;
    }

    if (!questConfig) {
      setRepoCreationStatus('❌ No quest configuration available. Please set up quests first.');
      return;
    }

    try {
      setIsCreatingRepo(true);
      setRepoCreationStatus('🔄 Creating your repository...');
              console.log('🚀 Student joining class:', githubUsername);
      console.log('📄 Using quest configuration:', questConfig);

      // Get the class name from class info or use a default
      const className = classInfo?.groupName || 'class';
      console.log('🔍 Using class name:', className, 'from classInfo:', classInfo);
      
      const response = await axios.post('http://localhost:8080/api/repo/createCustomRepos', {
        users: [githubUsername],
        customSequence: questConfig,
        className: className,
        classId: classId
      });

      console.log('📋 Full response from server:', response.data);
      
      // Check if the response has results
      if (response.data.results) {
        const { successful, unsuccessful } = response.data.results;
        
        // Check for successful repository creation
        if (successful && successful.length > 0) {
          const repoInfo = successful[0];
          const repoUrl = repoInfo.repoUrl;
          const successMessage = `✅ Welcome to the class! 
Repository: ${repoUrl}
You can now start your quest journey!`;
          
          setRepoCreationStatus(successMessage);
          
          // Add to recent invites
          setRecentInvites(prev => [{
            username: githubUsername,
            repoUrl: repoUrl,
            timestamp: new Date().toLocaleString(),
            status: 'success'
          }, ...prev.slice(0, 4)]); // Keep only last 5
          
          // Clear the input
          setGithubUsername('');
          
          console.log('✅ Repository creation successful:', response.data);
        } 
        // Check for unsuccessful repository creation
        else if (unsuccessful && unsuccessful.length > 0) {
          const errorInfo = unsuccessful[0];
          const error = errorInfo.error || errorInfo.message || 'Unknown error';
          const errorMessage = `❌ Repository creation failed: ${error}`;
          setRepoCreationStatus(errorMessage);
          
          // Add to recent invites as failed
          setRecentInvites(prev => [{
            username: githubUsername,
            error: error,
            timestamp: new Date().toLocaleString(),
            status: 'error'
          }, ...prev.slice(0, 4)]);
          
          console.error('❌ Repository creation failed:', response.data);
        } 
        // No results in either array
        else {
          setRepoCreationStatus('❌ No repository creation results returned');
          console.error('❌ No results in response:', response.data);
        }
      } 
      // Check for direct message response
      else if (response.data.message) {
        setRepoCreationStatus(`✅ ${response.data.message}`);
        console.log('✅ Repository creation completed:', response.data);
      } 
      // Unexpected response structure
      else {
        setRepoCreationStatus('❌ Unexpected response from server');
        console.error('❌ Unexpected response structure:', response.data);
      }
    } catch (error) {
      console.error('❌ Error creating repository:', error);
      const errorMessage = `❌ Error creating repository: ${error.response?.data?.message || error.message}`;
      setRepoCreationStatus(errorMessage);
      
      // Add to recent invites as failed
      setRecentInvites(prev => [{
        username: githubUsername,
        error: error.response?.data?.message || error.message,
        timestamp: new Date().toLocaleString(),
        status: 'error'
      }, ...prev.slice(0, 4)]);
    } finally {
      setIsCreatingRepo(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && githubUsername.trim() && !isCreatingRepo && questConfig) {
      handleInviteStudent();
    }
  };

  // Get quest stats
  const getQuestStats = () => {
    if (!questConfig || !questConfig.questSequence) return { questCount: 0, totalTasks: 0 };
    
    const questCount = questConfig.questSequence.length;
    const totalTasks = questConfig.questSequence.reduce((total, quest) => {
      return total + Object.keys(quest.tasks || {}).length;
    }, 0);
    
    return { questCount, totalTasks };
  };

  const { questCount, totalTasks } = getQuestStats();

  if (isLoading) {
    return (
      <div>
        <HomeHeader />
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading Quest Configuration...
            </Typography>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
            Join {classInfo?.groupName || 'Class'}
          </Typography>
        </Box>

        {/* Quest Configuration Summary */}
        {questConfig && (
          <Card sx={{ mb: 4 }}>
            <Box p={3}>
              <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
                <Chip 
                  label={`${questCount} Quests`} 
                  color="primary" 
                />
                <Chip 
                  label={`${totalTasks} Total Tasks`} 
                  color="secondary" 
                />
              </Stack>
            </Box>
          </Card>
        )}

        {/* Invite Form */}
        <Card sx={{ mb: 4 }}>
          <Box p={3}>
            <Typography variant="h5" component="h2" gutterBottom display="flex" alignItems="center">
              <PersonAddIcon sx={{ mr: 1 }} />
              Join {classInfo?.groupName || 'Class'}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Welcome! Enter your GitHub username below to get your personalized quest repository and start your learning journey.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3 }}>
              <TextField
                label="Your GitHub Username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="your-github-username"
                fullWidth
                helperText="Enter your GitHub username to get started (Press Enter to join)"
                disabled={isCreatingRepo || !questConfig}
                InputProps={{
                  startAdornment: <GitHubIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              
              <Button
                variant="contained"
                size="large"
                onClick={handleInviteStudent}
                disabled={isCreatingRepo || !githubUsername.trim() || !questConfig}
                startIcon={isCreatingRepo ? <CircularProgress size={20} /> : <PersonAddIcon />}
                sx={{
                  bgcolor: '#4caf50',
                  '&:hover': { bgcolor: '#388e3c' },
                  fontWeight: 'bold',
                  py: 1.5,
                  px: 3,
                  minWidth: '180px',
                  whiteSpace: 'nowrap'
                }}
              >
                {isCreatingRepo ? 'Setting up...' : 'Start Quest'}
              </Button>
            </Box>

            {repoCreationStatus && (
              <Alert 
                severity={repoCreationStatus.startsWith('✅') ? 'success' : repoCreationStatus.startsWith('🔄') ? 'info' : 'error'} 
                sx={{ mt: 2 }}
              >
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {repoCreationStatus}
                </Typography>
              </Alert>
            )}
          </Box>
        </Card>


      </Container>
    </div>
  );
};

export default InviteByName; 