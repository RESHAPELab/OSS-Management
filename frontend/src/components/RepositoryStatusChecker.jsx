import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  TextField,
  Divider,
} from "@mui/material";
import {
  CheckCircle as AcceptedIcon,
  Schedule as PendingIcon,
  Help as UnknownIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import API_CONFIG from "../config/api";

export default function RepositoryStatusChecker({
  classInfo,
  organizationGh = "OSS-Doorway-Dev",
}) {
  const baseURL = API_CONFIG.getBaseURL();

  const [usernames, setUsernames] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [statusResults, setStatusResults] = useState(null);

  const checkRepositoryStatus = async () => {
    if (!usernames.trim()) {
      alert("Please enter GitHub usernames to check");
      return;
    }

    if (!classInfo?.groupName) {
      alert("Class information not available");
      return;
    }

    setIsChecking(true);
    console.log("🔍 [REPO-STATUS] Starting repository status check");

    try {
      // Parse usernames (comma-separated or line-separated)
      const usernameList = usernames
        .split(/[,\n]/)
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      console.log(
        "👥 [REPO-STATUS] Checking status for usernames:",
        usernameList
      );

      const response = await fetch(`${baseURL}/api/repo/collaborationStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationGh,
          students: usernameList,
          className: classInfo.groupName,
        }),
      });

      const data = await response.json();
      console.log("📊 [REPO-STATUS] Status check response:", data);

      if (response.ok && data.results) {
        setStatusResults(data.results);
        console.log("✅ [REPO-STATUS] Status updated:", data.results);
      } else {
        alert(
          `Error checking repository status: ${data.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error(
        "💥 [REPO-STATUS] Error checking repository status:",
        error
      );
      alert(`Error checking repository status: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (username) => {
    if (!statusResults) return <UnknownIcon color="disabled" />;

    if (statusResults.accepted?.includes(username)) {
      return <AcceptedIcon color="success" />;
    } else if (statusResults.pending?.includes(username)) {
      return <PendingIcon color="warning" />;
    } else {
      return <UnknownIcon color="error" />;
    }
  };

  const getStatusChip = (username) => {
    if (!statusResults) return null;

    if (statusResults.accepted?.includes(username)) {
      return <Chip label="✅ Accepted" color="success" size="small" />;
    } else if (statusResults.pending?.includes(username)) {
      return <Chip label="⏳ Pending" color="warning" size="small" />;
    } else {
      return <Chip label="❓ Not Found" color="error" size="small" />;
    }
  };

  const getRepositoryUrl = (username) => {
    if (!classInfo?.groupName) return null;

    const formattedClassName = classInfo.groupName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const repoName = `${username}-${formattedClassName}`;
    return `https://github.com/${organizationGh}/${repoName}`;
  };

  const allUsernames = usernames
    .split(/[,\n]/)
    .map((u) => u.trim())
    .filter((u) => u.length > 0);

  return (
    <Paper
      sx={{
        p: 3,
        mt: 2,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        bgcolor: "#f9f9f9",
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: "#1976d2" }}>
        🔍 Repository Status Checker
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Check the collaboration status of repositories for specific GitHub
        usernames.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="GitHub Usernames"
          placeholder="Enter GitHub usernames (comma-separated or one per line)&#10;Example: johndoe, janesmith, alicedev"
          value={usernames}
          onChange={(e) => setUsernames(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="contained"
            onClick={checkRepositoryStatus}
            disabled={isChecking || !usernames.trim() || !classInfo?.groupName}
            startIcon={isChecking ? <RefreshIcon /> : <SearchIcon />}
            sx={{ minWidth: "140px" }}
          >
            {isChecking ? "Checking..." : "Check Status"}
          </Button>

          {classInfo?.groupName && (
            <Typography variant="body2" color="text.secondary">
              Class: <strong>{classInfo.groupName}</strong>
            </Typography>
          )}
        </Box>
      </Box>

      {!classInfo?.groupName && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Class information not available. Please refresh the page to load class
          data.
        </Alert>
      )}

      {statusResults && allUsernames.length > 0 && (
        <Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            📊 Repository Status Results
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Chip
              label={`✅ Accepted: ${statusResults.accepted?.length || 0}`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`⏳ Pending: ${statusResults.pending?.length || 0}`}
              color="warning"
              variant="outlined"
            />
            <Chip
              label={`❓ Not Found: ${statusResults.notFound?.length || 0}`}
              color="error"
              variant="outlined"
            />
          </Box>

          <List>
            {allUsernames.map((username, index) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <ListItemIcon>{getStatusIcon(username)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {username}
                      </Typography>
                      {getStatusChip(username)}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        Repository:{" "}
                        <a
                          href={getRepositoryUrl(username)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "#1976d2" }}
                        >
                          {username}-
                          {classInfo?.groupName
                            ?.toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")}
                        </a>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last checked: {new Date().toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
}
