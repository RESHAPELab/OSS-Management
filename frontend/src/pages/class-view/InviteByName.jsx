import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
  Stack,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  GitHub as GitHubIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import HomeHeader from "../home/components/HomeHeader";
import API_CONFIG from "../../config/api";

const InviteByName = () => {
  const baseURL = API_CONFIG.getBaseURL();

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
  const navigate = useNavigate();
  const [githubUsername, setGithubUsername] = useState("");
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [repoCreationStatus, setRepoCreationStatus] = useState("");
  const [questConfig, setQuestConfig] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentInvites, setRecentInvites] = useState([]);
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
            "❌ This class isn't ready for new students yet. Please contact your professor."
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
        setRepoCreationStatus("❌ Unable to load class information. Please refresh the page or contact your professor.");
      } finally {
        setIsLoading(false);
      }
    };

    if (classId) {
      loadData();
    }
  }, [classId]);

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
      setRepoCreationStatus(`❌ ${usernameValidationError}`);
      setUsernameError(usernameValidationError);
      return;
    }

    if (!questConfig) {
      setRepoCreationStatus(
        "❌ This class isn't ready for new students yet. Please contact your professor."
      );
      return;
    }

    try {
      setIsCreatingRepo(true);
      setRepoCreationStatus("🔄 Creating your repository...");
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
          const successMessage = `✅ Welcome to the class! 
Repository: ${repoUrl}
You can now start your quest journey!`;

          setRepoCreationStatus(successMessage);

          // Add to recent invites
          setRecentInvites((prev) => [
            {
              username: githubUsername,
              repoUrl: repoUrl,
              timestamp: new Date().toLocaleString(),
              status: "success",
            },
            ...prev.slice(0, 4),
          ]); // Keep only last 5

          // Clear the input
          setGithubUsername("");

          console.log("✅ Repository creation successful:", response.data);
        }
        // Check for unsuccessful repository creation
        else if (unsuccessful && unsuccessful.length > 0) {
          const errorInfo = unsuccessful[0];
          const technicalError = errorInfo.error || errorInfo.message || "Unknown error";
          const friendlyError = getUserFriendlyError(technicalError);
          setRepoCreationStatus(`❌ ${friendlyError}`);

          // Add to recent invites as failed
          setRecentInvites((prev) => [
            {
              username: githubUsername,
              error: friendlyError,
              timestamp: new Date().toLocaleString(),
              status: "error",
            },
            ...prev.slice(0, 4),
          ]);

          console.error("❌ Repository creation failed:", response.data);
        }
        // No results in either array
        else {
          setRepoCreationStatus("❌ Something went wrong while setting up your account. Please try again or contact your professor.");
          console.error("❌ No results in response:", response.data);
        }
      }
      // Check for direct message response
      else if (response.data.message) {
        setRepoCreationStatus(`✅ ${response.data.message}`);
        console.log("✅ Repository creation completed:", response.data);
      }
      // Unexpected response structure
      else {
        setRepoCreationStatus("❌ Something went wrong while setting up your account. Please try again or contact your professor.");
        console.error("❌ Unexpected response structure:", response.data);
      }
    } catch (error) {
      console.error("❌ Error creating repository:", error);
      const technicalError = error.response?.data?.message || error.message;
      const friendlyError = getUserFriendlyError(technicalError);
      setRepoCreationStatus(`❌ ${friendlyError}`);

      // Add to recent invites as failed
      setRecentInvites((prev) => [
        {
          username: githubUsername,
          error: friendlyError,
          timestamp: new Date().toLocaleString(),
          status: "error",
        },
        ...prev.slice(0, 4),
      ]);
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
        </Box>

        {/* Quest Configuration Summary */}
        {questConfig && (
          <Card sx={{ mb: 4 }}>
            <Box p={3}>
              <Stack
                direction="row"
                spacing={2}
                mb={3}
                flexWrap="wrap"
                useFlexGap
              >
                <Chip label={`${questCount} Quests`} color="primary" />
                <Chip label={`${totalTasks} Total Tasks`} color="secondary" />
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
              <PersonAddIcon sx={{ mr: 1 }} />
              Join {classInfo?.groupName || "Class"}
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              Welcome! Enter your GitHub username below to get your personalized
              quest repository and start your learning journey.
            </Typography>

            <Box
              sx={{ display: "flex", gap: 2, alignItems: "flex-start", mb: 3 }}
            >
              <TextField
                label="Your GitHub Username"
                value={githubUsername}
                onChange={handleUsernameChange}
                onKeyPress={handleKeyPress}
                placeholder="your-github-username"
                fullWidth
                helperText={usernameError || "Enter your GitHub username to get started (Press Enter to join)"}
                error={!!usernameError}
                disabled={isCreatingRepo || !questConfig}
                InputProps={{
                  startAdornment: (
                    <GitHubIcon sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleInviteStudent}
                disabled={
                  isCreatingRepo || !githubUsername.trim() || !questConfig
                }
                startIcon={
                  isCreatingRepo ? (
                    <CircularProgress size={20} />
                  ) : (
                    <PersonAddIcon />
                  )
                }
                sx={{
                  bgcolor: "#4caf50",
                  "&:hover": { bgcolor: "#388e3c" },
                  fontWeight: "bold",
                  py: 1.5,
                  px: 3,
                  minWidth: "180px",
                  whiteSpace: "nowrap",
                }}
              >
                {isCreatingRepo ? "Setting up..." : "Join Class"}
              </Button>
            </Box>

            {repoCreationStatus && (
              <Alert
                severity={
                  repoCreationStatus.startsWith("✅")
                    ? "success"
                    : repoCreationStatus.startsWith("🔄")
                    ? "info"
                    : "error"
                }
                sx={{ mt: 2 }}
              >
                <Typography
                  component="pre"
                  sx={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}
                >
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
