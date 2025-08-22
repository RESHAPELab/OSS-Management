import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import {
  GitHub as GitHubIcon,
} from "@mui/icons-material";
import HomeHeader from "../home/components/HomeHeader";
import { API_BASE_URL, BOT_BASE_URL } from "../../config/api";

const InviteByName = () => {
  const baseURL = API_BASE_URL;

  // Convert technical errors to user-friendly messages
  const getUserFriendlyError = (error) => {
    const errorStr = error?.toLowerCase() || '';
    
    // GitHub username not found
    if (errorStr.includes('user not found') || errorStr.includes('404') || errorStr.includes('does not exist')) {
      return "This GitHub username doesn't exist. Please check the spelling and try again.";
    }
    
    // Repository already exists
    if (errorStr.includes('already exists') || errorStr.includes('repository exists')) {
      return "You've already been invited to this class! Check your GitHub repositories.";
    }
    
    // Permission/access issues
    if (errorStr.includes('permission') || errorStr.includes('access') || errorStr.includes('forbidden')) {
      return "There was a permission issue. Please contact your professor for assistance.";
    }
    
    // Network/connection issues
    if (errorStr.includes('network') || errorStr.includes('timeout') || errorStr.includes('connection')) {
      return "There was a connection issue. Please check your internet and try again.";
    }
    
    // Rate limiting
    if (errorStr.includes('rate limit') || errorStr.includes('too many requests')) {
      return "We're processing too many requests right now. Please wait a minute and try again.";
    }
    
    // Invalid username format
    if (errorStr.includes('invalid') && errorStr.includes('username')) {
      return "Please enter a valid GitHub username (letters, numbers, and hyphens only).";
    }
    
    // Server errors
    if (errorStr.includes('500') || errorStr.includes('internal server error')) {
      return "Our system is experiencing technical difficulties. Please try again in a few minutes.";
    }
    
    // Default friendly message for unknown errors
    return "Something went wrong while setting up your account. Please contact your professor for help.";
  };

  const { classId } = useParams();
  const [githubUsername, setGithubUsername] = useState("");
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [repoCreationStatus, setRepoCreationStatus] = useState("");
  const [questConfig, setQuestConfig] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usernameError, setUsernameError] = useState("");

  // Load quest configuration and class info on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log("🔄 Loading data for class:", classId);

        // Load quest configuration
        const questResponse = await axios.get(
          `${baseURL}/api/group/${classId}/quest-json-config`
        );

        if (
          questResponse.data.success &&
          questResponse.data.data.hasConfig &&
          questResponse.data.data.questJsonConfig
        ) {
          console.log("✅ Loaded quest configuration");
          setQuestConfig(questResponse.data.data.questJsonConfig);
        } else {
          console.log("❌ No quest configuration found");
          setRepoCreationStatus(
            "This class isn't ready for new students yet. Please contact your professor."
          );
        }

        // Load class info
        const classResponse = await axios.get(
          `${baseURL}/api/group/class/${classId}`
        );
        if (classResponse.data) {
          console.log("✅ Loaded class info:", classResponse.data);
          setClassInfo(classResponse.data);
        }
      } catch (error) {
        console.error("❌ Error loading data:", error);
        setRepoCreationStatus("Unable to load class information. Please refresh the page or contact your professor.");
      } finally {
        setIsLoading(false);
      }
    };

    if (classId) {
      loadData();
    }
  }, [classId, baseURL]);

  // Validate GitHub username format
  const validateUsername = (username) => {
    const trimmed = username.trim();
    
    if (!trimmed) {
      return "Please enter your GitHub username";
    }
    
    // GitHub username rules: 
    // - May only contain alphanumeric characters or single hyphens
    // - Cannot begin or end with a hyphen
    // - Maximum 39 characters
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmed)) {
      return "GitHub usernames can only contain letters, numbers, and hyphens (no spaces or special characters)";
    }
    
    if (trimmed.length > 39) {
      return "GitHub usernames must be 39 characters or less";
    }
    
    if (trimmed.includes('--')) {
      return "GitHub usernames cannot have consecutive hyphens";
    }
    
    return "";
  };

  // Handle username input change with validation
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setGithubUsername(value);
    setUsernameError(validateUsername(value));
  };

  // Create repository for student
  const handleInviteStudent = async () => {
    const usernameValidationError = validateUsername(githubUsername);
    if (usernameValidationError) {
      setRepoCreationStatus(usernameValidationError);
      setUsernameError(usernameValidationError);
      return;
    }

    if (!questConfig) {
      setRepoCreationStatus(
        "This class isn't ready for new students yet. Please contact your professor."
      );
      return;
    }

    try {
      setIsCreatingRepo(true);
      setRepoCreationStatus("Creating your repository...");
      console.log("🚀 Student joining class:", githubUsername);
      console.log("📄 Using quest configuration:", questConfig);

      // Get the class name from class info or use a default
      const className = classInfo?.groupName || "class";
      console.log(
        "🔍 Using class name:",
        className,
        "from classInfo:",
        classInfo
      );

      const response = await axios.post(
        `${baseURL}/api/repo/createCustomRepos`,
        {
          users: [githubUsername],
          customSequence: questConfig,
          className: className,
          classId: classId,
        }
      );

      console.log("📋 Full response from server:", response.data);

      // Check if the response has results
      if (response.data.results) {
        const { successful, unsuccessful } = response.data.results;

        // Check for successful repository creation
        if (successful && successful.length > 0) {
          const repoInfo = successful[0];
          const repoUrl = repoInfo.repoUrl;
          const successMessage = `Welcome to the class! 
Repository: ${repoUrl}
You can now start your quest journey!`;

          setRepoCreationStatus(successMessage);

          // Clear the input
          setGithubUsername("");

          console.log("✅ Repository creation successful:", response.data);
        }
        // Check for unsuccessful repository creation
        else if (unsuccessful && unsuccessful.length > 0) {
          // Check if the error is actually a successful creation that was misreported
          const errorInfo = unsuccessful[0];
          const technicalError = errorInfo.error || errorInfo.message || "Unknown error";
          
          // If the main message indicates success, treat it as success
          if (response.data.message && response.data.message.includes("completed")) {
            const successMessage = `Welcome to the class! 
Your repository has been created successfully.
You can now start your quest journey!`;

            setRepoCreationStatus(successMessage);

            // Clear the input
            setGithubUsername("");

            console.log("✅ Repository creation completed (treated as success):", response.data);
          } else {
            // Actually failed
            const friendlyError = getUserFriendlyError(technicalError);
            setRepoCreationStatus(`❌ ${friendlyError}`);



            console.error("❌ Repository creation failed:", response.data);
          }
        }
        // No results in either array
        else {
                  setRepoCreationStatus("Something went wrong while setting up your account. Please try again or contact your professor.");
        console.error("❌ No results in response:", response.data);
        }
      }
      // Check for direct message response indicating success
      else if (response.data.message && response.data.message.includes("completed")) {
        const successMessage = `Welcome to the class! 
Your repository has been created successfully.
You can now start your quest journey!`;

        setRepoCreationStatus(successMessage);

        // Clear the input
        setGithubUsername("");

        console.log("✅ Repository creation completed:", response.data);
      }
      // Other message responses
      else if (response.data.message) {
        setRepoCreationStatus(response.data.message);
        console.log("✅ Repository creation completed:", response.data);
      }
      // Unexpected response structure
      else {
        setRepoCreationStatus("Something went wrong while setting up your account. Please try again or contact your professor.");
        console.error("❌ Unexpected response structure:", response.data);
      }
    } catch (error) {
      console.error("❌ Error creating repository:", error);
      const technicalError = error.response?.data?.message || error.message;
      const friendlyError = getUserFriendlyError(technicalError);
      setRepoCreationStatus(friendlyError);
    } finally {
      setIsCreatingRepo(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (
      e.key === "Enter" &&
      githubUsername.trim() &&
      !isCreatingRepo &&
      questConfig
    ) {
      handleInviteStudent();
    }
  };

  // Get quest stats
  const getQuestStats = () => {
    if (!questConfig || !questConfig.questSequence)
      return { questCount: 0, totalTasks: 0 };

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
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="400px"
          >
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
            Join {classInfo?.groupName || "Class"}
          </Typography>
          
          <Typography 
            variant="h5" 
            color="text.primary" 
            sx={{ 
              fontWeight: 600, 
              mt: 1,
              fontSize: '1.3rem'
            }}
          >
            Professor {classInfo?.professorName ? 
              classInfo.professorName.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ') 
              : 'Seo Fake'} has invited you to join this exciting learning journey!
          </Typography>
        </Box>

        {/* Quest Configuration Summary */}
        {questConfig && (
          <Card sx={{ mb: 4 }}>
            <Box p={3}>
              <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 1, 
                  px: 3, 
                  py: 1.5, 
                  bgcolor: '#ff5722', 
                  color: 'white', 
                  borderRadius: 4,
                  height: 150,
                  fontWeight: 500,
                  minWidth: 120
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Quests
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '2.5rem', color: 'white' }}>
                    {questCount}
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
                  bgcolor: 'primary.main', 
                  color: 'white', 
                  borderRadius: 4,
                  height: 150,
                  fontWeight: 500,
                  minWidth: 120
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Total Tasks
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '2.5rem' }}>
                    {totalTasks}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
        )}

        {/* Invite Form */}
        <Card sx={{ mb: 4 }}>
          <Box p={3}>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              display="flex"
              alignItems="center"
            >
              <GitHubIcon sx={{ mr: 1 }} />
              Join {classInfo?.groupName || "Class"}
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              Welcome! Enter your GitHub username below to get your personalized
              quest repository and start your learning journey.
            </Typography>

            <Box sx={{ mb: 3 }}>
              {/* Modern Input Field */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                p: 2,
                border: usernameError ? '2px solid #f44336' : '2px solid #e0e0e0',
                borderRadius: 3,
                bgcolor: 'white',
                transition: 'border-color 0.2s ease',
                '&:focus-within': {
                  borderColor: '#1976d2',
                  boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                },
                mb: 1
              }}>
                <Box sx={{ flex: 1 }}>
                   <input
                     type="text"
                     value={githubUsername}
                     onChange={handleUsernameChange}
                     onKeyPress={handleKeyPress}
                     placeholder="your-github-username"
                     disabled={isCreatingRepo || !questConfig}
                     style={{
                       width: '100%',
                       border: 'none',
                       outline: 'none',
                       fontSize: '1.1rem',
                       fontWeight: 500,
                       fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                       color: '#2c3e50',
                       backgroundColor: 'transparent',
                       padding: '2px 0'
                     }}
                   />
                 </Box>
                <Button
                  variant="contained"
                  onClick={handleInviteStudent}
                  disabled={
                    isCreatingRepo || !githubUsername.trim() || !questConfig
                  }
                  startIcon={
                    isCreatingRepo ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <GitHubIcon />
                    )
                  }
                  sx={{
                    bgcolor: "#4caf50",
                    "&:disabled": { bgcolor: "#e0e0e0" },
                    fontWeight: "600",
                    py: 1.5,
                    px: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    minWidth: "140px",
                    whiteSpace: "nowrap",
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: "#388e3c",
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  {isCreatingRepo ? "Setting up..." : "Join Class"}
                </Button>
              </Box>
              
              {/* Helper Text */}
              <Typography variant="body2" sx={{ 
                color: usernameError ? '#f44336' : 'text.secondary',
                ml: 1,
                fontSize: '0.875rem'
              }}>
                {usernameError || "Enter your GitHub username and press the button or Enter key to join"}
              </Typography>
            </Box>

            {repoCreationStatus && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                borderRadius: 2,
                bgcolor: repoCreationStatus.includes("Welcome to the class") || repoCreationStatus.includes("completed") || repoCreationStatus.includes("successfully")
                  ? '#e8f5e8'
                  : repoCreationStatus.includes("Creating your repository")
                  ? '#e3f2fd'
                  : '#ffebee',
                border: repoCreationStatus.includes("Welcome to the class") || repoCreationStatus.includes("completed") || repoCreationStatus.includes("successfully")
                  ? '1px solid #4caf50'
                  : repoCreationStatus.includes("Creating your repository")
                  ? '1px solid #2196f3'
                  : '1px solid #f44336',
                color: repoCreationStatus.includes("Welcome to the class") || repoCreationStatus.includes("completed") || repoCreationStatus.includes("successfully")
                  ? '#2e7d32'
                  : repoCreationStatus.includes("Creating your repository")
                  ? '#1976d2'
                  : '#c62828'
              }}>
                <Typography
                  sx={{ 
                    whiteSpace: "pre-wrap", 
                    fontFamily: "inherit",
                    fontWeight: repoCreationStatus.includes("Welcome to the class") || repoCreationStatus.includes("completed") || repoCreationStatus.includes("successfully")
                      ? 700
                      : 400
                  }}
                >
                  {repoCreationStatus.split('\n').map((line, index) => {
                    // Check if line contains a GitHub URL
                    if (line.includes('https://github.com/')) {
                      const urlMatch = line.match(/(https:\/\/github\.com\/[^\s]+)/);
                      if (urlMatch) {
                        const url = urlMatch[1];
                        const beforeUrl = line.substring(0, line.indexOf(url));
                        const afterUrl = line.substring(line.indexOf(url) + url.length);
                        return (
                          <div key={index}>
                            {beforeUrl}
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                color: '#1976d2', 
                                textDecoration: 'underline',
                                fontWeight: 'bold'
                              }}
                            >
                              {url}
                            </a>
                            {afterUrl}
                          </div>
                        );
                      }
                    }
                    return <div key={index}>{line}</div>;
                  })}
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      </Container>
    </div>
  );
};

export default InviteByName;
