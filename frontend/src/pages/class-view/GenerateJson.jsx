import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../config/api";
import TextEditor from "../../components/TextEditor";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  Stack,
  Alert,
  AlertTitle,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormHelperText,
  Popover,
  Collapse,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LibraryBooks as LibraryBooksIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  AutoAwesome as AutoAwesomeIcon,
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useAuthContext } from "../../context/AuthContext";

// ============================================
// CENTRALIZED STYLES - Edit all styling here
// ============================================
const STYLES = {
  // Toggle/Switch Styles
  toggle: {
    orangeSwitch: {
      '& .MuiSwitch-switchBase.Mui-checked': {
        color: '#ff5722',
      },
      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: '#ff5722',
      },
    },
  },

  // Form Label Styles
  formLabel: {
    standard: {
      ml: -0.75,
      mb: 2,
      display: 'inline-flex',
      alignItems: 'center',
      '& .MuiFormControlLabel-label': {
        ml: 3,
        fontSize: '0.95rem',
      },
    },
    withDescription: {
      ml: 0,
      display: 'flex',
      alignItems: 'center',
      '& .MuiFormControlLabel-label': {
        ml: 3,
        fontSize: '0.95rem',
        fontWeight: 500,
        color: '#374151',
      },
    },
  },

  // Checkbox Styles
  checkbox: {
    standard: {
      ml: 0,
      gap: 1,
      '& .MuiFormControlLabel-label': {
        ml: 0.5,
        whiteSpace: 'nowrap',
        fontSize: '0.95rem',
      },
    },
  },

  // Button Styles
  button: {
    primary: {
      borderRadius: 4,
      textTransform: 'none',
      fontWeight: 600,
    },
    outlined: {
      borderRadius: 4,
      textTransform: 'none',
    },
    readmeButton: {
      backgroundColor: '#2196f3',
      color: '#ffffff',
      borderRadius: 4,
      width: 'fit-content',
      minWidth: 'auto',
      whiteSpace: 'nowrap',
      border: 'none',
      '&:hover': {
        backgroundColor: '#1976d2',
      },
    },
    questButton: {
      backgroundColor: '#4caf50',
      color: '#ffffff',
      borderRadius: 4,
      width: 'fit-content',
      minWidth: 'auto',
      whiteSpace: 'nowrap',
      border: 'none',
      '&:hover': {
        backgroundColor: '#388e3c',
      },
    },
    questBankButton: {
      backgroundColor: '#ff9800',
      color: '#ffffff',
      borderRadius: 4,
      width: 'fit-content',
      minWidth: 'auto',
      whiteSpace: 'nowrap',
      border: 'none',
      '&:hover': {
        backgroundColor: '#f57c00',
      },
    },
    addParameterButton: {
      backgroundColor: '#9c27b0',
      color: '#ffffff',
      borderRadius: 4,
      width: 'fit-content',
      minWidth: 'auto',
      whiteSpace: 'nowrap',
      border: 'none',
      '&:hover': {
        backgroundColor: '#7b1fa2',
      },
    },
    addHintButton: {
      backgroundColor: '#2196f3',
      color: '#ffffff',
      borderRadius: 4,
      width: 'fit-content',
      minWidth: 'auto',
      whiteSpace: 'nowrap',
      border: 'none',
      '&:hover': {
        backgroundColor: '#1976d2',
      },
    },
    generateHintButton: {
      backgroundColor: '#ff5722',
      color: '#ffffff',
      borderRadius: 4,
      width: 'fit-content',
      minWidth: 'auto',
      whiteSpace: 'nowrap',
      border: 'none',
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: '#e64a19',
        boxShadow: 'none',
      },
    },
  },

  // Typography/Text Styles
  text: {
    sectionHeading: {
      fontWeight: 700,
      mb: 2,
      color: 'primary.main',
    },
    subHeading: {
      fontWeight: 600,
      mb: 2,
      color: 'secondary.main',
    },
    bodyText: {
      fontSize: '0.95rem',
      color: '#374151',
    },
  },

  // Container/Box Styles
  container: {
    overflowVisible: {
      mb: 2,
      overflow: 'visible',
    },
  },
};

/**
 * Task type dropdown: grouped by category; only one category expanded at a time.
 * `includeRepository` adds validate-repository (recommended true for add + edit).
 */
const TASK_TYPE_CATEGORY_DEFINITIONS = (includeRepository) => {
  const categories = [
    {
      id: "custom-api",
      label: "Custom API",
      headerSx: {
        backgroundColor: "#e3f2fd",
        fontWeight: "bold",
        borderLeft: "3px solid #2196f3",
      },
      items: [
        {
          value: "custom-api-call",
          label: "Custom API Call",
          description:
            "Calls any external API endpoint and validates the response. Use this to integrate with third-party services or your own backend for flexible task validation.",
        },
      ],
    },
    {
      id: "quizzes-info",
      label: "Quizzes & information collection",
      items: [
        {
          value: "multiple-choice",
          label: "Multiple Choice Question (MCQ)",
          description:
            "Presents students with a question and a set of predefined answer options (A, B, C…). Automatically graded when the student picks the correct option.",
        },
        {
          value: "quiz",
          label: "Multi-Question Quiz",
          description:
            "A series of multiple-choice questions grouped into one task. Students answer all questions before submitting; the bot grades each one and reports a score.",
        },
        {
          value: "collect-info",
          label: "Collect Information (Non-graded)",
          description:
            "Asks students to submit free-form text (e.g. a link, username, or note). The response is saved for later tasks to reference but no pass/fail grade is applied.",
        },
      ],
    },
    {
      id: "github-metrics",
      label: "GitHub counts & lookups",
      items: [
        {
          value: "get-issue-count",
          label: "Get Issue Count",
          description:
            "Checks that the student's repository has a specific number of issues (open, closed, or total). Useful for verifying they have created or closed the required number of issues.",
        },
        {
          value: "get-pr-count",
          label: "Get Pull Request Count",
          description:
            "Verifies the number of pull requests in the student's repository. Confirms students have submitted the expected amount of PRs.",
        },
        {
          value: "get-top-contributor",
          label: "Get Top Contributor",
          description:
            "Checks who the top contributor to the repository is. Can be used to verify the student is actively committing rather than just forking.",
        },
        {
          value: "get-issue-title",
          label: "Get Issue Title",
          description:
            "Fetches and validates the title of a specific issue in the student's repo. Useful for confirming they created an issue with the correct naming convention.",
        },
        {
          value: "get-open-issue",
          label: "Get Open Issue Count",
          description:
            "Verifies how many issues are currently open in the repository. Useful for tracking that students haven't prematurely closed issues.",
        },
      ],
    },
    {
      id: "issue-assignment",
      label: "Issues, assignments & comments",
      items: [
        {
          value: "assigned",
          label: "Assignment Validation",
          description:
            "Confirms that the student has been assigned to a specific issue in the repository. Useful for verifying that they have claimed or been given a task.",
        },
        {
          value: "issue-no",
          label: "Issue Number Validation",
          description:
            "Validates that the student references a specific issue number in their submission. Ensures students are working on the correct issue.",
        },
        {
          value: "comment",
          label: "Comment Validation",
          description:
            "Checks that the student has left a comment on a specific issue or PR. Useful for participation tasks or requiring students to document their progress.",
        },
      ],
    },
    {
      id: "fork-pr-files",
      label: "Forks, files, PRs & commits",
      items: [
        {
          value: "validate-fork-url",
          label: "Validate Fork URL",
          description:
            "Verifies that the URL the student submits is a valid fork of the expected upstream repository. Confirms they forked the right repo before starting work.",
        },
        {
          value: "validate-file-exists",
          label: "Validate File Exists",
          description:
            "Checks that a specific file or directory path exists in the student's repository at the expected location. Great for confirming deliverables are committed.",
        },
        {
          value: "validate-pr-url",
          label: "Validate PR URL",
          description:
            "Validates that the student has opened a pull request against the correct target repository and branch. Checks PR metadata such as target branch and open/merged status.",
        },
        {
          value: "validate-push",
          label: "Validate Push/Commit",
          description:
            "Verifies that the student has pushed at least one commit to the expected branch. Can also check commit messages or the files changed in the push.",
        },
      ],
    },
    {
      id: "github-actions",
      label: "GitHub Actions workflows",
      items: [
        {
          value: "validate-github-actions",
          label: "Validate GitHub Actions Workflow",
          description:
            "Parses the student's GitHub Actions YAML file and verifies triggers, runners, steps, and action versions match the expected configuration. Can also wait for a workflow run to pass before completing the task.",
        },
      ],
    },
    {
      id: "ai-powered",
      label: "AI-powered validation",
      headerSx: { backgroundColor: "#fff8e1", fontWeight: 600 },
      items: [
        {
          value: "llm-text-validation",
          label: "LLM Text Validation",
          description:
            "Sends the student's free-text answer to an LLM with your custom prompt and criteria. The AI determines whether the answer is correct and generates tailored feedback. Good for open-ended questions.",
        },
        {
          value: "imageValidation",
          label: "LLM Image Validation",
          description:
            "Asks students to submit a screenshot or image URL. The LLM analyses the image against your criteria (e.g. the correct terminal output is visible) and passes or fails the task accordingly.",
        },
        {
          value: "validate-file-content",
          label: "LLM File Content Validation",
          description:
            "Fetches a specific file from the student's repository and uses an LLM to check its contents against your rubric. Ideal for validating code structure, comments, or documentation quality.",
        },
      ],
    },
    {
      id: "code-review",
      label: "Code review",
      headerSx: { backgroundColor: "#e8eaf6", fontWeight: 600 },
      items: [
        {
          value: "iterative-code-review",
          label: "Iterative Code Review",
          description:
            "The student submits a PR and the bot iteratively reviews their code with an LLM, posting inline feedback. The student can revise and resubmit up to a configured max iterations before the task auto-completes.",
        },
        {
          value: "bot-code-review",
          label: "Bot Code Review",
          description:
            "The bot writes code in a PR for the student to review. The student must identify bugs or issues the bot intentionally introduced. Tests code-reading and critical thinking skills.",
        },
      ],
    },
  ];
  if (includeRepository) {
    categories.push({
      id: "repository",
      label: "Repository validation",
      items: [
        {
          value: "validate-repository",
          label: "Validate Repository",
          description:
            "Checks that the repository a student submits meets your requirements: it exists, is owned by the right user or organisation, is public or private, and that the bot has been installed (authorized) on it.",
        },
      ],
    });
  }
  return categories;
};

function buildTaskTypeLabelMap(includeRepository) {
  const map = {};
  TASK_TYPE_CATEGORY_DEFINITIONS(includeRepository).forEach((cat) => {
    cat.items.forEach((it) => {
      map[it.value] = it.label;
    });
  });
  return map;
}

function TaskTypeCategoryPicker({ value, onChange, includeRepository = true }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openCategoryId, setOpenCategoryId] = useState(null);
  const open = Boolean(anchorEl);

  const categories = useMemo(
    () => TASK_TYPE_CATEGORY_DEFINITIONS(includeRepository),
    [includeRepository]
  );
  const labelMap = useMemo(
    () => buildTaskTypeLabelMap(includeRepository),
    [includeRepository]
  );

  const displayLabel = labelMap[value] || value || "";

  const handleCategoryClick = (id) => {
    setOpenCategoryId((prev) => (prev === id ? null : id));
  };

  const handlePick = (v) => {
    onChange(v);
    setAnchorEl(null);
    setOpenCategoryId(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpenCategoryId(null);
  };

  const openPicker = (el) => {
    setAnchorEl(el);
    const cat = categories.find((c) =>
      c.items.some((it) => it.value === value)
    );
    setOpenCategoryId(cat ? cat.id : null);
  };

  return (
    <>
      <TextField
        fullWidth
        label="Task Type"
        value={displayLabel}
        placeholder="Select task type"
        onClick={(e) => openPicker(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker(e.currentTarget);
          }
        }}
        InputProps={{
          readOnly: true,
          endAdornment: (
            open ? (
              <ExpandLessIcon sx={{ color: "action.active", pointerEvents: "none" }} fontSize="small" />
            ) : (
              <ExpandMoreIcon sx={{ color: "action.active", pointerEvents: "none" }} fontSize="small" />
            )
          ),
        }}
        inputProps={{ "aria-haspopup": "true", "aria-expanded": open }}
        sx={{ cursor: "pointer", borderRadius: 2 }}
        helperText="Open a category (one at a time), then choose a task type"
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              width: anchorEl ? Math.max(anchorEl.offsetWidth, 300) : 300,
              maxWidth: "min(100vw - 32px, 480px)",
              maxHeight: 480,
              mt: 0.5,
            },
          },
        }}
      >
        <Box sx={{ maxHeight: 480, overflow: "auto", py: 0.5 }}>
          {categories.map((cat) => {
            const expanded = openCategoryId === cat.id;
            return (
              <Box key={cat.id}>
                <ListItemButton
                  onClick={() => handleCategoryClick(cat.id)}
                  sx={{
                    py: 1,
                    px: 2,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: cat.headerSx?.backgroundColor,
                    borderLeft: cat.headerSx?.borderLeft,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: cat.headerSx?.fontWeight ?? 600, flex: 1 }}
                  >
                    {cat.label}
                  </Typography>
                  {expanded ? (
                    <ExpandLessIcon fontSize="small" color="action" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" color="action" />
                  )}
                </ListItemButton>
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                  {cat.items.map((it) => (
                    <ListItemButton
                      key={it.value}
                      selected={value === it.value}
                      onClick={() => handlePick(it.value)}
                      sx={{
                        pl: 4,
                        pr: 1.5,
                        py: 0.75,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <ListItemText
                        primary={it.label}
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                      {it.description && (
                        <Tooltip
                          title={it.description}
                          placement="right"
                          arrow
                          slotProps={{
                            tooltip: {
                              sx: {
                                maxWidth: 280,
                                fontSize: "0.78rem",
                                lineHeight: 1.5,
                              },
                            },
                          }}
                        >
                          <InfoIcon
                            fontSize="small"
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              ml: 1,
                              flexShrink: 0,
                              color: "text.disabled",
                              cursor: "default",
                              "&:hover": { color: "primary.main" },
                            }}
                          />
                        </Tooltip>
                      )}
                    </ListItemButton>
                  ))}
                </Collapse>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}

// Add default JSON configuration used for new classes
const defaultJsonContent = {
  map_repo_link:
    "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map",
  questSequence: [
    // Q1 definition (same as current state Q1)
    // ... existing code for Q1 with tasks T1-T6 ...
    // Q2 definition with tasks T1 and T2
    // ... existing code for Q2 ...
    // Q3 definition with empty tasks
    // ... existing code for Q3 ...
  ],
  readme: "",
};

const GenerateJson = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [downloadStatus, setDownloadStatus] = useState("");
  const [showAddQuestModal, setShowAddQuestModal] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showReadmeModal, setShowReadmeModal] = useState(false);
  const [readmeContent, setReadmeContent] = useState("");
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [batchUpdateStatus, setBatchUpdateStatus] = useState("");
  const [showBatchUpdateConfirm, setShowBatchUpdateConfirm] = useState(false);
  const [showRemoveReadmeConfirm, setShowRemoveReadmeConfirm] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [saveStatusType, setSaveStatusType] = useState(""); // 'success', 'error', 'saving'
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [githubUsername, setGithubUsername] = useState("");
  const [isCreatingRepos, setIsCreatingRepos] = useState(false);
  const [repoCreationStatus, setRepoCreationStatus] = useState("");
  const [storedKeys, setStoredKeys] = useState([]);
  const [storedValuesByUser, setStoredValuesByUser] = useState({});
  const [isLoadingCollectedInfo, setIsLoadingCollectedInfo] = useState(false);
  const [collectedInfoSummary, setCollectedInfoSummary] = useState(null);
  const [hasLoadedCollectedInfo, setHasLoadedCollectedInfo] = useState(false);
  // Draft Quest System State
  const [draftQuests, setDraftQuests] = useState({ questSequence: [] });
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState("");
  const [showDraftJsonPreview, setShowDraftJsonPreview] = useState(false);
  
  // Normalized draft (for preview): fills sequenceNumber and metadata.prerequisite chain
  const normalizedDraftForPreview = useMemo(() => {
    try {
      const seq = Array.isArray(draftQuests?.questSequence) ? draftQuests.questSequence : [];
      const normalizedSequence = seq.map((q, idx, arr) => {
        const prevQuestId = idx > 0 ? (arr[idx - 1]?.questId || null) : null;
        const metadata = {
          ...(q?.metadata || {}),
          prerequisite: prevQuestId,
          type: q?.metadata?.type || q?.questType || "custom",
          title: q?.metadata?.title || q?.title || "",
          description: q?.metadata?.description || q?.description || "",
          sequenceNumber: idx
        };
        return {
          ...q,
          sequenceNumber: idx,
          metadata
        };
      });
      return { questSequence: normalizedSequence, map_repo_link: draftQuests?.map_repo_link };
    } catch (e) {
      return draftQuests;
    }
  }, [draftQuests]);
  
  // Saved Quests from Database State
  const [savedQuests, setSavedQuests] = useState([]);
  const [isLoadingSavedQuests, setIsLoadingSavedQuests] = useState(false);
  const [savedQuestsError, setSavedQuestsError] = useState("");
  
  // Test repositories state
  const [testUsernames, setTestUsernames] = useState("");
  const [testRepos, setTestRepos] = useState([]);
  const [isCreatingTestRepos, setIsCreatingTestRepos] = useState(false);
  // 1. Add new state for multiple tasks in questFormData
  const [questFormData, setQuestFormData] = useState({
    title: "",
    description: "",
    tasks: [], // <-- array of task objects
    questions: [], // <-- array of questions for quiz tasks
  });
  // 1. Add state for editing quest
  const [editingQuestIndex, setEditingQuestIndex] = useState(null);
  // Add state for editing individual tasks
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTaskData, setEditingTaskData] = useState(null);
  const [editingTaskQuestIndex, setEditingTaskQuestIndex] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  
  // Add state for editing quests
  const [editingQuestData, setEditingQuestData] = useState(null);
  const [showEditQuestModal, setShowEditQuestModal] = useState(false);
  const [showQuestEditConfirmationDialog, setShowQuestEditConfirmationDialog] = useState(false);
  const [showQuestEditSuccessDialog, setShowQuestEditSuccessDialog] = useState(false);
  const [showQuestEditErrorDialog, setShowQuestEditErrorDialog] = useState(false);
  const [questEditMessage, setQuestEditMessage] = useState("");
  
  // Add state for confirmation dialogs
  const [showQuestDeleteConfirmationDialog, setShowQuestDeleteConfirmationDialog] = useState(false);
  const [showTaskDeleteConfirmationDialog, setShowTaskDeleteConfirmationDialog] = useState(false);
  const [showPurpleDeployConfirmationDialog, setShowPurpleDeployConfirmationDialog] = useState(false);
  const [isPurpleDeploying, setIsPurpleDeploying] = useState(false);
  const [questToDelete, setQuestToDelete] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [questToDeploy, setQuestToDeploy] = useState(null);
  const { authUser } = useAuthContext();
  const [showLibraryDialog, setShowLibraryDialog] = useState(false);
  const [libraryQuests, setLibraryQuests] = useState([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  
  // Task deletion confirmation dialog state
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
  const [questToDeleteFrom, setQuestToDeleteFrom] = useState(null);

  // Task edit confirmation dialog state
  const [showTaskEditConfirmationDialog, setShowTaskEditConfirmationDialog] = useState(false);
  
  // Task edit success/error dialog state
  const [showTaskEditSuccessDialog, setShowTaskEditSuccessDialog] = useState(false);
  const [showTaskEditErrorDialog, setShowTaskEditErrorDialog] = useState(false);
  const [taskEditMessage, setTaskEditMessage] = useState('');

  // Quest deployment dialog state

  // Real-time notification state
  const [showDraftUpdateAlert, setShowDraftUpdateAlert] = useState(false);
  const [draftUpdateInfo, setDraftUpdateInfo] = useState(null);

  // Initial JSON content with state management
  const [jsonContent, setJsonContent] = useState({
    map_repo_link:
      "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map",
    questSequence: [
      {
        questId: "Q1",
        title: "Q1: Understanding OSS Projects and GitHub Basics",
        isQ0: false,
        questType: "fixed",
        sequenceNumber: 0,
        metadata: {
          title: "Q1: Understanding OSS Projects and GitHub Basics",
          description:
            "Learn the fundamentals of open source software and GitHub workflow",
          prerequisite: null,
          type: "general",
        },
        badgeDescription: "Explorer 🚀",
        tasks: {
          T1: {
            title: "Explore the issue tracker",
            taskTitle: "Explore the issue tracker",
            desc: "Explore the issue tracker",
            points: 20,
            xp: 20,
            type: "get-issue-count",
            ossRepository: "probot-test-org/test-repo",
            accept:
              '### 🎯 Task 1: Find the Issue Tracker\n\n**Objective:** The issue tracker is the hub for project discussions, bug reports, and feature requests. Your goal is to find the issue tracker within our GitHub repository.\n\n**Task:** Visit the GitHub repository in the link below and **COUNT** the number of open issues and provide that number in the comment box to complete the task.\n\n🔗 [GitHub Repository: probot-test-org/test-repo](https://github.com/probot-test-org/test-repo)\n\n**Outcome:** This task will help you become familiar with how issues are reported, discussed, and tracked. Understanding the volume of discussions is crucial for grasping the project\'s activity level and areas that might need your contribution.\n\n**Help:** If you need help with this task, type "help" in the comment box to get hints, but it will cost you 5 points from your total score.',
            success:
              "### 🌟 Congratulations! You Nailed It!\n\nYou've successfully identified the correct number of issues in our project, displaying keen attention to detail and dedication. As a reward for your sharp observation skills, you've earned **${experiencePoints} experience points!**\n\n> 🌟 🌟 🌟\n\n🏆 **Current Progress:** You now have **${currentPoints} points**, edging closer to the next level. Remember, you need a total of **100 points to level up**, meaning you're just **${pointsRemaining} points away** from achieving that milestone.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate, to successfully complete the entire quest, you need to reach an 100% completion rate. Every task you accomplish brings you closer to mastering the GitHub realm and unlocking new levels of collaboration and contribution.\n\n> 🌟 🌟 🌟\n\nKeep up the great work! Your journey through the quest is shaping up to be an exciting one. Each task completed is a step forward in your adventure. \n\nReady for the next challenge? More experiences and rewards await!\n\nA new task has appeared in the issues tab.\n\nYour adventure awaits! 🌟\n\n",
            error:
              "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the number you've provided doesn't match the current count of **OPEN** issues in our project. \n\nNo worries, though! Mistakes are just stepping stones on the path to learning.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nEach issue represents a story, a problem to solve, or a feature to improve. Finding the correct number is just the start of understanding the broader narrative of our project.\n\nReady for another try? Your correct answer awaits just a click away!",
            answer: "",
            hints: [],
          },
          T2: {
            title: "Explore the pull-request menu",
            taskTitle: "Explore the pull-request menu",
            desc: "Explore the pull-request menu",
            points: 20,
            xp: 20,
            type: "get-pr-count",
            ossRepository: "probot-test-org/test-repo",
            accept:
              '### 🎯 Task 2: Find the Pull Request Menu\n\n**Objective:** Pull requests are the heart of collaboration in a GitHub repository, allowing you to suggest changes and contribute directly. Your mission is to find the pull request menu within our GitHub repository and gauge the level of ongoing collaborations.\n\n🔗 [GitHub Repository: probot-test-org/test-repo](https://github.com/probot-test-org/test-repo) \n\n **Task:** Go to the GitHub repository using the link below, find the number of **open** pull requests, and enter it in the comment box below.\n\n**Outcome:** Completing this task will deepen your understanding of how contributions are proposed, discussed, and integrated into the project. Recognizing the volume of open pull requests helps you see the project\'s dynamic nature and where you might contribute in the future.\n\n**Help:** If you need help with this task, type "help" in the comment box to get hints, but it will cost you 5 points from your total score.',
            success:
              "### 🌟 Congratulations! You Nailed It!\n\nYou've successfully identified the correct number of pull requests in our project, displaying keen attention to detail and dedication. As a reward for your sharp observation skills, you've earned **${experiencePoints} experience points!**\n\n> 🌟 🌟 🌟\n\n🏆 **Current Progress:** You now have **${currentPoints} points**, edging closer to the next level. Remember, you need a total of **100 points to level up**, meaning you're just **${pointsRemaining} points away** from achieving that milestone.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate, to successfully complete the entire quest, you need to reach an 100% completion rate. Every task you accomplish brings you closer to mastering the GitHub realm and unlocking new levels of collaboration and contribution.\n\n> 🌟 🌟 🌟\n\nKeep up the great work! Your journey through the quest is shaping up to be an exciting one. Each task completed is a step forward in your adventure. \n\nReady for the next challenge? More experiences and rewards await!\n\nYou will see a new task in your issues tab!\n\nYour adventure awaits! 🌟\n\n",
            error:
              "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the number you've provided doesn't match the current count of **OPEN** pull requests in our project.\n\nNo worries, though! Mistakes are part of the learning journey, and every misstep is an opportunity for growth.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nConsider this a bit of detective work 🕵️‍♂️.\n\nEvery open pull request is a potential contribution, waiting to enhance the project or fix an underlying issue. Identifying the correct number not only demonstrates your attentiveness but also helps you get acquainted with the contributions landscape of our project.\n\nReady to try again? The accurate count—and a chance to sharpen your project navigation skills—is just a click away!",
            answer: "",
            hints: [],
          },
          T3: {
            title: "Explore the fork button",
            taskTitle: "Explore the fork button",
            desc: "Explore the fork button",
            points: 20,
            xp: 20,
            type: "multiple-choice",
            accept:
              '**Question:** ### 🎯 Task 3: Locate the Fork Button \n\n**Objective:** Forking is a cornerstone of GitHub collaboration. It enables you to create a personal copy of a repository so you can experiment with changes without affecting the original project.\n\n**Objective:** Pull requests are the heart of collaboration in a GitHub repository, allowing you to suggest changes and contribute directly. Your mission is to find the pull request menu within our GitHub repository and gauge the level of ongoing collaborations.\n\n🔗 [GitHub Repository: probot-test-org/test-repo](https://github.com/probot-test-org/test-repo) \n\n**Task:** Go to the GitHub repository using the link below, locate the **Fork** button, and note where it\'s positioned.\n\n**Choose the option that best describes where the "Fork" button is located.**\n\n\n\nA) Bottom-left corner of the page\nB) Directly under the repository description\nC) Next to the "Watch" and "Star" buttons\nD) In the repository\'s "Settings" tab\n\n**Instructions:** Select the correct answer.',
            success:
              "### 🌟 Congratulations! You've Got It Right!\n\nYou've correctly identified the fork button's location within a GitHub repository as the top-right corner of the page, showcasing your growing familiarity with GitHub's interface and tools for collaboration.\n\nAs a reward for your keen observation and learning skills, you've earned ${experiencePoints} experience points!\n\n>🌟 🌟 🌟\n\n🏆 **Current Progress:** You now have **${currentPoints} points**, edging closer to the next level. Remember, you need a total of **100 points to level up**, meaning you're just **${pointsRemaining} points away** from achieving that milestone.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate, to successfully complete the entire quest, you need to reach an 100% completion rate. Every task you accomplish brings you closer to mastering the GitHub realm and unlocking new levels of collaboration and contribution.\n\n> 🌟 🌟 🌟\n\nFantastic work! The path you're on is filled with learning and achievement. Each task you complete propels you further in your journey through the world of open-source collaboration.\n\nAre you ready to tackle the next challenge? More adventures and rewards are on the horizon!\n\nTo dive into your next task, look in the issues tab!\n\nThe adventure continues! 🌟\n\n",
            error:
              "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the location you've selected for the fork button doesn't align with its typical placement in a GitHub repository.\n\nNo worries, though! Mistakes are simply steps on the path to mastery, and every attempt brings you closer to understanding.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nThis is a bit like a treasure hunt 🗺️.\n\nFinding the fork button is a fundamental skill for navigating GitHub and making your mark on projects. Correctly identifying its location ensures you're ready to start experimenting and contributing on your own terms.\n\nReady for another try? Your correct answer is just a decision away!\n\n**Please select the correct answer from the options below:**\n\nA) Bottom-left corner of the page\nB) Directly under the repository description\nC) Top-right corner of the page\nD) In the repository's \"Settings\" tab\n\n**Type** the letter in the comment box to complete this task.",
            answer: "C",
            question:
              '### 🎯 Task 3: Locate the Fork Button \n\n**Objective:** Forking is a cornerstone of GitHub collaboration. It enables you to create a personal copy of a repository so you can experiment with changes without affecting the original project.\n\n**Task:** Go to the GitHub repository using the link below, locate the **Fork** button, and note where it\'s positioned.\n\n**Choose the option that best describes where the "Fork" button is located.**\n\n',
            options: [
              {
                label: "A",
                value: "Bottom-left corner of the page",
              },
              {
                label: "B",
                value: "Directly under the repository description",
              },
              {
                label: "C",
                value: 'Next to the "Watch" and "Star" buttons',
              },
              {
                label: "D",
                value: 'In the repository\'s "Settings" tab',
              },
            ],
            hints: [],
          },
          T4: {
            title: "Explore the readme file",
            taskTitle: "Explore the readme file",
            desc: "Explore the readme file",
            points: 20,
            xp: 20,
            type: "multiple-choice",
            accept:
              "**Question:** ### 🎯 Task 4: Locate the README File\n\n**Objective:** The README file serves as the welcoming guide and introduction to a project, providing essential information, instructions, and insights.\n\n**Objective:** Pull requests are the heart of collaboration in a GitHub repository, allowing you to suggest changes and contribute directly. Your mission is to find the pull request menu within our GitHub repository and gauge the level of ongoing collaborations.\n\n🔗 [GitHub Repository: probot-test-org/test-repo](https://github.com/probot-test-org/test-repo) \n\n**Task:** Go to the GitHub repository using the link below, find the **README** section, and identify which of the following sections is listed there.\n\n**Which of the following sections is within the README file:**\n\nA\n\nA) Functionality\nB) Design\nC) Architecture\nD) Contributing\n\n**Instructions:** Select the correct answer.",
            success:
              "### 🌟 Congratulations! You've Got It Right!\n\nYou've successfully identified a key piece of information or instruction from the README file, demonstrating your thorough attention to detail and commitment to understanding the project.\n\nAs a reward for your keen observation and learning skills, you've earned ${experiencePoints} experience points!\n\n>🌟 🌟 🌟\n\n🏆 **Current Progress:** You now have **${currentPoints} points**, edging closer to the next level. Remember, you're just **${pointsRemaining} points away** from leveling up!.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate, to successfully complete the entire quest, you need to reach an 100% completion rate. Every task you accomplish brings you closer to mastering the GitHub realm and unlocking new levels of collaboration and contribution.\n\n> 🌟 🌟 🌟\n\nFantastic work! The path you're on is filled with learning and achievement. Each task you complete propels you further in your journey through the world of open-source collaboration.\n\nAre you ready to tackle the next challenge? More adventures and rewards are on the horizon! \n\nThere will be a new task in your issues tab.\n\nThe adventure continues! 🌟\n\n",
            error:
              "### 🚨 Oops, That's Not Quite Right!\n\nIt seems the information you've shared from the README file doesn't quite match what we were looking for, or perhaps it was misunderstood.\n\nDon't fret, though! Each step, including the missteps, is part of the journey towards greater knowledge and proficiency.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nConsider this a chance to dive deeper 🤿.\n\nThe README file is packed with insights about the project, often hiding gems of information crucial for new contributors. By revisiting and reflecting on its content, you're not just completing a task but also building a foundation for meaningful contributions.\n\nReady to give it another go? The README file awaits with the details you need to move forward!\n\n**Please select the correct answer from the options below based on the sessions described in the README file:**\n\nA) Functionality\nB) Design\nC) Architecture\nD) Contributing\n\n**Type** the letter in the comment box to complete this task.",
            answer: "D",
            question:
              "### 🎯 Task 4: Locate the README File\n\n**Objective:** The README file serves as the welcoming guide and introduction to a project, providing essential information, instructions, and insights.\n\n**Task:** Go to the GitHub repository using the link below, find the **README** section, and identify which of the following sections is listed there.\n\n**Which of the following sections is within the README file:**\n\nA",
            options: [
              {
                label: "A",
                value: "Functionality",
              },
              {
                label: "B",
                value: "Design",
              },
              {
                label: "C",
                value: "Architecture",
              },
              {
                label: "D",
                value: "Contributing",
              },
            ],
            hints: [],
          },
          T5: {
            title: "Explore the contributors",
            taskTitle: "Explore the contributors",
            desc: "Explore the contributors",
            points: 20,
            xp: 20,
            type: "get-top-contributor",
            ossRepository: "probot-test-org/test-repo",
            accept:
              "### 🎯 Task 5: Discover the Contributors \n\n**Objective:** Understanding who has contributed to a project can provide insights into the project's community and potentially whom to reach out to for collaboration or questions.\n\n**Task:** Go to the GitHub repository using the link below, locate the **number 1** contributor, and **TYPE** their username in the comment box. Do NOT include any symbols.\n\n**Objective:** Pull requests are the heart of collaboration in a GitHub repository, allowing you to suggest changes and contribute directly. Your mission is to find the pull request menu within our GitHub repository and gauge the level of ongoing collaborations.\n\n🔗 [GitHub Repository: probot-test-org/test-repo](https://github.com/probot-test-org/test-repo) \n\n**Outcome:** This task will familiarize you with the collaborative nature of open-source projects on GitHub. Identifying contributors helps you understand the project's community size and diversity, offering a window into the people behind the project.\n\n**Help:** If you need help with this task, type \"help\" in the comment box to get hints, but it will cost you 5 points from your total score.",
            success:
              "### 🌟 Congratulations! You've Reached a New Level!\n\nWith your latest achievement, you've accurately identified the number of contributors to our project, demonstrating not just your ability to navigate GitHub but also your appreciation for community collaboration.\n\nAs a reward for your sharp observation skills, you've earned **${experiencePoints} experience points!**\n\n> 🌟 🌟 🌟\n\n🏆 **Current Progress:** You've now accomplished a total of **${currentPoints} points**, achieving a remarkable milestone in your journey. This success is a testament to your dedication, learning, and contributions thus far.\n\n🎯 **Quest Completion:** You've successfully completed the tasks for this quest, leaving only the remaining quiz. This accomplishment signifies your mastery over the tasks at hand and your readiness to embark on new challenges and quests within the GitHub realm and beyond.\n\n> 🌟 🌟 🌟\n\nIncredible work! Your journey through this quest has been a tale of persistence, learning, and growth. Each task you've completed has not only contributed to your knowledge but has also paved the way for future adventures in open-source collaboration.\n\n**🚀 Ready for New Horizons:** With this quest behind you, new quests await, brimming with opportunities for exploration, learning, and making an impact.\n\nTo begin your next adventure, keep an eye out for the command or instructions that will introduce your next task. Your dedication and skills are invaluable assets on this journey of continuous learning and contribution.\n\nOnward to new quests and achievements! 🌟\n\n",
            error:
              "### 🚨 Oops, That's Not Quite Right!\n\nIt seems the number of contributors you've mentioned doesn't align with the current roster of contributors to our project.\n\nBut remember, every error is a stepping stone towards greater understanding and skill.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nThink of this as honing your analytical skills 🔍.\n\nEach contributor represents a unique contribution to the project, from code commits to documentation. Recognizing the breadth and depth of the community's engagement is crucial for appreciating the collective effort involved in open-source projects.\n\nAre you ready for another attempt? The correct number, and a deeper understanding of our project's community, is just a few clicks away!",
            answer: "",
            hints: [],
          },
          T6: {
            title: "Quiz",
            taskTitle: "Quiz",
            desc: "Quiz",
            points: 20,
            xp: 20,
            type: "quiz",
            questions: [
              {
                question:
                  "What is the primary purpose of the issue tracker in a GitHub repository?",
                optionA: "To list all contributors to the project",
                optionB:
                  "To track bug reports, feature requests, and project discussions",
                optionC: "To store documentation and project guidelines",
                optionD: "To manage pull requests and merges",
                correctAnswer: "b",
                explanation: "",
              },
              {
                question:
                  "Which statement best describes a pull request on GitHub?",
                optionA:
                  "A way to propose changes to a repository, allowing for code review and discussion before integration",
                optionB:
                  "A method of archiving issues and marking them as resolved",
                optionC:
                  "A feature used for backing up repository data to a different server",
                optionD:
                  "A section where repository settings and configurations are modified",
                correctAnswer: "a",
                explanation: "",
              },
              {
                question: "Why would you fork a repository on GitHub?",
                optionA: "To permanently delete it from your account",
                optionB: "To merge two different repositories into one",
                optionC:
                  "To create a personal copy where you can experiment and make changes without affecting the original",
                optionD: "To mark it as one of your favorite projects",
                correctAnswer: "c",
                explanation: "",
              },
              {
                question:
                  "What information is typically found in a README file of a GitHub project?",
                optionA: "The project's history and commit logs",
                optionB:
                  "A guide on how to contribute, along with an overview of the project",
                optionC: "Personal information about the contributors",
                optionD: "All the issues that have ever been reported",
                correctAnswer: "b",
                explanation: "",
              },
              {
                question:
                  "How can understanding who has contributed the most to a project be useful?",
                optionA: "It ensures that you get paid for your contributions",
                optionB:
                  "It prevents other people from making changes to your code",
                optionC:
                  "It lets you change the project's license to your preference",
                optionD:
                  "It helps identify the project's most active users and potential people to reach out to for guidance",
                correctAnswer: "d",
                explanation: "",
              },
            ],
            accept:
              '### 🧠 Quest 1 Quiz \n Answer the following questions to test your knowledge of the GitHub contribution process.\n Note that you may navigate to issues and view your "closed issues" to view old tasks that may help you answer these questions! \n\nThere is only one attempt allowed!',
            success: "Good Job!",
            error:
              "### Oops, That's Not Quite Right! Check if you have an answer for each question and if you are following the answer pattern: [X, X, X]",
            answer: "",
            hints: [],
          },
        },
      },
      {
        questId: "Q2",
        title: "Q2: Assignment Validation",
        isQ0: false,
        questType: "custom",
        sequenceNumber: 1,
        metadata: {
          title: "Q2: Assignment Validation",
          description: "Validate user assignments to specific issues",
          prerequisite: "Q1",
          type: "custom",
        },
        badgeDescription: "Custom Quest 🎯",
        tasks: {
          T1: {
            title: "Identify the assigned user for the issue #88",
            taskTitle: "Identify the assigned user for the issue #88",
            desc: "Identify the assigned user for the issue #88",
            points: 25,
            xp: 25,
            hints: [],
            detailedHints: [],
          },
          T2: {
            title: "Choose an issue that you would like to work with",
            taskTitle: "Choose an issue that you would like to work with",
            desc: "Choose an issue that you would like to work with",
            points: 25,
            xp: 25,
            type: "issue-no",
            ossRepository: "probot-test-org/test-repo",
            accept:
              "### 🎯 Task 1: Choose an Issue to Work On\n\n**Objective:** ${objective || 'The lifeblood of any Open Source Software (OSS) project is its community and the contributions that come from addressing issues. Your mission is to identify an issue within our GitHub repository that aligns with your skills, interests, or areas you wish to learn more about.'}\n\n**Task:** Go to the GitHub repository using the link below, find an issue that you would like to work on, and type its issue number in the comment box below.\n\n**Outcome:** By selecting an issue to work on, you are taking the first step towards contributing to the project and becoming part of the OSS community. This task helps you engage with the project's needs actively and lays the groundwork for your upcoming contributions.\n\n**Help:** If you need help with this task, type \"help\" in the comment box to get hints, but it will cost you 5 points from your total score.",
            success:
              "### 🌟 Congratulations! You've Selected Your First Issue!\n\nBy choosing an issue to focus on, you've taken a significant step in your journey of contribution to our project. Your willingness to engage and make a difference showcases your commitment to the community and project advancement.\n\n**Points earned:** {points}\n\n🌟 🌟 🌟\n\n🏆 **Current Progress:** Good work! You currently have {points} points and you've started your journey towards achieving greater milestones.\n\n🎯 **Quest Advancement:** This task not only brings you closer to mastering the collaboration process within GitHub but also highlights your growing role within our community.\n\n🌟 🌟 🌟\n\nFantastic effort! You're proving to be an essential part of our journey towards developing a project that we can all be proud of. 🌟",
            error:
              "### ❌ Issue Not Found\n\nThe issue number you provided does not exist in the ${repository || '[repository]'} repository.\n\n**Please ensure:**\n1. You're checking the right repository\n2. You're typing a valid issue number\n3. The issue actually exists\n\n[Click here to view all issues](https://github.com/${repository || '[repository]'}/issues)",
            answer: "",
            hints: [],
          },
        },
      },
    ],
    readme: "",
  });

  // Duplicate detection: compute title sets after jsonContent and draftQuests are defined
  const liveQuestSequence = jsonContent?.questSequence || [];
  const draftQuestSequence = draftQuests?.questSequence || [];

  const getQuestDisplayOrder = useCallback((quest, draftIndex = 0) => {
    const extractNumber = (value) => {
      if (!value || typeof value !== "string") return null;
      const match = value.match(/Q?\s*(\d+)/i);
      return match ? parseInt(match[1], 10) : null;
    };

    const fromId = extractNumber(quest?.questId);
    if (fromId !== null) return fromId;

    const fromTitle = extractNumber(quest?.title || quest?.metadata?.title);
    if (fromTitle !== null) return fromTitle;

    if (typeof quest?.sequenceNumber === "number") {
      return quest.sequenceNumber;
    }

    return 10000 + draftIndex;
  }, []);

  const draftQuestDisplayList = useMemo(() => {
    if (!Array.isArray(draftQuestSequence)) return [];

    const mapped = draftQuestSequence
      .map((quest, draftIndex) => {
        const order = getQuestDisplayOrder(quest, draftIndex);
        console.log(`🔢 Quest sort: "${quest?.title}" → order ${order} (questId: ${quest?.questId}, sequenceNumber: ${quest?.sequenceNumber})`);
        return {
          quest,
          draftIndex,
          displayOrder: order,
        };
      })
      .sort((a, b) => {
        if (a.displayOrder === b.displayOrder) {
          return a.draftIndex - b.draftIndex;
        }
        return a.displayOrder - b.displayOrder;
      });
    
    console.log('📋 Sorted draft quest order:', mapped.map(m => `${m.quest?.title} (order: ${m.displayOrder})`));
    return mapped;
  }, [draftQuestSequence, getQuestDisplayOrder]);

  const liveQuestDisplayList = useMemo(() => {
    if (!Array.isArray(liveQuestSequence)) return [];

    return liveQuestSequence
      .map((quest, originalIndex) => ({
        quest,
        originalIndex,
        displayOrder: getQuestDisplayOrder(quest, originalIndex),
      }))
      .sort((a, b) => {
        if (a.displayOrder === b.displayOrder) {
          return a.originalIndex - b.originalIndex;
        }
        return a.displayOrder - b.displayOrder;
      });
  }, [liveQuestSequence, getQuestDisplayOrder]);

  const liveQuestTitles = useMemo(() => {
    const titles = new Set();
    liveQuestSequence.forEach((quest) => {
      const normalized = (quest?.title || quest?.metadata?.title || "")
        .trim()
        .toLowerCase();
      if (normalized) {
        titles.add(normalized);
      }
    });
    return titles;
  }, [liveQuestSequence]);

  const liveTaskTitles = useMemo(() => {
    const titles = new Set();
    liveQuestSequence.forEach((quest) => {
      const tasks = quest?.tasks || {};
      Object.values(tasks).forEach((task) => {
        const normalized = (
          task?.title ||
          task?.taskTitle ||
          task?.desc ||
          ""
        )
          .trim()
          .toLowerCase();
        if (normalized) {
          titles.add(normalized);
        }
      });
    });
    return titles;
  }, [liveQuestSequence]);

  const draftQuestTitleCounts = useMemo(() => {
    const counts = {};
    draftQuestSequence.forEach((quest) => {
      const normalized = (quest?.title || "")
        .trim()
        .toLowerCase();
      if (!normalized) return;
      counts[normalized] = (counts[normalized] || 0) + 1;
    });
    return counts;
  }, [draftQuestSequence]);

  const draftTaskTitleCounts = useMemo(() => {
    const counts = {};
    draftQuestSequence.forEach((quest) => {
      const tasks = quest?.tasks || {};
      Object.values(tasks).forEach((task) => {
        const normalized = (
          task?.title ||
          task?.taskTitle ||
          task?.desc ||
          ""
        )
          .trim()
          .toLowerCase();
        if (!normalized) return;
        counts[normalized] = (counts[normalized] || 0) + 1;
      });
    });
    return counts;
  }, [draftQuestSequence]);

  // Add a quest ID counter to ensure consistent timestamps
  const [questIdCounter, setQuestIdCounter] = useState(0);
  const [sessionTimestamp] = useState(Date.now()); // Use same timestamp for all quests in this session

  // Track the last successful save time for relative timestamp display
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Compute a human-readable relative time string (e.g., "15 secs ago", "2 hours ago")
  const relativeSaveText = useMemo(() => {
    if (!lastSavedAt) return "";
    const diffSec = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000);
    if (diffSec < 5) return "Saved successfully just now";
    if (diffSec < 60) return `Saved successfully ${diffSec} secs ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Saved successfully ${diffMin} mins ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `Saved successfully ${diffHour} hours ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `Saved successfully ${diffDay} days ago`;
  }, [lastSavedAt]);

  // Function to assign sequential quest IDs based on position
  const assignSequentialQuestIds = (questSequence) => {
    return questSequence.map((quest, index) => {
      const updatedQuest = {
        ...quest,
        questId: `Q${index + 1}`,
        sequenceNumber: index,
      };
      
      // Debug logging to check if tasks are preserved
      console.log(`🔍 [assignSequentialQuestIds] Quest ${index + 1}:`, {
        originalTasks: quest.tasks,
        updatedTasks: updatedQuest.tasks,
        tasksPreserved: !!updatedQuest.tasks
      });
      
      return updatedQuest;
    });
  };

  // Function to update quest IDs whenever quest sequence changes
  const updateQuestIds = (questSequence) => {
    console.log(
      "🔄 Updating quest IDs for sequence:",
      questSequence.map((q) => ({ id: q.questId, title: q.title }))
    );

    const updatedSequence = assignSequentialQuestIds(questSequence);

    // Update prerequisites based on new IDs
    updatedSequence.forEach((quest, index) => {
      if (quest.metadata) {
        if (index === 0) {
          quest.metadata.prerequisite = null;
        } else {
          quest.metadata.prerequisite = updatedSequence[index - 1].questId;
        }
      }
    });

    console.log(
      "✅ Updated quest IDs:",
      updatedSequence.map((q) => ({
        id: q.questId,
        title: q.title,
        prereq: q.metadata?.prerequisite,
      }))
    );

    return updatedSequence;
  };

  // Validate quest configuration and fix prerequisites
  const validateAndFixQuestConfig = (config) => {
    const questSequence = config.questSequence || [];
    const fixedConfig = { ...config };

    questSequence.forEach((quest, index) => {
      // Fix prerequisite for quests after the first one
      if (index > 0) {
        const previousQuest = questSequence[index - 1];
        if (
          quest.metadata &&
          quest.metadata.prerequisite !== previousQuest.questId
        ) {
          console.log(
            `🔧 Fixing prerequisite for quest ${quest.questId}: ${quest.metadata.prerequisite} → ${previousQuest.questId}`
          );
          quest.metadata.prerequisite = previousQuest.questId;
        }
      } else {
        // First quest should have no prerequisite
        if (quest.metadata && quest.metadata.prerequisite !== null) {
          console.log(
            `🔧 Fixing prerequisite for first quest ${quest.questId}: ${quest.metadata.prerequisite} → null`
          );
          quest.metadata.prerequisite = null;
        }
      }
    });

    return fixedConfig;
  };

  // Fetch library quests for this professor
  const fetchLibraryQuests = async () => {
    if (!authUser?._id) return;
    setIsLibraryLoading(true);
    setLibraryError("");
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/generatejson/quests/${authUser._id}`
      );
      setLibraryQuests(res.data.data || []);
    } catch (err) {
      setLibraryError("Failed to load quest library");
    } finally {
      setIsLibraryLoading(false);
    }
  };

  // Open library dialog and fetch quests
  const handleOpenLibrary = () => {
    setShowLibraryDialog(true);
    fetchLibraryQuests();
  };
  const handleCloseLibrary = () => setShowLibraryDialog(false);

  // Auto-save function for saving default quest configuration
  const handleAutoSave = async () => {
    if (!classId || !jsonContent.questSequence.length) return;

    try {
      console.log("💾 Auto-saving default quest configuration...");
      setIsSaving(true);
      setSaveStatusType("saving");
      setSaveStatus("Saving default quest configuration...");

      // Validate and fix quest configuration before saving
      const validatedConfig = validateAndFixQuestConfig(jsonContent);

      const response = await axios.post(
        `${API_BASE_URL}/api/group/${classId}/quest-json-config`,
        {
          questJsonConfig: validatedConfig,
        }
      );

              if (response.data.success) {
          setSaveStatusType("success");
          setSaveStatus("Default quest configuration saved successfully");
          console.log("✅ Default quest configuration auto-saved");
          setLastSavedAt(new Date());
          
          // Auto-refresh stored data values after successful save
          loadStoredValues();
          
          // Clear success status after 3 seconds
          setTimeout(() => {
            setSaveStatusType("");
            setSaveStatus("");
          }, 3000);
        }
    } catch (error) {
      console.error("❌ Auto-save failed:", error);
      setSaveStatusType("error");
      setSaveStatus("Failed to save default quest configuration");
      // Clear error status after 5 seconds
      setTimeout(() => {
        setSaveStatusType("");
        setSaveStatus("");
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Add a library quest to the current class
  const handleAddLibraryQuest = (quest) => {
    // Convert quest.tasks (array of Task objects) to our questFormData.tasks format
    const tasksArr = (quest.tasks || []).map((task) => ({
      ...task,
      taskType: task.type,
      // Map backend fields to frontend fields as needed
      taskDesc: task.desc,
      points: task.points,
      acceptText: task.responses?.accept || task.accept,
      successText: task.responses?.success || task.success,
      errorText: task.responses?.error || task.error,
      correctAnswer: task.answer,
      repository: task.ossRepository,
      issueNumber: task.issueNumber,
      questions: task.questions || [],
    }));
    // Add to quest sequence
    const sequenceNumber = jsonContent.questSequence.length;
    const tasksObj = {};
    tasksArr.forEach((task, idx) => {
      tasksObj[`T${idx + 1}`] = task;
    });
    const newQuest = {
      questId: `TEMP_${Date.now()}`, // Temporary ID, will be replaced
      title: quest.questTitle,
      isQ0: false,
      questType: "custom",
      sequenceNumber: sequenceNumber,
      metadata: {
        title: quest.questTitle,
        description: "",
        prerequisite: null, // Will be set by updateQuestIds
        type: "custom",
      },
      badgeDescription: "Custom Quest 🎯",
      tasks: tasksObj,
    };
    setJsonContent((prev) => {
      const updatedSequence = [...prev.questSequence, newQuest];
      return {
        ...prev,
        questSequence: updateQuestIds(updatedSequence),
      };
    });
    setShowLibraryDialog(false);
  };

  // Delete a quest from the library
  const handleDeleteLibraryQuest = async (questId) => {
    if (!window.confirm("Delete this quest from your library?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/generatejson/quest/${questId}`);
      setLibraryQuests((prev) => prev.filter((q) => q._id !== questId));
    } catch (err) {
      alert("Failed to delete quest");
    }
  };

  // 2. Add a function to create a blank task (with all fields)
  const createBlankTask = () => ({
    title: "",
    taskTitle: "",
    desc: "",
    points: 20,
    xp: 20,
    type: "general",
    accept: "",
    success: "",
    error: "",
    answer: "",
    options: [
      { label: "A", value: "" },
      { label: "B", value: "" }
    ],
    detailedHints: [],
    taskType: "llm-text-validation",
    taskDesc: "",
    successText: "",
    errorText: "",
    question: "",
    correctAnswer: "",
    repository: "",
    apiEndpoint: "",
    responsePath: "",
    expectedAnswerType: "Number",
    enableTolerance: false,
    toleranceRange: 10,
    issueNumber: "",
    questions: [],
    // LLM Text Validation fields
    llmTextValidation: {
      question: "",
      validationParameters: [],
      temperature: 0.1,
      enableDetailedFeedback: false,
    },
    // Image Validation fields
    imageValidation: {
      question: "",
      validationParameters: [],
      temperature: 0.1,
      enableDetailedFeedback: false,
    },
    // File Content Validation fields
    fileContentValidation: {
      question: "",
      validationParameters: [],
      temperature: 0.1,
      enableDetailedFeedback: false,
    },
    expectedFilePath: "",
    // GitHub Actions Validation fields
    workflowFilePath: ".github/workflows/main.yml",
    validationParameters: [],
    enableDetailedFeedback: true,
    waitForWorkflowCompletion: false,
    requireStudentOwnership: false,
    requirePrivateRepo: false,
    maxWaitTimeSeconds: 120,
    // Repository Validation fields
    requireRepositoryExists: true,
    ownershipType: "any",
    specificOwner: "",
    checkBotAuthorization: false,
    requirePublic: false,
    requirePrivate: false,
    // Per-user save controls (enabled by default for llm-text-validation)
    saveValidatedData: true,
    savedDataName: "llm_validated_response",
  });

  // 3. Add a function to add a new blank task to questFormData (for Add New Quest modal)
  const handleAddTaskToQuest = () => {
    setQuestFormData((prev) => {
      const newTask = createBlankTask();
      const defaults = generateDefaultTexts(newTask.taskType);
      newTask.successText = defaults.successText;
      newTask.errorText = defaults.errorText;
      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
      };
    });
  };

  // 4. Add a function to add a new blank task to existing quests in the sequence builder
  const handleAddTaskToExistingQuest = (questIndex) => {
    // Generate the next task ID before creating the task
    const existingTaskIds = Object.keys(jsonContent.questSequence[questIndex].tasks || {});
    const nextTaskNumber = existingTaskIds.length + 1;
    const newTaskId = `T${nextTaskNumber}`;
    
    setJsonContent((prev) => {
      const newQuestSequence = [...prev.questSequence];
      const quest = newQuestSequence[questIndex];
      
      // Create a template MCQ task
      const templateTask = {
        title: `Task ${nextTaskNumber}`,
        taskTitle: `Task ${nextTaskNumber}`,
        desc: `Task ${nextTaskNumber}`,
        points: 20,
        xp: 20,
        type: "llm-text-validation",
        accept: "### 🤖 LLM Text Validation Task\n\n**Task:** This task uses AI to validate your text response.\n\n**Instructions:** Provide a detailed response to the question below. The AI will evaluate your answer based on the validation criteria.\n\n**Note:** Your response will be analyzed for accuracy, completeness, and relevance.",
        success: "✅ **Response Validated!**\n\nYour response has been successfully validated by the AI system.\n\n**Points earned:** 20\n\nGreat work! 🤖",
        error: "❌ **Response Needs Improvement**\n\nYour response didn't meet the validation criteria.\n\n**Please:** Review the question and provide a more detailed, accurate response.\n\n**Note:** The AI will re-evaluate your response when you submit again.",
        answer: "",
        answerType: "text",
        question: "[What would you like students to explain or analyze?]",
        options: [],
        correctAnswer: "",
        hints: [],
        detailedHints: [],
        questions: [],
        // Per-user save controls (enabled by default for llm-text-validation)
        saveValidatedData: true,
        savedDataName: "llm_validated_response"
      };
      
      // Add the template task to the quest
      quest.tasks[newTaskId] = templateTask;
      
      return { ...prev, questSequence: newQuestSequence };
    });
    
    // Refresh stored data list after adding task to existing quest
    loadStoredValues();
  };

  // 4. Add functions to edit, delete, and reorder tasks in questFormData.tasks
  const handleTaskChange = (taskIdx, field, value) => {
    setQuestFormData((prev) => {
      const updatedTasks = prev.tasks.map((task, idx) => {
        if (idx !== taskIdx) return task;
        if (field.startsWith("option-")) {
          const optionIdx = parseInt(field.split("-")[1], 10);
          const newOptions = [...task.options];
          newOptions[optionIdx].value = value;
          return { ...task, options: newOptions };
        }
        let updated = { ...task, [field]: value };
        if (field === "taskType") {
          const defaults = generateDefaultTexts(value);
          if (!updated.successText?.trim())
            updated.successText = defaults.successText;
          if (!updated.errorText?.trim())
            updated.errorText = defaults.errorText;
          
          // Initialize questions array for quiz tasks
          if (value === "quiz" && !updated.questions) {
            updated.questions = [];
          }
          
          // Initialize options array for multiple choice tasks
          if (value === "multiple-choice" && (!updated.options || updated.options.length < 2)) {
            updated.options = [
              { label: "A", value: "" },
              { label: "B", value: "" },
              { label: "C", value: "" },
              { label: "D", value: "" }
            ];
          }
        }
        return updated;
      });
      return { ...prev, tasks: updatedTasks };
    });
  };
  const handleDeleteTask = (taskIdx) => {
    // Show confirmation dialog instead of deleting immediately
    setTaskToDelete(taskIdx);
    setQuestToDeleteFrom('questForm');
    setShowDeleteTaskDialog(true);
  };


  const handleMoveTask = (taskIdx, direction) => {
    setQuestFormData((prev) => {
      const newTasks = [...prev.tasks];
      const newIndex = direction === "up" ? taskIdx - 1 : taskIdx + 1;
      if (newIndex < 0 || newIndex >= newTasks.length) return prev;
      [newTasks[taskIdx], newTasks[newIndex]] = [
        newTasks[newIndex],
        newTasks[taskIdx],
      ];
      
      // Schedule auto-centering after the state update and DOM re-render
      setTimeout(() => {
        const taskElement = document.querySelector(`[data-form-task-id="${newIndex}"]`);
        if (taskElement) {
          taskElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100); // Small delay to ensure DOM has updated
      
      return { ...prev, tasks: newTasks };
    });
  };

  // Load draft quests configuration
  const loadDraftQuests = async () => {
    if (!classId) return;

    try {
      setIsDraftLoading(true);
      console.log("🔄 Loading draft quests for class:", classId);

      const response = await axios.get(
        `${API_BASE_URL}/api/group/${classId}/draft-quest-config`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          params: {
            _t: Date.now() // Cache buster
          }
        }
      );

      if (response.data.success) {
        const draftConfig = response.data.data.draftQuestConfig || { questSequence: [] };
        console.log("📦 Raw draft config received:", JSON.stringify(draftConfig, null, 2));
        setDraftQuests(draftConfig);
        console.log("✅ Loaded draft quests:", draftConfig.questSequence?.length || 0);
        console.log("✅ Draft quests updated in state");
      }
    } catch (error) {
      console.error("Error loading draft quests:", error);
      setDraftQuests({ questSequence: [] });
    } finally {
      setIsDraftLoading(false);
    }
  };

  // Save draft quests configuration
  const saveDraftQuests = async (newDraftQuests = draftQuests) => {
    if (!classId) {
      console.log("❌ [DRAFT-SAVE] No classId available");
      return;
    }

    try {
      setIsDraftLoading(true);
      console.log("💾 [DRAFT-SAVE] Saving draft quests for class:", classId);
      console.log("📊 [DRAFT-SAVE] Quest count:", newDraftQuests.questSequence?.length || 0);

      const response = await axios.post(
        `${API_BASE_URL}/api/group/${classId}/draft-quest-config`,
        { draftQuestConfig: newDraftQuests }
      );

      if (response.data.success) {
        console.log("✅ [DRAFT-SAVE] Draft quests saved successfully to backend");
        setDraftSaveStatus("✅ Draft quests saved successfully!");
        setTimeout(() => setDraftSaveStatus(""), 3000);
      } else {
        console.log("❌ [DRAFT-SAVE] Backend reported save failure:", response.data);
        setDraftSaveStatus("❌ Failed to save draft quests");
        setTimeout(() => setDraftSaveStatus(""), 3000);
      }
    } catch (error) {
      console.error("❌ [DRAFT-SAVE] Error saving draft quests:", error);
      if (error.response) {
        console.error("❌ [DRAFT-SAVE] Response status:", error.response.status);
        console.error("❌ [DRAFT-SAVE] Response data:", error.response.data);
      }
      setDraftSaveStatus("❌ Error saving draft quests");
      setTimeout(() => setDraftSaveStatus(""), 3000);
    } finally {
      setIsDraftLoading(false);
    }
  };

  // Delete a draft quest
  const deleteDraftQuest = async (questIndex) => {
    if (!classId) return;

    try {
      // Optimistically update the UI first
      const updatedDraftQuests = {
        ...draftQuests,
        questSequence: draftQuests.questSequence.filter((_, index) => index !== questIndex)
      };
      setDraftQuests(updatedDraftQuests);
      setDraftSaveStatus("🔄 Deleting draft quest...");

      const response = await axios.delete(
        `${API_BASE_URL}/api/group/${classId}/draft-quest-config/${questIndex}`
      );

      if (response.data.success) {
        setDraftSaveStatus("✅ Draft quest deleted successfully!");
        setTimeout(() => setDraftSaveStatus(""), 3000);
      } else {
        // If backend failed, reload to get correct state
        await loadDraftQuests();
        setDraftSaveStatus("❌ Failed to delete draft quest");
        setTimeout(() => setDraftSaveStatus(""), 3000);
      }
    } catch (error) {
      console.error("Error deleting draft quest:", error);
      // Reload to get correct state
      await loadDraftQuests();
      setDraftSaveStatus("❌ Error deleting draft quest");
      setTimeout(() => setDraftSaveStatus(""), 3000);
    }
  };

  // Handle quest deletion confirmation
  const handleQuestDeleteClick = (questIndex, questTitle) => {
    setQuestToDelete({ index: questIndex, title: questTitle });
    setShowQuestDeleteConfirmationDialog(true);
  };

  const confirmQuestDelete = () => {
    if (questToDelete) {
      deleteDraftQuest(questToDelete.index);
      setShowQuestDeleteConfirmationDialog(false);
      setQuestToDelete(null);
    }
  };

  // Handle task deletion confirmation
  const handleTaskDeleteClick = (questIndex, taskId, taskTitle) => {
    setTaskToDelete({ questIndex, taskId, title: taskTitle });
    setShowTaskDeleteConfirmationDialog(true);
  };

  const confirmTaskDelete = () => {
    if (taskToDelete) {
      // Call the existing deleteTask function
      deleteTask(taskToDelete.questIndex, taskToDelete.taskId);
      setShowTaskDeleteConfirmationDialog(false);
      setTaskToDelete(null);
    }
  };

  // Handle purple deploy confirmation
  const handlePurpleDeployClick = (questIndex) => {
    const draftQuest = draftQuests.questSequence[questIndex];
    if (draftQuest) {
      // Check for duplicates
      const normalizedQuestTitle = (draftQuest?.title || "").trim().toLowerCase();
      const duplicateQuestWithLive = normalizedQuestTitle && liveQuestTitles.has(normalizedQuestTitle);
      const duplicateQuestWithDraft = normalizedQuestTitle && draftQuestTitleCounts[normalizedQuestTitle] > 1;
      
      const duplicateTaskWarnings = [];
      Object.entries(draftQuest?.tasks || {}).forEach(([taskKey, task]) => {
        const normalizedTaskTitle = (task?.title || task?.taskTitle || task?.desc || "").trim().toLowerCase();
        const duplicateTaskWithLive = normalizedTaskTitle && liveTaskTitles.has(normalizedTaskTitle);
        const duplicateTaskWithDraft = normalizedTaskTitle && draftTaskTitleCounts[normalizedTaskTitle] > 1;
        if (duplicateTaskWithLive || duplicateTaskWithDraft) {
          duplicateTaskWarnings.push({
            taskKey,
            taskTitle: task?.title || task?.taskTitle || task?.desc || taskKey,
            duplicateWithLive: duplicateTaskWithLive,
            duplicateWithDraft: duplicateTaskWithDraft
          });
        }
      });
      
      setQuestToDeploy({ 
        index: questIndex, 
        title: draftQuest.title,
        hasDuplicates: duplicateQuestWithLive || duplicateQuestWithDraft || duplicateTaskWarnings.length > 0,
        duplicateQuestWithLive,
        duplicateQuestWithDraft,
        duplicateTaskWarnings
      });
      setShowPurpleDeployConfirmationDialog(true);
    }
  };

  const confirmPurpleDeploy = () => {
    if (questToDeploy) {
      handlePurpleDeployQuest(questToDeploy.index);
      setShowPurpleDeployConfirmationDialog(false);
      setQuestToDeploy(null);
    }
  };

  // Handle quest deployment - creates new config with appended quest
  const handlePurpleDeployQuest = async (questIndex) => {
    const draftQuest = draftQuests.questSequence[questIndex];
    if (!draftQuest) return;

    console.log(`🟣 [FRONTEND] Starting purple quest deployment:`, {
      title: draftQuest.title,
      draftIndex: questIndex,
      classId
    });

    try {
      setIsPurpleDeploying(true);
      // Calculate the next quest number
      const nextQuestNumber = jsonContent.questSequence.length + 1;
      
      const questToDeploy = {
        ...draftQuest,
        draftIndex: questIndex,
        nextQuestId: `Q${nextQuestNumber}`
      };

      console.log(`📡 [FRONTEND] Calling purple deployment endpoint...`);
      // Call the purple deployment endpoint
      const response = await axios.post(`${API_BASE_URL}/api/gamification/purpleDeployQuest`, {
        classId: classId,
        draftQuestData: questToDeploy
      });

      const { 
        originalConfigId, 
        newConfigId, 
        newQuestId, 
        originalQuests, 
        newTotalQuests,
        studentsReadyForNewQuest,
        autoUnlockedCount
      } = response.data;
      console.log(`✅ [FRONTEND] Purple deployment successful:`, response.data);
      
      console.log(`🟣 [FRONTEND] Purple deployment summary:`);
      console.log(`   Original Config: ${originalConfigId} (${originalQuests} quests)`);
      console.log(`   New Config: ${newConfigId} (${newTotalQuests} quests)`);
      console.log(`   New Quest: ${newQuestId}`);
      console.log(`   Students Ready: ${studentsReadyForNewQuest || 0}`);
      console.log(`   Auto-Unlocked: ${autoUnlockedCount || 0}`);

      // Show deployment success message with auto-unlock info
      let successMessage = `✅ Successfully deployed ${newQuestId}!\n\n`;
      successMessage += `📊 Deployment Summary:\n`;
      successMessage += `   • Original Config: ${originalQuests} quests\n`;
      successMessage += `   • New Config: ${newTotalQuests} quests\n`;
      successMessage += `   • Students Ready: ${studentsReadyForNewQuest || 0}\n`;
      
      if (autoUnlockedCount && autoUnlockedCount > 0) {
        successMessage += `   • Auto-Unlocked: ${autoUnlockedCount} students\n`;
        successMessage += `\n🎉 The new quest has been automatically unlocked for eligible students!`;
        successMessage += `\n💬 "accept ${newQuestId}" comments were posted to their last closed issues.`;
      } else if (studentsReadyForNewQuest && studentsReadyForNewQuest > 0) {
        successMessage += `\n⚠️ Quest deployed but auto-unlock failed for some students.`;
        successMessage += `\n💡 Students will need to unlock manually when they complete prerequisites.`;
      } else {
        successMessage += `\nℹ️ No students are ready for this quest yet.`;
        successMessage += `\n💡 Students will unlock automatically when they complete prerequisites.`;
      }

      setIsPurpleDeploying(false);
      alert(successMessage);

      // Remove from draft quests
      const updatedDraftQuests = {
        ...draftQuests,
        questSequence: draftQuests.questSequence.filter((_, index) => index !== questIndex)
      };
      setDraftQuests(updatedDraftQuests);
      saveDraftQuests(updatedDraftQuests);
      console.log(`✅ [FRONTEND] Draft quest removed from index ${questIndex}`);

      // Add to main sequence for UI display
      const questForMain = {
        ...draftQuest,
        questId: newQuestId
      };
      setJsonContent(prev => ({
        ...prev,
        questSequence: [...prev.questSequence, questForMain]
      }));
      console.log(`✅ [FRONTEND] Main quest sequence updated with ${newQuestId}`);

      // Refresh quest data without full page reload
      console.log(`🔄 [FRONTEND] Refreshing quest data...`);
      // Reload the quest config from backend
      try {
        const response = await axios.get(`${API_BASE_URL}/api/group/${classId}/quest-json-config`);
        if (response.data.success && response.data.data.hasConfig && response.data.data.questJsonConfig) {
          const validatedConfig = validateAndFixQuestConfig(response.data.data.questJsonConfig);
          const configWithSequentialIds = {
            ...validatedConfig,
            questSequence: updateQuestIds(validatedConfig.questSequence),
          };
          setJsonContent(configWithSequentialIds);
          console.log(`✅ [FRONTEND] Quest data refreshed successfully`);
        }
      } catch (refreshError) {
        console.error(`❌ [FRONTEND] Failed to refresh quest data:`, refreshError);
      }
    } catch (error) {
      console.error(`❌ [FRONTEND] Purple deployment failed:`, error);
      setIsPurpleDeploying(false);
      alert(`❌ Failed to deploy quest: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsPurpleDeploying(false);
    }
  };

  // Function to create test repositories using draft quest configuration
  const createTestRepositories = async () => {
    if (!testUsernames.trim()) return;

    const usernames = testUsernames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (usernames.length === 0) return;

    setIsCreatingTestRepos(true);
    setTestRepos([]);

    const results = [];

    for (const username of usernames) {
      try {
        // Create test repository with draft quest configuration
        // Normalize draft quests: set sequence numbers and prerequisites in order
        const normalizedSequence = (draftQuests.questSequence || []).map((q, idx, arr) => {
          const prevQuestId = idx > 0 ? (arr[idx - 1]?.questId || null) : null;
          const metadata = {
            ...(q.metadata || {}),
            prerequisite: prevQuestId,
            type: q.metadata?.type || q.questType || "custom",
            title: q.metadata?.title || q.title || "",
            description: q.metadata?.description || q.description || "",
            sequenceNumber: idx
          };
          return {
            ...q,
            sequenceNumber: idx,
            metadata
          };
        });

        const testConfig = {
          questSequence: normalizedSequence,
          map_repo_link: "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map"
        };

        // Call the backend to create test repository
        const response = await axios.post(
          `${API_BASE_URL}/api/group/${classId}/create-test-repo`,
          {
            username,
            questConfig: testConfig,
            isTestRepo: true
          }
        );

        if (response.data.success) {
          results.push({
            username,
            success: true,
            url: response.data.repositoryUrl,
            error: null
          });
        } else {
          results.push({
            username,
            success: false,
            url: null,
            error: response.data.message || "Failed to create repository"
          });
        }
      } catch (error) {
        console.error(`Error creating test repo for ${username}:`, error);
        results.push({
          username,
          success: false,
          url: null,
          error: error.response?.data?.message || error.message || "Unknown error"
        });
      }
    }

    setTestRepos(results);
    setIsCreatingTestRepos(false);
  };

  // Load saved configuration on component mount
  useEffect(() => {
    const loadSavedConfig = async () => {
      if (!classId) {
        console.error("No classId available for loadSavedConfig");
        return;
      }

      try {
        setIsLoading(true);
        console.log(
          "🔄 Loading saved quest JSON configuration for class:",
          classId
        );

        const response = await axios.get(
          `${API_BASE_URL}/api/group/${classId}/quest-json-config`
        );

        console.log("🔍 Debug response data:", response.data);
        console.log("🔍 hasConfig:", response.data.data?.hasConfig);
        console.log("🔍 questJsonConfig:", response.data.data?.questJsonConfig);
        console.log(
          "🔍 questSequence length:",
          response.data.data?.questJsonConfig?.questSequence?.length
        );
        
        // Debug each quest's tasks from backend
        if (response.data.data?.questJsonConfig?.questSequence) {
          response.data.data.questJsonConfig.questSequence.forEach((quest, index) => {
            console.log(`🔍 [BACKEND] Quest ${index + 1} tasks:`, {
              questId: quest.questId,
              title: quest.title,
              tasks: quest.tasks,
              tasksType: typeof quest.tasks,
              hasTasksProperty: 'tasks' in quest
            });
          });
        }

        if (
          response.data.success &&
          response.data.data.hasConfig &&
          response.data.data.questJsonConfig &&
          response.data.data.questJsonConfig.questSequence &&
          response.data.data.questJsonConfig.questSequence.length > 0
        ) {
          console.log("✅ Loaded existing quest JSON configuration");
          // Validate and fix the loaded configuration, then apply sequential IDs
          const validatedConfig = validateAndFixQuestConfig(
            response.data.data.questJsonConfig
          );
          const configWithSequentialIds = {
            ...validatedConfig,
            questSequence: updateQuestIds(validatedConfig.questSequence),
          };
          setJsonContent(configWithSequentialIds);
          setSaveStatusType("success");
          setSaveStatus(
            `Last saved: ${new Date(
              response.data.data.lastUpdated
            ).toLocaleString()}`
          );
          setLastSavedAt(new Date(response.data.data.lastUpdated));
        } else {
          console.log(
            "📭 No existing quest JSON configuration found, keeping default quest configuration"
          );
          // Don't override the default content - it's already set in useState
          setSaveStatusType("");
          setSaveStatus("");
          setLastSavedAt(null);

          // Auto-save the default quest configuration to the backend
          console.log(
            "💾 Auto-saving default quest configuration to backend..."
          );
          setTimeout(() => {
            handleAutoSave();
          }, 1000); // Small delay to ensure component is fully mounted
        }
      } catch (error) {
        console.error("Error loading saved configuration:", error);
      } finally {
        setIsLoading(false);
        // Always attempt to load stored values after config loads
        loadStoredValues();
      }
    };

    loadSavedConfig();
    loadDraftQuests(); // Load draft quests too
  }, [classId]);

  // Also refresh stored values when we save the JSON
  useEffect(() => {
    loadStoredValues();
  }, [lastSavedAt, classId]);

  // Load collected_info data when component mounts (only once)
  useEffect(() => {
    if (classId) {
      console.log('🚀 Component mounted, loading collected_info data for class:', classId);
      // Reset the flag when class ID changes
      setHasLoadedCollectedInfo(false);
      // Only load if we don't already have the data
      if (Object.keys(storedValuesByUser).length === 0) {
        loadCollectedInfoData();
      }
    }
  }, [classId]); // Remove loadCollectedInfoData from dependencies to prevent loops

  // Auto-save configuration when jsonContent changes
  useEffect(() => {
    const autoSave = async () => {
      if (!autoSaveEnabled || isLoading || !classId) return;

      try {
        setIsSaving(true);
        setSaveStatusType("saving");
        setSaveStatus("Saving quest sequence...");
        console.log("💾 Auto-saving quest JSON configuration...");

        // Validate and fix quest configuration before saving
        const validatedConfig = validateAndFixQuestConfig(jsonContent);

        const response = await axios.post(
          `${API_BASE_URL}/api/group/${classId}/quest-json-config`,
          {
            questJsonConfig: validatedConfig,
          }
        );

        if (response.data.success) {
          setSaveStatusType("success");
          setSaveStatus(`Auto-saved: ${new Date().toLocaleString()}`);
          console.log("✅ Auto-save successful");
          setLastSavedAt(new Date());
          
          // Auto-refresh stored data values after successful save
          loadStoredValues();
          
          // Clear success status after 3 seconds
          setTimeout(() => {
            setSaveStatusType("");
            setSaveStatus("");
          }, 3000);
        }
      } catch (error) {
        console.error("❌ Auto-save failed:", error);
        setSaveStatusType("error");
        setSaveStatus("Auto-save failed");
        // Clear error status after 5 seconds
        setTimeout(() => {
          setSaveStatusType("");
          setSaveStatus("");
        }, 5000);
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce auto-save
    const timeoutId = setTimeout(autoSave, 2500);
    return () => clearTimeout(timeoutId);
  }, [jsonContent, autoSaveEnabled, isLoading, classId]);

  // Manual save function
  const handleManualSave = async () => {
    if (!classId) {
      console.error("No classId available for handleManualSave");
      setSaveStatusType("error");
      setSaveStatus("No class ID available");
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatusType("saving");
      setSaveStatus("Saving quest sequence...");
      console.log("💾 Manually saving quest JSON configuration...");

      // Validate and fix quest configuration before saving
      const validatedConfig = validateAndFixQuestConfig(jsonContent);

      const response = await axios.post(
        `${API_BASE_URL}/api/group/${classId}/quest-json-config`,
        {
          questJsonConfig: validatedConfig,
        }
      );

              if (response.data.success) {
          setSaveStatusType("success");
          setSaveStatus(`Saved: ${new Date().toLocaleString()}`);
          console.log("✅ Manual save successful");
          setLastSavedAt(new Date());
          
          // Auto-refresh stored data values after successful save
          loadStoredValues();
          
          // Clear success status after 3 seconds
          setTimeout(() => {
            setSaveStatusType("");
            setSaveStatus("");
          }, 3000);
        }
    } catch (error) {
      console.error("❌ Manual save failed:", error);
      setSaveStatusType("error");
      setSaveStatus("Save failed");
      // Clear error status after 5 seconds
      setTimeout(() => {
        setSaveStatusType("");
        setSaveStatus("");
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Create custom repositories function
  const handleCreateCustomRepos = async () => {
    if (!classId) {
      console.error("No classId available for handleCreateCustomRepos");
      setRepoCreationStatus("❌ No class ID available");
      return;
    }

    if (!githubUsername.trim()) {
      setRepoCreationStatus("❌ Please enter a GitHub username");
      return;
    }

    try {
      setIsCreatingRepos(true);
      setRepoCreationStatus("🔄 Creating custom repositories...");
      console.log("🚀 Creating custom repos for user:", githubUsername);
      console.log("📄 Using JSON configuration:", jsonContent);

      const response = await axios.post(
        `${API_BASE_URL}/api/repo/createCustomRepos`,
        {
          users: [githubUsername],
          customSequence: jsonContent,
          className: `custom-quest-${Date.now()}`,
          classId: classId,
        }
      );

      console.log("📋 Full response from server:", response.data);

      if (
        response.data.results &&
        response.data.results.successful &&
        response.data.results.successful.length > 0
      ) {
        const repoInfo = response.data.results.successful[0];
        const repoUrl = repoInfo.repoUrl;
        setRepoCreationStatus(`✅ Repository created successfully! 
Repository: ${repoUrl}
Student can now start their quest journey!`);
        console.log("✅ Repository creation successful:", response.data);
      } else if (
        response.data.results &&
        response.data.results.unsuccessful &&
        response.data.results.unsuccessful.length > 0
      ) {
        const error = response.data.results.unsuccessful[0].error;
        setRepoCreationStatus(`❌ Repository creation failed: ${error}`);
        console.error("❌ Repository creation failed:", response.data);
      } else if (response.data.message) {
        setRepoCreationStatus(`✅ ${response.data.message}`);
        console.log("✅ Repository creation completed:", response.data);
      } else {
        setRepoCreationStatus("❌ Unexpected response from server");
        console.error("❌ Unexpected response structure:", response.data);
      }
    } catch (error) {
      console.error("❌ Error creating repositories:", error);
      setRepoCreationStatus(
        `❌ Error creating repositories: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsCreatingRepos(false);
    }
  };

  // 5. Refactor handleAddQuest to build the quest.tasks object from questFormData.tasks
  const handleAddQuest = () => {
    // Remove questId generation from frontend
    // const questId = `CUSTOM_${questFormData.questId.toUpperCase().replace(/\s+/g, '_')}`;
    const sequenceNumber =
      editingQuestIndex !== null
        ? editingQuestIndex
        : jsonContent.questSequence.length;
    // Build tasks object
    const tasksObj = {};
    
    // When editing a quest, preserve existing tasks
    if (editingQuestIndex !== null) {
      let existingQuest;
      
      // Check if editing a draft quest (index >= 10000)
      if (editingQuestIndex >= 10000) {
        const draftIndex = editingQuestIndex - 10000;
        existingQuest = draftQuests.questSequence[draftIndex];
      } else {
        existingQuest = jsonContent.questSequence[editingQuestIndex];
      }
      
      if (existingQuest && existingQuest.tasks) {
        Object.entries(existingQuest.tasks).forEach(([taskId, task]) => {
          tasksObj[taskId] = task;
        });
      }
    } else {
      // When adding a new quest, build tasks from form data
      questFormData.tasks.forEach((task, idx) => {
        // Build taskData based on type (reuse your existing logic for each type)
        let taskData = {
          title: task.title || "", // Add task title
          taskTitle: task.title || "", // Add taskTitle field
          desc: task.title || task.taskDesc || task.acceptText || "Complete this task", // Use title as primary, fallback to others
          points: parseInt(task.points),
          xp: parseInt(task.points),
          hints: [],
          detailedHints: task.detailedHints || [],
        };
      if (task.taskType === "multiple-choice") {
        // Store question and options separately, but combine for display
        let acceptText = task.acceptText || "";
        if (task.question) {
          acceptText = `**Question:** ${task.question}\n\n`;
          task.options.forEach((opt) => {
            if (opt.value) acceptText += `${opt.label}) ${opt.value}\n`;
          });
          acceptText += `\n**Instructions:** Select the correct answer.`;
        }
        taskData = {
          ...taskData,
          type: "multiple-choice",
          accept: acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: task.correctAnswer,
          question: task.question,
          options: task.options,
        };
      } else if (task.taskType === "quiz") {
        // Build complete quiz content for the accept field
        let quizContent = `### 🧠 Quiz\n\n`;
        quizContent += `Quest: ${questFormData.title}\n\n`;
        quizContent += `Description: ${questFormData.description}\n\n`;
        quizContent += `Instructions: Answer all questions and submit your answers in the format [a,b,c,d,e] where each letter corresponds to your answer for each question.\n\n`;
        quizContent += `Example: If you think the answers are A, C, B, D, E, type: [a,c,b,d,e]\n\n`;

        (task.questions || []).forEach((q, index) => {
          if (q.question) {
            quizContent += `Question ${index + 1}: ${q.question}\n\n`;
            if (q.optionA) quizContent += `A) ${q.optionA}\n`;
            if (q.optionB) quizContent += `B) ${q.optionB}\n`;
            if (q.optionC) quizContent += `C) ${q.optionC}\n`;
            if (q.optionD) quizContent += `D) ${q.optionD}\n`;
            quizContent += `\n`;
          }
        });

        quizContent += `Submit your answers in the format [a,b,c,d,e] where each letter is your answer choice.`;

        let successText = task.successText
          .replace("{points}", task.points)
          .replace("[X]", "{correctCount}")
          .replace("[Y]", (task.questions || []).length);
        taskData = {
          ...taskData,
          type: "quiz",
          questions: (task.questions || []).filter((q) => q.question),
          accept: quizContent,
          success: successText,
          error: task.errorText,
          answer: "",
        };
      } else if (
        task.taskType === "get-issue-count" ||
        task.taskType === "get-pr-count" ||
        task.taskType === "get-top-contributor" ||
        task.taskType === "get-open-issue"
      ) {
        taskData = {
          ...taskData,
          type: task.taskType,
          ossRepository: task.repository,
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
          // per-user save (supported for get-issue-count)
          ...(task.taskType === "get-issue-count"
            ? {
                saveValidatedData: Boolean(task.saveValidatedData),
                savedDataName: task.savedDataName || "",
              }
            : {}),
        };
      } else if (task.taskType === "get-issue-title") {
        taskData = {
          ...taskData,
          type: "get-issue-title",
          ossRepository: task.repository,
          issueNumber: task.issueNumber,
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
          useStoredKey: Boolean(task.useStoredKey),
          selectedStoredKey: task.selectedStoredKey || "",
        };
      } else if (task.taskType === "issue-no") {
        taskData = {
          ...taskData,
          type: "issue-no",
          repository: task.repository,
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
          saveValidatedData: Boolean(task.saveValidatedData),
          savedDataName: task.savedDataName || "",
        };
      } else if (task.taskType === "custom-api-call") {
        taskData = {
          ...taskData,
          type: "custom-api-call",
          apiEndpoint: task.apiEndpoint,
          responsePath: task.responsePath,
          expectedAnswerType: task.expectedAnswerType,
          repository: task.repository,
          enableTolerance: task.enableTolerance || false,
          toleranceRange: task.toleranceRange || 10,
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
          saveValidatedData: Boolean(task.saveValidatedData),
          savedDataName: task.savedDataName || "",
        };
      } else if (task.taskType === "llm-text-validation") {
        taskData = {
          ...taskData,
          type: "llm-text-validation",
          llmTextValidation: {
            question: task.llmTextValidation?.question || "",
            validationParameters:
              task.llmTextValidation?.validationParameters || [],
            temperature: task.llmTextValidation?.temperature || 0.1,
            enableDetailedFeedback:
              task.llmTextValidation?.enableDetailedFeedback || false,
          },
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
        };
      } else if (task.taskType === "collect-info") {
        taskData = {
          ...taskData,
          type: "collect-info",
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
          saveValidatedData: Boolean(task.saveValidatedData),
          savedDataName: task.savedDataName || "collected_info",
        };
      } else if (task.taskType === "validate-fork-url") {
        taskData = {
          ...taskData,
          type: "validate-fork-url",
          repositoryToBeStored: task.repositoryToBeStored || "",
          requireOwnership: task.requireOwnership !== false,
          allowForkOfFork: task.allowForkOfFork !== false,
          saveValidatedData: Boolean(task.saveValidatedData),
          savedDataName: task.savedDataName || "",
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
        };
      } else if (task.taskType === "validate-file-exists") {
        taskData = {
          ...taskData,
          type: "validate-file-exists",
          expectedFileName: task.expectedFileName || "",
          expectedFileType: task.expectedFileType || "",
          saveValidatedData: Boolean(task.saveValidatedData),
          savedDataName: task.savedDataName || "",
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
        };
      } else if (task.taskType === "validate-file-content") {
        taskData = {
          ...taskData,
          type: "validate-file-content",
          expectedFilePath: task.expectedFilePath || "",
          fileContentValidation: {
            question: task.fileContentValidation?.question || "",
            validationParameters: Array.isArray(task.fileContentValidation?.validationParameters)
              ? task.fileContentValidation.validationParameters.filter(p => p && p.trim())
              : [],
            temperature: typeof task.fileContentValidation?.temperature === 'number'
              ? task.fileContentValidation.temperature
              : 0.1,
            enableDetailedFeedback: Boolean(task.fileContentValidation?.enableDetailedFeedback),
          },
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
        };
      } else if (task.taskType === "validate-pr-url") {
        taskData = {
          ...taskData,
          type: "validate-pr-url",
          targetRepository: task.targetRepository || "",
          targetBranch: task.targetBranch || "main",
          sourceRepository: task.sourceRepository || "",
          requireOwnership: task.requireOwnership !== false,
          requireOpenState: task.requireOpenState !== false,
          saveValidatedData: Boolean(task.saveValidatedData),
          savedDataName: task.savedDataName || "",
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
        };
      } else if (task.taskType === "validate-push") {
        taskData = {
          ...taskData,
          type: "validate-push",
          targetRepository: task.targetRepository || "",
          targetBranch: task.targetBranch || "main",
          requireOwnership: task.requireOwnership !== false,
          requireRecentPush: Boolean(task.requireRecentPush),
          recentPushWindowHours: task.recentPushWindowHours || 24,
          expectedFilePath: task.expectedFilePath || "",
          saveValidatedData: Boolean(task.saveValidatedData),
          savedDataName: task.savedDataName || "",
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
        };
      } else if (task.taskType === "iterative-code-review") {
        taskData = {
          ...taskData,
          type: "iterative-code-review",
          iterativeCodeReview: {
            reviewPrompt: task.iterativeCodeReview?.reviewPrompt || "",
            reviewCriteria: Array.isArray(task.iterativeCodeReview?.reviewCriteria)
              ? task.iterativeCodeReview.reviewCriteria.filter(c => c && c.trim())
              : [],
            maxIterations: typeof task.iterativeCodeReview?.maxIterations === 'number'
              ? task.iterativeCodeReview.maxIterations
              : 5,
            temperature: typeof task.iterativeCodeReview?.temperature === 'number'
              ? task.iterativeCodeReview.temperature
              : 0.3,
            enableDetailedFeedback: task.iterativeCodeReview?.enableDetailedFeedback !== false,
            prFilePattern: task.iterativeCodeReview?.prFilePattern || "",
            commentOnPR: task.iterativeCodeReview?.commentOnPR !== false,
            approvePR: task.iterativeCodeReview?.approvePR === true,
            mergePR: task.iterativeCodeReview?.mergePR === true,
            mergeMethod: task.iterativeCodeReview?.mergeMethod || 'merge',
          },
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
        };
      } else if (task.taskType === "bot-code-review") {
        taskData = {
          ...taskData,
          type: "bot-code-review",
          botCodeReview: {
            acceptMessage: task.botCodeReview?.acceptMessage || "",
            originalCode: task.botCodeReview?.originalCode || "",
            codeLanguage: task.botCodeReview?.codeLanguage || "cpp",
            requirements: task.botCodeReview?.requirements || "",
            knownIssues: Array.isArray(task.botCodeReview?.knownIssues)
              ? task.botCodeReview.knownIssues.filter(i => i && i.trim())
              : [],
            maxIterations: typeof task.botCodeReview?.maxIterations === 'number'
              ? task.botCodeReview.maxIterations
              : 5,
            temperature: typeof task.botCodeReview?.temperature === 'number'
              ? task.botCodeReview.temperature
              : 0.3,
            enableDetailedFeedback: task.botCodeReview?.enableDetailedFeedback !== false,
            awardPointsOnFailure: task.botCodeReview?.awardPointsOnFailure === true,
            createPR: task.botCodeReview?.createPR === true,
            validateOnApproval: task.botCodeReview?.validateOnApproval !== false,
            fileName: task.botCodeReview?.fileName || 'code.cpp',
          },
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
        };
      } else if (task.taskType === "validate-github-actions") {
        taskData = {
          ...taskData,
          type: "validate-github-actions",
          githubActionsValidation: {
            workflowFilePath: task.workflowFilePath || ".github/workflows/main.yml",
            question: task.acceptText || "",
            validationParameters: Array.isArray(task.validationParameters)
              ? task.validationParameters.filter(p => p && p.trim())
              : [],
            temperature: typeof task.temperature === 'number'
              ? task.temperature
              : 0.1,
            enableDetailedFeedback: task.enableDetailedFeedback !== false,
            waitForWorkflowCompletion: task.waitForWorkflowCompletion === true,
            requireStudentOwnership: task.requireStudentOwnership === true,
            requirePrivateRepo: task.requirePrivateRepo === true,
            maxWaitTimeSeconds: typeof task.maxWaitTimeSeconds === 'number'
              ? task.maxWaitTimeSeconds
              : 120,
          },
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
        };
      } else if (task.taskType === "validate-repository") {
        taskData = {
          ...taskData,
          type: "validate-repository",
          repositoryValidation: {
            requireRepositoryExists: task.requireRepositoryExists !== false,
            ownershipType: task.ownershipType || "any",
            specificOwner: task.specificOwner || "",
            checkBotAuthorization: task.checkBotAuthorization === true,
            requirePublic: task.requirePublic === true,
            requirePrivate: task.requirePrivate === true,
            saveValidatedData: task.saveValidatedData === true,
            savedDataName: task.savedDataName || "validatedRepo",
          },
          accept: task.acceptText,
          success: task.successText.replace("{points}", task.points),
          error: task.errorText,
          answer: "",
        };
              }
        tasksObj[`T${idx + 1}`] = taskData;
      });
    }
    // Create new quest with temporary ID (will be updated by updateQuestIds)
    const newQuest = {
      questId: `TEMP_${Date.now()}`, // Temporary ID, will be replaced
      title: questFormData.title,
      description: questFormData.description, // Add description to main quest object
      isQ0: false,
      questType: "custom",
      sequenceNumber: sequenceNumber,
      metadata: {
        title: questFormData.title,
        description: questFormData.description,
        prerequisite: null, // Will be set by updateQuestIds
        type: "custom",
      },
      badgeDescription: "Custom Quest 🎯",
      tasks: tasksObj,
    };

    // Check if editing an existing quest
    if (editingQuestIndex !== null) {
      // Check if editing a draft quest (index >= 10000)
      if (editingQuestIndex >= 10000) {
        // Editing draft quest
        const draftIndex = editingQuestIndex - 10000;
        const updatedDraftQuests = {
          ...draftQuests,
          questSequence: draftQuests.questSequence.map((quest, index) =>
            index === draftIndex ? {
              ...quest, // Preserve existing quest properties
              title: newQuest.title,
              description: newQuest.description,
              tasks: newQuest.tasks,
              metadata: newQuest.metadata
            } : quest
          ),
        };
        setDraftQuests(updatedDraftQuests);
        saveDraftQuests(updatedDraftQuests);
        console.log("Updated draft quest:", newQuest.title);
      } else {
        // Editing existing main sequence quest
        setJsonContent((prev) => {
          let newSequence = [...prev.questSequence];
          newSequence[editingQuestIndex] = newQuest;
          // Update quest IDs to be sequential
          const updatedSequence = updateQuestIds(newSequence);

      // Save the updated quest to Quest Bank with correct ID
      const updatedQuest =
        updatedSequence[
          editingQuestIndex !== null
            ? editingQuestIndex
            : updatedSequence.length - 1
        ];
      const tasksArray = Object.values(updatedQuest.tasks).map((task, idx) => {
        // Generate default response texts based on task type
        const defaultTexts = generateDefaultTexts(
          task.taskType || task.type,
          task.repository,
          task.issueNumber
        );

        return {
          // Required fields for TaskModel
          taskTitle: task.title || task.taskTitle || `Task ${idx + 1}`,
          desc: task.title || task.taskDesc || task.desc || task.accept || task.acceptText || "Complete this task",
          points:
            typeof task.points === "number"
              ? task.points
              : parseInt(task.points, 10) || 20,
          xp:
            typeof task.xp === "number"
              ? task.xp
              : parseInt(task.xp, 10) || parseInt(task.points, 10) || 20,
          responses: {
            accept:
              task.accept || task.responses?.accept || defaultTexts.acceptText,
            error:
              task.error || task.responses?.error || defaultTexts.errorText,
            success:
              task.success ||
              task.responses?.success ||
              defaultTexts.successText,
          },
          answerType:
            task.answerType ||
            (task.taskType === "custom-api-call"
              ? "custom"
              : task.taskType === "multiple-choice"
              ? "singleAnswer"
              : task.taskType === "quiz"
              ? "multipleAnswers"
              : task.taskType === "llm-text-validation"
              ? "llm-validation"
              : "metric"),
          answer: task.answer || "",
          type: task.taskType || task.type,
          // Multiple choice specific fields
          question: task.question || "",
          correctAnswer: task.correctAnswer || task.answer || "",
          options: task.options || [],
          // Custom API call fields
          apiEndpoint: task.apiEndpoint || "",
          responsePath: task.responsePath || "",
          expectedAnswerType: task.expectedAnswerType || "Number",
          repository: task.repository || "",
          saveValidatedData: Boolean(task.saveValidatedData),
          savedDataName: task.savedDataName || "",
          // Tolerance fields
          enableTolerance: task.enableTolerance || false,
          toleranceRange: task.toleranceRange || 10,
          // LLM Text Validation fields (ensure required fields when used)
          llmTextValidation: {
            question:
              task.llmTextValidation?.question ||
              task.accept ||
              task.responses?.accept ||
              defaultTexts.acceptText ||
              "Answer the question",
            validationParameters:
              task.llmTextValidation?.validationParameters || [],
            temperature:
              typeof task.llmTextValidation?.temperature === "number"
                ? task.llmTextValidation.temperature
                : 0.1,
            enableDetailedFeedback: Boolean(
              task.llmTextValidation?.enableDetailedFeedback
            ),
          },
          // Hints
          detailedHints: task.detailedHints || [],
          // Optionally include other fields as needed
          ...task,
        };
      });
      const questBankPayload = {
        ...updatedQuest,
        professorId: authUser?._id,
        questTitle: updatedQuest.title,
        tasks: tasksArray,
      };
        console.log("Saving to Quest Bank:", questBankPayload);
        saveQuestToBank(questBankPayload);

        return { ...prev, questSequence: updatedSequence };
      });
      }
    } else {
      // Adding new quest - goes to drafts
      const updatedDraftQuests = {
        ...draftQuests,
        questSequence: [...draftQuests.questSequence, newQuest],
      };
      setDraftQuests(updatedDraftQuests);
      saveDraftQuests(updatedDraftQuests);
      
      console.log("Added new quest to drafts:", newQuest.title);
    }

    // Reset form and close modal
    setQuestFormData({ title: "", description: "", tasks: [] });
    setShowAddQuestModal(false);
    setEditingQuestIndex(null);
    
    // Refresh stored data list after adding/editing quest
    loadStoredValues();
  };

  // Quiz helper functions
  const addQuestion = () => {
    setQuestFormData((prev) => ({
      ...prev,
      questions: [
        ...(prev.questions || []),
        {
          question: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctAnswer: "a",
          explanation: "",
        },
      ],
    }));
  };

  const removeQuestion = (taskIdx, qIdx) => {
    setQuestFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, tIdx) => {
        if (tIdx !== taskIdx) return task;
        return {
          ...task,
          questions: (task.questions || []).filter((_, i) => i !== qIdx),
        };
      }),
    }));
  };

  const updateQuestion = (taskIdx, qIdx, field, value) => {
    setQuestFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, tIdx) => {
        if (tIdx !== taskIdx) return task;
        return {
          ...task,
          questions: (task.questions || []).map((q, i) =>
            i === qIdx ? { ...q, [field]: value } : q
          ),
        };
      }),
    }));
  };

  // README handling functions
  const handleReadmeFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        console.log(`🚀 [README Modal] Opening README modal via file upload for class: ${classId}`);
        setReadmeContent(content);
        setShowReadmeModal(true);
        // Fetch student count when opening README modal
        console.log(`📞 [README Modal] Calling fetchStudentCount...`);
        fetchStudentCount();
      };
      reader.readAsText(file);
    } else {
      alert("Please select a .md file");
    }
    // Reset the input
    event.target.value = "";
  };

  const handleReadmeSave = () => {
    setJsonContent((prev) => ({
      ...prev,
      readme: readmeContent,
    }));
    setShowReadmeModal(false);
  };

  // New function to handle batch README update
  const handleReadmeSaveAndPublish = async () => {
    setShowBatchUpdateConfirm(false);
    setIsBatchUpdating(true);
    setBatchUpdateStatus("Saving README and updating all student repositories...");

    try {
      // First save the README locally
      setJsonContent((prev) => ({
        ...prev,
        readme: readmeContent,
      }));

      // Call the new batch update endpoint
      const response = await axios.post(
        `${API_BASE_URL}/api/group/${classId}/readme/batch-update`,
        {
          content: readmeContent,
          fileName: 'README.md',
          pushToRepos: true
        }
      );

      if (response.data.batchUpdate && response.data.batchUpdate.results) {
        const { successful, failed, total } = response.data.batchUpdate.results;
        setBatchUpdateStatus(
          `✅ Batch update completed! ${successful.length}/${total} repositories updated successfully.` +
          (failed.length > 0 ? ` ${failed.length} failed.` : '')
        );

        // After successful batch update, update README with quest progress for each student
        if (successful.length > 0) {
          setBatchUpdateStatus("🔄 Updating README with quest progress for each student...");
          
          try {
            // Get the list of students for this class
            const studentsResponse = await axios.get(`${API_BASE_URL}/api/group/${classId}/students`);
            const students = studentsResponse.data.students || [];
            
            // Update README with quest progress for each successful repository
            for (const repo of successful) {
              const student = students.find(s => s.github === repo.username);
              if (student) {
                try {
                  await axios.post(`${API_BASE_URL}/api/gamification/updateReadme`, {
                    studentId: student._id,
                    groupId: classId
                  });
                  console.log(`✅ Updated README with quest progress for ${repo.username}`);
                } catch (updateError) {
                  console.error(`❌ Failed to update quest progress for ${repo.username}:`, updateError);
                }
              }
            }
            
            setBatchUpdateStatus("🎉 All READMEs updated with quest progress!");
          } catch (progressError) {
            console.error("Error updating quest progress:", progressError);
            setBatchUpdateStatus("✅ READMEs updated, but quest progress update failed");
          }
        }
      } else {
        setBatchUpdateStatus("✅ README saved successfully!");
      }
      
      // Auto-close after a delay
      setTimeout(() => {
        setShowReadmeModal(false);
        setIsBatchUpdating(false);
        setBatchUpdateStatus("");
      }, 5000); // Increased delay to show quest progress update

    } catch (error) {
      console.error("Error updating README across repositories:", error);
      setBatchUpdateStatus("❌ Error updating repositories. Please try again.");
      setIsBatchUpdating(false);
    }
  };

  // Fetch student count using the same logic as ManageStudents
  const fetchStudentCount = async () => {
    console.log(`🔍 [fetchStudentCount] Starting for class: ${classId}`);
    try {
      // Use the same approach as ManageStudents: get class info, then list repos
      // 1) Get class info for groupName
      const classResp = await axios.get(`${API_BASE_URL}/api/group/class/${classId}`);
      const group = classResp.data;
      const groupName = group?.groupName || '';
      console.log(`📋 [fetchStudentCount] Group name: ${groupName}`);
      if (!groupName) {
        console.log(`❌ [fetchStudentCount] No group name found`);
        setStudentCount(0);
        return;
      }

      // 2) Get organizationGh
      const orgResp = await axios.get(`${API_BASE_URL}/api/repo/prodStatus`);
      const organizationGh = orgResp.data?.organizationGh;
      console.log(`🏢 [fetchStudentCount] Organization: ${organizationGh}`);
      if (!organizationGh) {
        console.log(`❌ [fetchStudentCount] No organization found`);
        setStudentCount(0);
        return;
      }

      // 3) List repos and filter by formatted class name (exact ManageStudents logic)
      const listResp = await axios.get(`${API_BASE_URL}/api/repo/listRepos`, { params: { organizationGh } });
      const repos = Array.isArray(listResp.data?.repos) ? listResp.data.repos : [];
      console.log(`📊 [fetchStudentCount] Found ${repos.length} total repos`);

      // Format class name to match repository naming convention (exact ManageStudents logic)
      const formattedClassName = groupName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      console.log(`🔧 [fetchStudentCount] Formatted class name: ${formattedClassName}`);

      // Filter repositories to only show ones for this class using username-classname format
      const classRepos = repos
        .filter(repo => repo.name && repo.name.endsWith(`-${formattedClassName}`))
        .map(repo => repo.name.replace(`-${formattedClassName}`, ''));

      console.log(`✅ [fetchStudentCount] Found ${classRepos.length} students:`, classRepos);
      setStudentCount(classRepos.length);
    } catch (error) {
      console.error('❌ [fetchStudentCount] Error fetching student count:', error);
      setStudentCount(0);
    }
  };

  // Add to useEffect to fetch student count
  useEffect(() => {
    if (classId) {
      fetchStudentCount();
    }
  }, [classId]);

  // Refresh count whenever the README modal opens
  useEffect(() => {
    if (showReadmeModal && classId) {
      fetchStudentCount();
    }
  }, [showReadmeModal, classId]);

  // Function to fetch saved quests from database
  const fetchSavedQuests = useCallback(async () => {
    if (!classId) return;
    
    setIsLoadingSavedQuests(true);
    setSavedQuestsError("");
    
    try {
      console.log('🔍 [fetchSavedQuests] Fetching saved quests for class:', classId);
      
      // First, get the class/group information to find the professor
      const groupResponse = await axios.get(`${API_BASE_URL}/api/group/${classId}`);
      
      if (!groupResponse.data || !groupResponse.data.success) {
        throw new Error('Failed to fetch class information');
      }
      
      const group = groupResponse.data.data;
      console.log('✅ [fetchSavedQuests] Found group:', group);
      
      // Now fetch all quests from the database (we'll filter them later)
      const questsResponse = await axios.get(`${API_BASE_URL}/api/quest/all`);
      
      if (questsResponse.data && questsResponse.data.success) {
        console.log('✅ [fetchSavedQuests] Successfully fetched all quests:', questsResponse.data.data);
        setSavedQuests(questsResponse.data.data || []);
      } else {
        console.log('⚠️ [fetchSavedQuests] No quests found or invalid response');
        setSavedQuests([]);
      }
    } catch (error) {
      console.error('❌ [fetchSavedQuests] Error fetching saved quests:', error);
      setSavedQuestsError(error.response?.data?.message || 'Failed to fetch saved quests');
      setSavedQuests([]);
    } finally {
      setIsLoadingSavedQuests(false);
    }
  }, [classId]);

  // Fetch saved quests from database when component loads
  useEffect(() => {
    if (classId) {
      fetchSavedQuests();
    }
  }, [classId, fetchSavedQuests]);

  // Socket.io connection for real-time draft quest config updates
  useEffect(() => {
    if (!classId) return;

    // Connect to socket.io server
    const socketUrl = API_BASE_URL.replace('/api', '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to socket server');
      socket.emit('join-class', classId);
    });

    socket.on('draft-quest-config-updated', async (data) => {
      console.log('🔔 Received draft-quest-config-updated event:', data);
      setDraftUpdateInfo(data);
      setShowDraftUpdateAlert(true);
      
      // Auto-refresh draft quests in the background
      console.log('🔄 Auto-refreshing draft quest config after notification...');
      await loadDraftQuests();
      console.log('✅ Draft quest config auto-refreshed');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from socket server');
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave-class', classId);
      socket.disconnect();
    };
  }, [classId]);

  const handleReadmeRemove = () => {
    setJsonContent((prev) => {
      const newContent = { ...prev };
      delete newContent.readme;
      return newContent;
    });
    setReadmeContent("");
  };

  const handleRemoveAndPublishEmpty = async () => {
    setShowRemoveReadmeConfirm(false);
    setIsBatchUpdating(true);
    setBatchUpdateStatus("Removing README and publishing empty instructor section across all student repositories...");

    try {
      // Clear local config first
      handleReadmeRemove();

      // Publish empty content for first section, preserving second section boundary
      const response = await axios.post(
        `${API_BASE_URL}/api/group/${classId}/readme/batch-update`,
        {
          content: "",
          fileName: 'README.md',
          pushToRepos: true
        }
      );

      if (response.data.batchUpdate && response.data.batchUpdate.results) {
        const { successful, failed, total } = response.data.batchUpdate.results;
        setBatchUpdateStatus(
          `✅ README removed. ${successful.length}/${total} repositories updated.` +
          (failed.length > 0 ? ` ${failed.length} failed.` : '')
        );
      } else {
        setBatchUpdateStatus("✅ README removed successfully!");
      }

      setTimeout(() => {
        setShowReadmeModal(false);
        setIsBatchUpdating(false);
        setBatchUpdateStatus("");
      }, 2500);
    } catch (error) {
      console.error("Error removing README across repositories:", error);
      setBatchUpdateStatus("❌ Error removing README across repositories.");
      setIsBatchUpdating(false);
    }
  };

  // Ensure page returns to the edited item after saves instead of jumping
  const scrollIntoCenter = (element) => {
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    if (typeof element.focus === 'function') {
      element.focus({ preventScroll: true });
    }
  };

  const scrollToQuestIndex = (questIndex) => {
    // Use the same approach as moveQuest: rely on rendered order
    const questElements = document.querySelectorAll('[data-quest-id]');
    if (questElements && questElements[questIndex]) {
      scrollIntoCenter(questElements[questIndex]);
    }
  };

  const scrollToTask = (questIndex, taskId) => {
    // Matches the selector used after moving tasks
    const taskElement = document.querySelector(`[data-task-id="${taskId}"][data-quest-index="${questIndex}"]`);
    if (taskElement) {
      scrollIntoCenter(taskElement);
    }
  };

  // Quest management functions
  const moveQuest = useCallback((questIndex, direction) => {
    const newIndex = direction === "up" ? questIndex - 1 : questIndex + 1;
    if (newIndex < 0 || newIndex >= jsonContent.questSequence.length) return;

    setJsonContent((prev) => {
      const newQuestSequence = [...prev.questSequence];
      const [movedQuest] = newQuestSequence.splice(questIndex, 1);
      newQuestSequence.splice(newIndex, 0, movedQuest);

      // Update quest IDs to be sequential based on new positions
      const updatedSequence = updateQuestIds(newQuestSequence);
      
      // Schedule auto-centering after the state update and DOM re-render
      setTimeout(() => {
        // Find the quest by its new position in the sequence
        const questElements = document.querySelectorAll('[data-quest-id]');
        if (questElements[newIndex]) {
          questElements[newIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100); // Small delay to ensure DOM has updated
      
      return { ...prev, questSequence: updatedSequence };
    });
    
    // Refresh stored data list after moving quest
    loadStoredValues();
  }, [jsonContent.questSequence]);

    // Edit quest modal - only for quest title and description (no tasks)
  const editQuest = (questIndex) => {
    const quest = jsonContent.questSequence[questIndex];
    
    setEditingQuestData({
      title: quest.title,
      description: quest.metadata?.description || "",
    });
    setEditingQuestIndex(questIndex);
    setShowEditQuestModal(true);
  };

  // Save edited quest
  const saveEditedQuest = () => {
    if (!editingQuestData || editingQuestIndex === null) return;
    
    // Check if this is a draft quest (index >= 10000) or main sequence quest
    if (editingQuestIndex >= 10000) {
      // This is a draft quest - save directly without quest config warning
      confirmSaveEditedQuest();
    } else {
      // This is a main sequence quest - show quest config warning
      setQuestEditMessage("This will create a new quest configuration and migrate all students to the updated version.");
      setShowQuestEditConfirmationDialog(true);
    }
  };

  // Confirm save edited quest
  const confirmSaveEditedQuest = async () => {
    try {
      console.log(`🔄 [QUEST-EDIT-CONFIRM] Starting quest edit save process`);
      
      const updatedQuest = {
        title: editingQuestData.title,
        description: editingQuestData.description
      };

      if (editingQuestIndex >= 10000) {
        // This is a draft quest - update draftQuests directly
        const draftIndex = editingQuestIndex - 10000;
        setDraftQuests(prev => {
          const newDrafts = [...prev];
          newDrafts[draftIndex] = {
            ...newDrafts[draftIndex],
            title: updatedQuest.title,
            metadata: {
              ...newDrafts[draftIndex].metadata,
              description: updatedQuest.description
            }
          };
          return newDrafts;
        });
        
        setQuestEditMessage("Draft quest updated successfully!");
        setShowQuestEditSuccessDialog(true);
        // Return user to the edited draft quest block
        setTimeout(() => scrollToQuestIndex(editingQuestIndex - 10000 + 10000), 50);
      } else {
        // This is a main sequence quest - update live config
        console.log(`🔄 [QUEST-EDIT-CONFIRM] Updating live quest config for quest ${editingQuestIndex}`);
        
        await updateLiveConfigForCurrentUsers(updatedQuest, editingQuestIndex, null, 'quest');
        
        // Update local jsonContent
        setJsonContent(prev => {
          const newSequence = [...prev.questSequence];
          newSequence[editingQuestIndex] = {
            ...newSequence[editingQuestIndex],
            title: updatedQuest.title,
            metadata: {
              ...newSequence[editingQuestIndex].metadata,
              description: updatedQuest.description
            }
          };
          return { ...prev, questSequence: newSequence };
        });
        
        setQuestEditMessage("Quest updated successfully! All students have been migrated to the new configuration.");
        setShowQuestEditSuccessDialog(true);
        // Return user to the edited quest block in main sequence
        setTimeout(() => scrollToQuestIndex(editingQuestIndex), 50);
      }
      
      // Close the edit modal
      setShowEditQuestModal(false);
      setEditingQuestData(null);
      setEditingQuestIndex(null);
      
    } catch (error) {
      console.error(`❌ [QUEST-EDIT-CONFIRM] Error saving quest:`, error);
      setQuestEditMessage(`Failed to update quest: ${error.message}`);
      setShowQuestEditErrorDialog(true);
    }
  };

  const deleteQuest = (questIndex) => {
    setJsonContent((prev) => {
      const newQuestSequence = prev.questSequence.filter(
        (_, index) => index !== questIndex
      );

      // Update quest IDs to be sequential based on new positions
      return { ...prev, questSequence: updateQuestIds(newQuestSequence) };
    });
    
    // Refresh stored data list after deleting quest
    loadStoredValues();
  };

  const moveTask = (questIndex, taskId, direction) => {
    setJsonContent((prev) => {
      const newQuestSequence = [...prev.questSequence];
      const quest = newQuestSequence[questIndex];
      const taskEntries = Object.entries(quest.tasks || {});
      const currentIndex = taskEntries.findIndex(([key]) => key === taskId);
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= taskEntries.length) return prev;

      // Swap the tasks in the array
      [taskEntries[currentIndex], taskEntries[newIndex]] = [
        taskEntries[newIndex],
        taskEntries[currentIndex],
      ];

      // Rebuild tasks object with new ordering but keeping T1, T2, T3... keys
      const newTasks = {};
      taskEntries.forEach(([_, taskData], index) => {
        newTasks[`T${index + 1}`] = taskData;
      });

      quest.tasks = newTasks;
      
      // Schedule auto-centering after the state update and DOM re-render
      setTimeout(() => {
        const movedTaskId = direction === "up" ? taskEntries[newIndex][0] : taskEntries[currentIndex][0];
        const taskElement = document.querySelector(`[data-task-id="${movedTaskId}"][data-quest-index="${questIndex}"]`);
        if (taskElement) {
          taskElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100); // Small delay to ensure DOM has updated
      
      return { ...prev, questSequence: newQuestSequence };
    });
    
    // Refresh stored data list after moving task
    loadStoredValues();
  };

  const editTask = (questIndex, taskId) => {
    console.log(`✏️ [TASK-EDIT] Opening task editor:`, { questIndex, taskId, isDraft: questIndex >= 10000 });
    
    // Get the quest and task
    let quest;
    if (questIndex >= 10000) {
      const draftIndex = questIndex - 10000;
      quest = draftQuests.questSequence[draftIndex];
      console.log(`🟡 [TASK-EDIT] Loading from draft quest at index ${draftIndex}`);
    } else {
      quest = jsonContent.questSequence[questIndex];
      console.log(`🔵 [TASK-EDIT] Loading from main sequence at index ${questIndex}`);
    }
    
    const task = quest.tasks[taskId];
    console.log(`📋 [TASK-EDIT] Original task data:`, task);
    
    // Create proper task data object with all required fields
    const taskData = {
      taskType: task.type || "multiple-choice",
      title: task.title || task.taskTitle || "",
      taskDesc: task.desc || task.title || task.taskTitle || "",
      points: task.points || 0,
      xp: task.xp || 0,
      acceptText: task.accept || task.responses?.accept || "",
      successText: task.success || task.responses?.success || "",
      errorText: task.error || task.responses?.error || "",
      question: task.question || "",
      correctAnswer: task.correctAnswer || task.answer || "",
      answer: task.answer || "",
      answerType: task.answerType || "",
      repository: task.repository || task.ossRepository || "",
      issueNumber: task.issueNumber || "",
      apiEndpoint: task.apiEndpoint || "",
      responsePath: task.responsePath || "",
      expectedAnswerType: task.expectedAnswerType || "Number",
      enableTolerance: task.enableTolerance || false,
      toleranceRange: task.toleranceRange || 10,
      saveValidatedData: task.saveValidatedData || false,
      savedDataName: task.savedDataName || "",
      // Validate Fork URL fields
      repositoryToBeStored: task.repositoryToBeStored || "",
      requireOwnership: task.requireOwnership !== undefined ? task.requireOwnership : true,
      allowForkOfFork: task.allowForkOfFork !== undefined ? task.allowForkOfFork : true,
      storeForkUrl: task.storeForkUrl !== undefined ? task.storeForkUrl : true,
      // Validate File Exists fields
      expectedFileName: task.expectedFileName || "",
      expectedFileType: task.expectedFileType || "",
      // Validate PR URL fields
      targetRepository: task.targetRepository || "",
      targetBranch: task.targetBranch || "main",
      sourceRepository: task.sourceRepository || "",
      requireOwnership: task.requireOwnership !== undefined ? task.requireOwnership : true,
      requireOpenState: task.requireOpenState !== undefined ? task.requireOpenState : true,
      options: Array.isArray(task.options) ? task.options : [
        { label: "A", value: task.optionA || "" },
        { label: "B", value: task.optionB || "" },
        ...(task.optionC ? [{ label: "C", value: task.optionC }] : []),
        ...(task.optionD ? [{ label: "D", value: task.optionD }] : []),
        ...(task.optionE ? [{ label: "E", value: task.optionE }] : []),
      ],
      questions: Array.isArray(task.questions) ? task.questions : [],
      hints: Array.isArray(task.hints) ? task.hints : [],
      detailedHints: Array.isArray(task.detailedHints) ? task.detailedHints : [],
      llmTextValidation: task.llmTextValidation || {
        question: "",
        validationParameters: [],
        temperature: 0.1,
        enableDetailedFeedback: false,
      },
      imageValidation: task.imageValidation || {
        question: "",
        validationParameters: [],
        temperature: 0.1,
        enableDetailedFeedback: false,
      },
      fileContentValidation: task.fileContentValidation || {
        question: "",
        validationParameters: [],
        temperature: 0.1,
        enableDetailedFeedback: false,
      },
      expectedFilePath: task.expectedFilePath || "",
      iterativeCodeReview: task.iterativeCodeReview || {
        reviewPrompt: "",
        reviewCriteria: [],
        maxIterations: 5,
        temperature: 0.3,
        enableDetailedFeedback: true,
      },
      botCodeReview: task.botCodeReview || {
        acceptMessage: "",
        originalCode: "",
        codeLanguage: "cpp",
        requirements: "",
        knownIssues: [],
        maxIterations: 5,
        temperature: 0.3,
        enableDetailedFeedback: true,
        awardPointsOnFailure: false,
        createPR: false,
        validateOnApproval: true,
        fileName: "code.cpp",
      },
      // GitHub Actions Validation fields
      workflowFilePath: task.githubActionsValidation?.workflowFilePath || task.workflowFilePath || ".github/workflows/main.yml",
      validationParameters: task.githubActionsValidation?.validationParameters || task.validationParameters || [],
      enableDetailedFeedback: task.githubActionsValidation?.enableDetailedFeedback !== undefined 
        ? task.githubActionsValidation.enableDetailedFeedback 
        : task.enableDetailedFeedback !== undefined 
          ? task.enableDetailedFeedback 
          : true,
      waitForWorkflowCompletion: task.githubActionsValidation?.waitForWorkflowCompletion || task.waitForWorkflowCompletion || false,
      requireStudentOwnership: task.githubActionsValidation?.requireStudentOwnership || task.requireStudentOwnership || false,
      requirePrivateRepo: task.githubActionsValidation?.requirePrivateRepo || task.requirePrivateRepo || false,
      maxWaitTimeSeconds: task.githubActionsValidation?.maxWaitTimeSeconds || task.maxWaitTimeSeconds || 120,
      // Repository Validation fields
      requireRepositoryExists: task.repositoryValidation?.requireRepositoryExists !== undefined
        ? task.repositoryValidation.requireRepositoryExists
        : task.requireRepositoryExists !== undefined
          ? task.requireRepositoryExists
          : true,
      ownershipType: task.repositoryValidation?.ownershipType || task.ownershipType || "any",
      specificOwner: task.repositoryValidation?.specificOwner || task.specificOwner || "",
      checkBotAuthorization: task.repositoryValidation?.checkBotAuthorization || task.checkBotAuthorization || false,
      requirePublic: task.repositoryValidation?.requirePublic || task.requirePublic || false,
      requirePrivate: task.repositoryValidation?.requirePrivate || task.requirePrivate || false,
      questNotes: task.questNotes || "",
    };
    
    console.log(`🔧 [TASK-EDIT] Mapped task data:`, {
      taskType: taskData.taskType,
      acceptText: taskData.acceptText.substring(0, 50) + '...',
      successText: taskData.successText.substring(0, 50) + '...',
      errorText: taskData.errorText.substring(0, 50) + '...'
    });
    
    // Set state
    setEditingTaskData(taskData);
    setEditingTaskQuestIndex(questIndex);
    setEditingTaskId(taskId);
    setShowEditTaskModal(true);
    
    console.log(`✅ [TASK-EDIT] Task editor opened`);
  };

  const saveEditedTask = () => {
    console.log(`💾 [TASK-EDIT] Starting save process...`);
    console.log(`📋 [TASK-EDIT] editingTaskData:`, editingTaskData);
    
    if (!editingTaskData || editingTaskQuestIndex === null || editingTaskId === null) {
      console.log(`❌ [TASK-EDIT] Save aborted - missing required data`);
      return;
    }

    // Check if editing a draft quest (index >= 10000)
    if (editingTaskQuestIndex >= 10000) {
      console.log(`🟡 [TASK-EDIT] Editing draft quest - saving directly without confirmation`);
      // For draft quests, save directly without showing quest config warning
      confirmSaveEditedTask();
    } else {
      console.log(`🔵 [TASK-EDIT] Editing main sequence - showing quest config confirmation`);
      // For main sequence quests, show confirmation dialog
      setShowTaskEditConfirmationDialog(true);
    }
  };

  const confirmSaveEditedTask = async () => {
    console.log(`✅ [TASK-EDIT-CONFIRM] User confirmed save, proceeding...`);
    
    if (!editingTaskData || editingTaskQuestIndex === null || editingTaskId === null) {
      console.log(`❌ [TASK-EDIT-CONFIRM] Save aborted - missing required data`);
      return;
    }
    
    // Create updated task object directly from form data
    const updatedTask = {
      type: editingTaskData.taskType,
      title: editingTaskData.taskDesc || editingTaskData.title || "",
      taskTitle: editingTaskData.taskDesc || editingTaskData.title || "",
      desc: editingTaskData.taskDesc || "",
      points: parseInt(editingTaskData.points) || 0,
      xp: parseInt(editingTaskData.xp) || 0,
      accept: editingTaskData.acceptText || "",
      success: editingTaskData.successText || "",
      error: editingTaskData.errorText || "",
      answer: editingTaskData.correctAnswer || editingTaskData.answer || "",
      correctAnswer: editingTaskData.correctAnswer || editingTaskData.answer || "",
      question: editingTaskData.question || "",
      options: editingTaskData.options || [],
      repository: editingTaskData.repository || "",
      ossRepository: editingTaskData.repository || "",
      issueNumber: editingTaskData.issueNumber || "",
      apiEndpoint: editingTaskData.apiEndpoint || "",
      responsePath: editingTaskData.responsePath || "",
      expectedAnswerType: editingTaskData.expectedAnswerType || "Number",
      enableTolerance: editingTaskData.enableTolerance || false,
      toleranceRange: parseInt(editingTaskData.toleranceRange) || 10,
      saveValidatedData: editingTaskData.saveValidatedData || false,
      savedDataName: editingTaskData.savedDataName || "",
      questions: editingTaskData.questions || [],
      hints: editingTaskData.hints || [],
      detailedHints: editingTaskData.detailedHints || [],
      llmTextValidation: editingTaskData.llmTextValidation || {
        question: "",
        validationParameters: [],
        temperature: 0.1,
        enableDetailedFeedback: false
      },
      imageValidation: editingTaskData.imageValidation || {
        question: "",
        validationParameters: [],
        temperature: 0.1,
        enableDetailedFeedback: false
      },
      questNotes: editingTaskData.questNotes || "",
      answerType: editingTaskData.answerType || "",
      // Validate Fork URL fields
      repositoryToBeStored: editingTaskData.repositoryToBeStored || "",
      requireOwnership: editingTaskData.requireOwnership !== undefined ? editingTaskData.requireOwnership : true,
      allowForkOfFork: editingTaskData.allowForkOfFork !== undefined ? editingTaskData.allowForkOfFork : true,
      storeForkUrl: editingTaskData.storeForkUrl !== undefined ? editingTaskData.storeForkUrl : true,
      // Validate File Exists fields
      expectedFileName: editingTaskData.expectedFileName || "",
      expectedFileType: editingTaskData.expectedFileType || "",
      // Validate PR URL fields
      targetRepository: editingTaskData.targetRepository || "",
      targetBranch: editingTaskData.targetBranch || "main",
      sourceRepository: editingTaskData.sourceRepository || "",
      requireOpenState: editingTaskData.requireOpenState !== undefined ? editingTaskData.requireOpenState : true,
      // Validate Push fields
      requireRecentPush: editingTaskData.requireRecentPush || false,
      recentPushWindowHours: editingTaskData.recentPushWindowHours || 24,
      expectedFilePath: editingTaskData.expectedFilePath || "",
      // File Content Validation fields
      fileContentValidation: editingTaskData.fileContentValidation || {
        question: "",
        validationParameters: [],
        temperature: 0.1,
        enableDetailedFeedback: false,
      },
      // Iterative Code Review fields
      iterativeCodeReview: editingTaskData.iterativeCodeReview || {
        reviewPrompt: "",
        reviewCriteria: [],
        maxIterations: 5,
        temperature: 0.3,
        enableDetailedFeedback: true,
      },
      // Bot Code Review fields
      botCodeReview: editingTaskData.botCodeReview || {
        acceptMessage: "",
        originalCode: "",
        codeLanguage: "cpp",
        requirements: "",
        knownIssues: [],
        maxIterations: 5,
        temperature: 0.3,
        enableDetailedFeedback: true,
        awardPointsOnFailure: false,
        createPR: false,
        validateOnApproval: true,
        fileName: "code.cpp",
      },
      // GitHub Actions Validation fields
      githubActionsValidation: editingTaskData.taskType === "validate-github-actions" ? {
        workflowFilePath: editingTaskData.workflowFilePath || ".github/workflows/main.yml",
        question: editingTaskData.acceptText || "",
        validationParameters: Array.isArray(editingTaskData.validationParameters)
          ? editingTaskData.validationParameters.filter(p => p && p.trim())
          : [],
        temperature: typeof editingTaskData.temperature === 'number'
          ? editingTaskData.temperature
          : 0.1,
        enableDetailedFeedback: editingTaskData.enableDetailedFeedback !== false,
        waitForWorkflowCompletion: editingTaskData.waitForWorkflowCompletion === true,
        requireStudentOwnership: editingTaskData.requireStudentOwnership === true,
        requirePrivateRepo: editingTaskData.requirePrivateRepo === true,
        maxWaitTimeSeconds: typeof editingTaskData.maxWaitTimeSeconds === 'number'
          ? editingTaskData.maxWaitTimeSeconds
          : 120,
      } : undefined,
      // Repository Validation fields
      repositoryValidation: editingTaskData.taskType === "validate-repository" ? {
        requireRepositoryExists: editingTaskData.requireRepositoryExists !== false,
        ownershipType: editingTaskData.ownershipType || "any",
        specificOwner: editingTaskData.specificOwner || "",
        checkBotAuthorization: editingTaskData.checkBotAuthorization === true,
        requirePublic: editingTaskData.requirePublic === true,
        requirePrivate: editingTaskData.requirePrivate === true,
        saveValidatedData: editingTaskData.saveValidatedData === true,
        savedDataName: editingTaskData.savedDataName || "validatedRepo",
      } : undefined
    };
    
    console.log(`📝 [TASK-EDIT-CONFIRM] Updated task:`, updatedTask);
    
    try {
      // Update the appropriate quest
      if (editingTaskQuestIndex >= 10000) {
        console.log(`🟡 [TASK-EDIT-CONFIRM] Updating draft quest...`);
        const draftIndex = editingTaskQuestIndex - 10000;
        
        const updatedDraftQuests = {
          ...draftQuests,
          questSequence: draftQuests.questSequence.map((quest, index) => {
            if (index === draftIndex) {
              return {
                ...quest,
                tasks: {
                  ...quest.tasks,
                  [editingTaskId]: updatedTask
                }
              };
            }
            return quest;
          })
        };
        
        console.log(`✅ [TASK-EDIT-CONFIRM] Draft quest updated, saving...`);
        setDraftQuests(updatedDraftQuests);
        saveDraftQuests(updatedDraftQuests);
        
        // Show success message for draft update
        setTaskEditMessage(`Draft task updated successfully! Changes have been saved to the draft configuration and will be used when creating new test repositories.`);
        setShowTaskEditSuccessDialog(true);
        // Scroll back to the edited task in the draft quest
        setTimeout(() => scrollToTask(editingTaskQuestIndex, editingTaskId), 50);
      } else {
        console.log(`🔵 [TASK-EDIT-CONFIRM] Updating main sequence quest...`);
        setJsonContent((prev) => {
          const newQuestSequence = [...prev.questSequence];
          newQuestSequence[editingTaskQuestIndex].tasks[editingTaskId] = updatedTask;
          return { ...prev, questSequence: newQuestSequence };
        });

        // Update the live config for current users
        const configUpdateResult = await updateLiveConfigForCurrentUsers(updatedTask, editingTaskQuestIndex, editingTaskId, 'task');
        
        // Show success dialog
        const migratedUsers = configUpdateResult.data?.migratedUsers || 0;
        const configName = configUpdateResult.data?.configName || 'Unknown';
        setTaskEditMessage(`Task updated successfully! Created new quest configuration "${configName}" and migrated ${migratedUsers} students to use the updated task.`);
        setShowTaskEditSuccessDialog(true);
        // Scroll back to the edited task in the main sequence
        setTimeout(() => scrollToTask(editingTaskQuestIndex, editingTaskId), 50);
      }
      
      console.log(`🎉 [TASK-EDIT-CONFIRM] Task save completed!`);
      
      // Close confirmation dialog
      setShowTaskEditConfirmationDialog(false);
      
      // Close modal
      setShowEditTaskModal(false);
      setEditingTaskData(null);
      setEditingTaskQuestIndex(null);
      setEditingTaskId(null);
      
      // Refresh stored data
      loadStoredValues();
      
      console.log(`✅ [TASK-EDIT-CONFIRM] Complete!`);
    } catch (error) {
      console.error(`❌ [TASK-EDIT-CONFIRM] Error saving task:`, error);
      
      // Show error dialog
      setTaskEditMessage(`Failed to update task: ${error.message || 'Unknown error occurred'}`);
      setShowTaskEditErrorDialog(true);
      
      // Still close the dialogs even if config update fails
      setShowTaskEditConfirmationDialog(false);
      setShowEditTaskModal(false);
      setEditingTaskData(null);
      setEditingTaskQuestIndex(null);
      setEditingTaskId(null);
    }
  };

  // Function to update the live config for current users
  const updateLiveConfigForCurrentUsers = async (updatedData, questIndex, taskId, updateType = 'task') => {
    try {
      console.log(`🔄 [CONFIG-UPDATE] Starting live config update...`);
      
      // Get the class ID from the current URL or state
      const classId = window.location.pathname.split('/').pop();
      console.log(`🔍 [CONFIG-UPDATE] Class ID: ${classId}`);
      
      if (!classId) {
        throw new Error('Could not determine class ID');
      }

      // Call the appropriate backend API based on update type
      let apiEndpoint, requestBody;
      
      if (updateType === 'quest') {
        apiEndpoint = `${API_BASE_URL}/api/gamification/update-live-quest-config`;
        requestBody = {
          classId: classId,
          questIndex: questIndex,
          updatedQuest: updatedData
        };
      } else {
        apiEndpoint = `${API_BASE_URL}/api/gamification/update-live-task-config`;
        requestBody = {
          classId: classId,
          questIndex: questIndex,
          taskId: taskId,
          updatedTask: updatedData
        };
      }
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to update live config: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ [CONFIG-UPDATE] Live config updated successfully:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ [CONFIG-UPDATE] Error updating live config:`, error);
      throw error;
    }
  };

  const deleteTask = (questIndex, taskId) => {
    // Show confirmation dialog instead of deleting immediately
    setTaskToDelete(taskId);
    setQuestToDeleteFrom(questIndex);
    setShowDeleteTaskDialog(true);
  };

  const confirmDeleteTask = () => {
    if (questToDeleteFrom === 'questForm') {
      // Delete from quest form modal
      if (typeof taskToDelete === 'number') {
        setQuestFormData((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((_, idx) => idx !== taskToDelete),
        }));
      }
    } else if (taskToDelete && questToDeleteFrom !== null) {
      // Check if deleting from a draft quest (index >= 10000)
      if (questToDeleteFrom >= 10000) {
        // Delete from draft quest
        const draftIndex = questToDeleteFrom - 10000;
        const updatedDraftQuests = {
          ...draftQuests,
          questSequence: draftQuests.questSequence.map((quest, index) => {
            if (index === draftIndex) {
              const updatedQuest = { ...quest };
              delete updatedQuest.tasks[taskToDelete];

              // Renumber remaining tasks
              const taskEntries = Object.entries(updatedQuest.tasks);
              updatedQuest.tasks = {};
              taskEntries.forEach(([_, taskData], taskIndex) => {
                updatedQuest.tasks[`T${taskIndex + 1}`] = taskData;
              });

              return updatedQuest;
            }
            return quest;
          })
        };
        setDraftQuests(updatedDraftQuests);
        saveDraftQuests(updatedDraftQuests);
      } else {
        // Delete from main quest sequence
        setJsonContent((prev) => {
          const newQuestSequence = [...prev.questSequence];
          const quest = newQuestSequence[questToDeleteFrom];
          delete quest.tasks[taskToDelete];

          // Renumber remaining tasks
          const taskEntries = Object.entries(quest.tasks || {});
          quest.tasks = {};
          taskEntries.forEach(([_, taskData], index) => {
            quest.tasks[`T${index + 1}`] = taskData;
          });

          return { ...prev, questSequence: newQuestSequence };
        });
        
        // Refresh stored data list after deleting task
        loadStoredValues();
      }
    }
    
    // Close dialog and reset state
    setShowDeleteTaskDialog(false);
    setTaskToDelete(null);
    setQuestToDeleteFrom(null);
  };

  const cancelDeleteTask = () => {
    setShowDeleteTaskDialog(false);
    setTaskToDelete(null);
    setQuestToDeleteFrom(null);
  };

  const generateDefaultTexts = (taskType, repository, issueNumber) => {
    const defaults = {
      acceptText: "",
      successText: "",
      errorText: "",
    };

    switch (taskType) {
      case "multiple-choice":
        defaults.acceptText = `**Instructions:** Select the correct answer.`;
        defaults.successText = `✅ **Correct!**\n\nExcellent! You've answered correctly.\n\n**Points earned:** {points}\n\nGreat work! 🎉`;
        defaults.errorText = `❌ **Incorrect Answer**\n\nThat's not the right answer. Please review the question and try again.\n\n**Hint:** Think carefully about the options.\n\nYou can type "help" for additional guidance.`;
        break;

      case "quiz":
        defaults.acceptText = `**Multi-Question Quiz**\n\n**Instructions:** Answer all questions and submit your answers in the format [a,b,c] where each letter corresponds to your answer for each question.\n\n**Example:** If you think the answers are A, C, B, type: [a,c,b]\n\n[Quiz questions will be displayed here]`;
        defaults.successText = `✅ **Quiz Completed!**\n\nExcellent work! You've completed the quiz.\n\n**Points earned:** {points}\n\nYou correctly answered [X] out of [Y] questions! ��`;
        defaults.errorText = `❌ **Quiz Submission Error**\n\nPlease check your answer format and try again.\n\n**Required format:** [a,b,c] where each letter is your answer choice.\n\n**Example:** [a,c,b,d]\n\nYou can type "help" for additional guidance.`;
        break;

      case "collect-info":
        defaults.acceptText = `### 📝 Information Collection Task\n\n**Task:** This is a non-graded information collection task. Please provide the requested information below.\n\n**Instructions:** Simply type your response in the comment box. Any response will be accepted.\n\n**Note:** This task is designed to collect information and does not require a specific answer format.`;
        defaults.successText = `✅ **Information Collected!**\n\nThank you for providing the requested information!\n\n**What you learned:** Information sharing is an important part of collaborative work.\n\n**Points earned:** {points}\n\nGreat contribution! 📋`;
        defaults.errorText = `❌ **No Response Detected**\n\nIt looks like you haven't provided any information yet.\n\n**Please:** Type your response in the comment box below.\n\n**Note:** This is a non-graded task - any response will be accepted.`;
        break;

      case "get-issue-count":
        defaults.acceptText = `**Task:** Go to the repository https://github.com/${
          repository || "[repository]"
        } and count the number of open issues. Reply with the number.\n\n**Help:** Look for the 'Issues' tab on the repository page. Make sure you're counting issues, not pull requests.`;
        defaults.successText = `✅ **Correct Answer!**\n\nGreat job! You've successfully analyzed the repository and counted the open issues.\n\n**What you learned:** Repository issue tracking is essential for project management.\n\n**Points earned:** {points}\n\nExcellent research skills! 🔍`;
        defaults.errorText = `❌ **Incorrect Answer**\n\nThat's not the right number of open issues. Please check the repository again.\n\n**Hint:** Make sure you're looking at the 'Issues' tab, not 'Pull requests'.\n\nYou can type "help" for additional hints.`;
        break;

      case "get-pr-count":
        defaults.acceptText = `**Task:** Go to the repository https://github.com/${
          repository || "[repository]"
        } and count the number of open pull requests. Reply with the number.\n\n**Help:** Look for the 'Pull requests' tab on the repository page. Count only the open pull requests.`;
        defaults.successText = `✅ **Correct Answer!**\n\nExcellent! You've successfully analyzed the repository and counted the open pull requests.\n\n**What you learned:** Pull requests indicate active development and community contributions.\n\n**Points earned:** {points}\n\nGreat analysis skills! 🚀`;
        defaults.errorText = `❌ **Incorrect Answer**\n\nThat's not the right number of open pull requests. Please check the repository again.\n\n**Hint:** Make sure you're looking at the 'Pull requests' tab, not 'Issues'.\n\nYou can type "help" for additional hints.`;
        break;

      case "get-top-contributor":
        defaults.acceptText = `**Task:** Go to the repository https://github.com/${
          repository || "[repository]"
        } and find the top contributor (user with the most commits). Reply with their GitHub username.\n\n**Help:** Look at the 'Insights' tab, then 'Contributors' to see commit statistics.`;
        defaults.successText = `✅ **Correct Answer!**\n\nOutstanding! You've successfully identified the top contributor to this repository.\n\n**What you learned:** Understanding contributor patterns helps identify key maintainers in open source projects.\n\n**Points earned:** {points}\n\nExcellent detective work! 🕵️`;
        defaults.errorText = `❌ **Incorrect Answer**\n\nThat's not the top contributor. Please check the repository again.\n\n**Hint:** Go to Insights → Contributors and look for the user with the most commits.\n\nYou can type "help" for additional hints.`;
        break;

      case "get-issue-title":
        defaults.acceptText = `**Task:** Go to the repository https://github.com/${
          repository || "[repository]"
        } and find issue #${
          issueNumber || "[issue-number]"
        }. Reply with the exact title of that issue.\n\n**Help:** Navigate to the Issues tab and look for the specific issue number.`;
        defaults.successText = `✅ **Correct Answer!**\n\nPerfect! You've successfully found and identified the issue title.\n\n**What you learned:** Issue titles provide quick context about problems and discussions in projects.\n\n**Points earned:** {points}\n\nGreat attention to detail! 📋`;
        defaults.errorText = `❌ **Incorrect Answer**\n\nThat's not the correct issue title. Please check the repository again.\n\n**Hint:** Make sure you're looking at the right issue number and copying the title exactly.\n\nYou can type "help" for additional hints.`;
        break;

      case "get-open-issue":
        defaults.acceptText = `**Task:** Go to the repository https://github.com/${
          repository || "[repository]"
        } and count the number of open issues. Reply with the number.\n\n**Help:** Look for the 'Issues' tab on the repository page. Count only the open issues, not closed ones.`;
        defaults.successText = `✅ **Correct Count!**\n\nExcellent! You've successfully counted the open issues in the repository.\n\n**What you learned:** Understanding issue counts helps assess project activity and maintenance needs.\n\n**Points earned:** {points}\n\nGreat attention to detail! 📊`;
        defaults.errorText = `❌ **Incorrect Count**\n\nThat's not the right number of open issues. Please check the repository again.\n\n**Hint:** Make sure you're looking at the 'Issues' tab and counting only open issues.\n\nYou can type "help" for additional hints.`;
        break;

      case "assigned":
        defaults.acceptText = `### 🎯 Assignment Validation Task\n\n**Task:** You must find who is assigned to issue #${
          issueNumber || "[issue-number]"
        } in the repository https://github.com/${
          repository || "[repository]"
        }.\n\n**Instructions:** Go to the issue and find the assigned user, then type their GitHub username in the comment box below.\n\n**Help:** If you need assistance, type "help" in the comment box to receive hints, but remember, each hint will cost you 5 points from your total score.`;
        defaults.successText = `### 🌟 Congratulations! You Successfully Identified the Assigned User!\n\nGreat job! You've demonstrated an important skill in open-source collaboration: tracking issue ownership. This ensures clarity, accountability, and smooth teamwork in any project.\n\n**Points earned:** 25\n\n🏆 **Current Progress:** With this achievement, you've earned 25 points, bringing you 75 points closer to Level 2!\n\n🎯 **Quest Advancement:** You're mastering the fundamentals of GitHub issue management. Understanding who is responsible for which task is key to contributing effectively and ensuring the project moves forward efficiently.\n\n💡 Keep up the great work! Your next challenge is just around the corner—let's continue this journey together! 🚀`;
        defaults.errorText = `### ❌ Incorrect Username\n\nThe username you provided is not assigned to issue #88 in the probot-test-org/test-repo repository.\n\n**Please ensure:**\n1. You're looking at the correct issue (#88)\n2. You're checking the right repository\n3. You're typing the exact username of the person assigned to the issue\n\n[Click here to view the issue](https://github.com/probot-test-org/test-repo/issues/88)`;
        break;

      case "issue-no":
        defaults.acceptText = `### 🎯 Task: Choose an Issue to Work On\n\n**Task:** Go to the GitHub repository using the link below, find an issue that you would like to work on, and type its issue number in the comment box below.\n\n**Outcome:** By selecting an issue to work on, you are taking the first step towards contributing to the project and becoming part of the OSS community. This task helps you engage with the project's needs actively and lays the groundwork for your upcoming contributions.\n\n**Help:** If you need help with this task, type "help" in the comment box to get hints, but it will cost you 5 points from your total score.`;
        defaults.successText = `### 🌟 Congratulations! You've Selected Your First Issue!\n\nBy choosing an issue to focus on, you've taken a significant step in your journey of contribution to our project. Your willingness to engage and make a difference showcases your commitment to the community and project advancement.\n\n**Points earned:** {points}\n\n🌟 🌟 🌟\n\n🏆 **Current Progress:** Good work! You currently have {points} points and you've started your journey towards achieving greater milestones.\n\n🎯 **Quest Advancement:** This task not only brings you closer to mastering the collaboration process within GitHub but also highlights your growing role within our community.\n\n🌟 🌟 🌟\n\nFantastic effort! You're proving to be an essential part of our journey towards developing a project that we can all be proud of. 🌟`;
        defaults.errorText = `### ❌ Issue Not Found\n\nThe issue number you provided does not exist in the ${
          repository || "[repository]"
        } repository.\n\n**Please ensure:**\n1. You're checking the right repository\n2. You're typing a valid issue number\n3. The issue actually exists\n\n[Click here to view all issues](https://github.com/${
          repository || "[repository]"
        }/issues)`;
        break;

      case "custom-api-call":
        defaults.acceptText = `### 🔍 Custom API Call Task\n\n**Task:** This task will call a GitHub API to retrieve information about the repository. Please provide your answer based on the question below.\n\n**Repository:** ${
          repository || "[repository]"
        }\n\n**Question:** [Question will be displayed here]\n\n**Help:** If you need help with this task, type "help" in the comment box to get hints, but it will cost you 5 points from your total score.`;
        defaults.successText = `### 🌟 Congratulations! API Call Successful!\n\nExcellent work! You've successfully answered the question based on the GitHub API data.\n\n**What you learned:** Working with APIs helps you understand how to programmatically access and analyze repository information.\n\n**Points earned:** {points}\n\nGreat analytical skills! 🔍`;
        defaults.errorText = `### ❌ Incorrect Answer\n\nThat's not the correct answer based on the GitHub API data. Please check your response and try again.\n\n**Hint:** Make sure you're providing the exact information requested by the question.\n\nYou can type "help" for additional hints.`;
        break;

      case "comment":
        defaults.acceptText = `### 🎯 Task: Post a Comment in the Issue\n\n**Objective:** Engagement and communication are vital elements of collaborative work in Open Source Software projects. Your mission is to post a comment in the specified issue to demonstrate your ability to engage with the community.\n\n**Task:** Using the link below, go to issue #${
          issueNumber || "[issue-number]"
        } in the repository ${
          repository || "[repository]"
        }, post a **brief comment** introducing yourself or sharing your thoughts, and then type **"done"** in the comment box below.\n\n**Outcome:** By posting a comment in the issue, you are taking an important step toward becoming an active part of the project's community. This fosters an environment of openness and collaboration, making it easier for other contributors to offer support, guidance, and feedback.\n\n**Help:** If you need help with this task, type "help" in the comment box to get hints, but it will cost you 5 points from your total score.\n\n[Click here to view the issue](https://github.com/${
          repository || "[repository]"
        }/issues/${issueNumber || "[issue-number]"})`;
        defaults.successText = `### 🌟 Congratulations! You've Successfully Posted a Comment!\n\nExcellent work! You've successfully engaged with the community by posting a comment in the issue. This demonstrates your willingness to communicate and collaborate effectively in open-source projects.\n\n**What you learned:** Community engagement is crucial for successful open-source collaboration. Your comment helps build connections and fosters a supportive environment for future contributions.\n\n**Points earned:** {points}\n\n🏆 **Current Progress:** With this achievement, you've earned {points} points!\n\n🎯 **Quest Advancement:** You're mastering the fundamentals of GitHub community engagement. Understanding how to communicate effectively in issue threads is key to contributing successfully to any project.\n\n💡 Keep up the great work! Your next challenge is just around the corner—let's continue this journey together! 🚀`;
        defaults.errorText = `### ❌ Comment Not Found\n\nIt looks like you haven't posted a comment in issue #${
          issueNumber || "[issue-number]"
        } yet, or you didn't type "done" after posting your comment.\n\n**Please ensure:**\n1. You've actually posted a comment in the issue\n2. You've typed "done" in the comment box below after posting your comment\n3. You're looking at the correct issue (#${
          issueNumber || "[issue-number]"
        })\n4. You're checking the right repository\n\n**Steps to complete:**\n1. Go to the issue using the link below\n2. Scroll down to the comment section\n3. Post your comment\n4. Return here and type "done"\n\n[Click here to view the issue](https://github.com/${
          repository || "[repository]"
        }/issues/${issueNumber || "[issue-number]"})`;
        break;

      default:
        break;
    }

    return defaults;
  };

  const handleFormChange = (field, value) => {
    setQuestFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Auto-generate default texts when task type, repository, or issue number changes
      if (
        field === "taskType" ||
        field === "repository" ||
        field === "issueNumber"
      ) {
        const defaults = generateDefaultTexts(
          field === "taskType" ? value : prev.taskType,
          field === "repository" ? value : prev.repository,
          field === "issueNumber" ? value : prev.issueNumber
        );

        // Only update if the current text is empty or still the default
        if (
          !prev.acceptText ||
          prev.acceptText ===
            generateDefaultTexts(
              prev.taskType,
              prev.repository,
              prev.issueNumber
            ).acceptText
        ) {
          updated.acceptText = defaults.acceptText;
        }
        if (
          !prev.successText ||
          prev.successText ===
            generateDefaultTexts(
              prev.taskType,
              prev.repository,
              prev.issueNumber
            ).successText
        ) {
          updated.successText = defaults.successText;
        }
        if (
          !prev.errorText ||
          prev.errorText ===
            generateDefaultTexts(
              prev.taskType,
              prev.repository,
              prev.issueNumber
            ).errorText
        ) {
          updated.errorText = defaults.errorText;
        }
      }

      return updated;
    });
  };

  const handleDownloadJson = () => {
    try {
      const dataStr = JSON.stringify(jsonContent, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = "reshape1.json";

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      setDownloadStatus("✅ JSON file downloaded successfully!");
      setTimeout(() => setDownloadStatus(""), 3000);
    } catch (error) {
      setDownloadStatus("❌ Error downloading JSON file");
      setTimeout(() => setDownloadStatus(""), 3000);
    }
  };

  const questCount = jsonContent.questSequence.length;
  const totalTasks = jsonContent.questSequence.reduce((total, quest) => {
    return total + Object.keys(quest.tasks || {}).length;
  }, 0);

  // Show loading state
  if (isLoading) {
    return (
      <div>
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Retrieving saved configuration for this class
            </Typography>
          </Box>
        </Container>
      </div>
    );
  }

  // Add/Remove MCQ options
  const handleAddOption = (taskIdx) => {
    setQuestFormData((prev) => {
      const updatedTasks = prev.tasks.map((task, idx) => {
        if (idx !== taskIdx) return task;
        // Remove the 5 option limit - allow unlimited options
        const nextLabel = String.fromCharCode(65 + task.options.length); // 'C', 'D', 'E', 'F', 'G', etc.
        return {
          ...task,
          options: [...task.options, { label: nextLabel, value: "" }],
        };
      });
      return { ...prev, tasks: updatedTasks };
    });
  };
  const handleRemoveOption = (taskIdx, optionIdx) => {
    setQuestFormData((prev) => {
      const updatedTasks = prev.tasks.map((task, idx) => {
        if (idx !== taskIdx) return task;
        if (optionIdx < 2) return task; // Don't allow removing A or B (default options)
        const newOptions = task.options.filter((_, i) => i !== optionIdx);
        // If correctAnswer is now out of range, reset to 'a'
        let correctAnswer = task.correctAnswer;
        if (
          optionIdx ===
          task.options.findIndex(
            (opt) => opt.label.toLowerCase() === correctAnswer
          )
        ) {
          correctAnswer = "a";
        }
        return { ...task, options: newOptions, correctAnswer };
      });
      return { ...prev, tasks: updatedTasks };
    });
  };

  // Add this helper inside GenerateJson:
  const saveQuestToBank = async (questData) => {
    try {
      if (questData._id) {
        await axios.put(
          `${API_BASE_URL}/api/generatejson/quest/${questData._id}`,
          questData
        );
      } else {
        await axios.post(`${API_BASE_URL}/api/generatejson/quest`, questData);
      }
      fetchLibraryQuests();
      
      // Refresh stored data list after saving quest to bank
      loadStoredValues();
    } catch (err) {
      console.error("Failed to save quest to bank", err);
    }
  };

  // Add this before the return statement in GenerateJson:
  const getHintPenaltyValidationErrors = () => {
    const errors = [];
    questFormData.tasks.forEach((task, taskIndex) => {
      if (task.detailedHints && task.detailedHints.length > 0) {
        const totalPenalty = task.detailedHints.reduce((sum, hint) => {
          const penalty = parseInt(hint.penalty) || 0;
          return sum + penalty;
        }, 0);
        const taskPoints = parseInt(task.points) || 0;
        if (totalPenalty > taskPoints) {
          errors.push(`Task ${taskIndex + 1}: Hint penalties (${totalPenalty}) exceed task points (${taskPoints})`);
        }
      }
    });
    return errors;
  };

  const hintPenaltyErrors = getHintPenaltyValidationErrors();
  const hasHintPenaltyErrors = hintPenaltyErrors.length > 0;

      // Check if editing a draft quest (index >= 10000)
      const isDraftQuestEdit = editingQuestIndex !== null && editingQuestIndex >= 10000;
      
      const isAddQuestDisabled = isDraftQuestEdit 
        ? // For draft quest editing, only require title
          !questFormData.title.trim()
        : // For regular quest creation/editing, use full validation
          !questFormData.title.trim() ||
          // When editing a quest, don't require tasks (we're only editing title/description)
          // When adding a new quest, require at least one task
          (editingQuestIndex === null && questFormData.tasks.length === 0) ||
          hasHintPenaltyErrors ||
          questFormData.tasks.some((task) => {
          if (task.taskType === "multiple-choice") {
            return (
              !task.question?.trim() ||
              !task.options?.[0]?.value?.trim() ||
              !task.options?.[1]?.value?.trim() ||
              !task.correctAnswer ||
              !task.successText?.trim() ||
              !task.errorText?.trim()
            );
          }
          // Add more task type checks if needed
          return !task.successText?.trim() || !task.errorText?.trim();
        });

  const createBlankHint = () => ({
    content: "",
    image: "",
    video: null,
    sequence: 1,
    penalty: 0,
  });

  const handleAddHint = (questIdx, taskIdx) => {
    // In the dialog context, we're always working with questFormData
    setQuestFormData((prev) => {
      const updated = { ...prev };
      if (!updated.tasks[taskIdx]) {
        return prev;
      }
      if (!updated.tasks[taskIdx].detailedHints) {
        updated.tasks[taskIdx].detailedHints = [];
      }
      updated.tasks[taskIdx].detailedHints.push(createBlankHint());
      return updated;
    });
  };

  const handleUpdateHint = (questIdx, taskIdx, hintIdx, field, value) => {
    // In the dialog context, we're always working with questFormData
    setQuestFormData((prev) => {
      const updated = { ...prev };
      if (!updated.tasks[taskIdx]) {
        return prev;
      }
      if (!updated.tasks[taskIdx].detailedHints) {
        updated.tasks[taskIdx].detailedHints = [];
      }
      if (updated.tasks[taskIdx].detailedHints[hintIdx]) {
        updated.tasks[taskIdx].detailedHints[hintIdx][field] =
          field === "penalty" ? Number(value) : value;
      }
      return updated;
    });
  };

  const handleRemoveHint = (questIdx, taskIdx, hintIdx) => {
    // In the dialog context, we're always working with questFormData
    setQuestFormData((prev) => {
      const updated = { ...prev };
      if (!updated.tasks[taskIdx]) {
        return prev;
      }
      if (updated.tasks[taskIdx].detailedHints) {
        updated.tasks[taskIdx].detailedHints.splice(hintIdx, 1);
      }
      return updated;
    });
  };

  // Helper to load stored values for this class
  async function loadStoredValues() {
    if (!classId) return;
    try {
      // Do not toggle global loading for stored values fetch; it's minor
      const res = await axios.get(
        `${API_BASE_URL}/api/group/${classId}/stored-values`
      );
      const keys = res.data?.data?.keys || [];
      const valuesByUser = res.data?.data?.valuesByUser || {};
      setStoredKeys(keys);
      setStoredValuesByUser(valuesByUser);
      
      // Only fetch collected_info data if we don't already have it
      if (Object.keys(valuesByUser).length === 0 || !Object.keys(valuesByUser).some(userId => 
        Object.keys(valuesByUser[userId] || {}).some(key => key === 'collected_info' || key.includes('collected_info'))
      )) {
        await loadCollectedInfoData();
      }
    } catch (e) {
      console.error("Failed to load stored data:", e);
    }
  }

  // New function to fetch collected_info data from our backend API
  async function loadCollectedInfoData() {
    if (!classId || hasLoadedCollectedInfo) return;
    
    console.log('🚀 [loadCollectedInfoData] Starting for class:', classId);
    setIsLoadingCollectedInfo(true);
    try {
      console.log('🔍 Fetching collected_info data for class:', classId);
      
      // Fetch from our backend API which connects to OSS-Doorway database
      const collectedInfoRes = await axios.get(
        `${API_BASE_URL}/api/group/${classId}/collected-info`
      );
      
              if (collectedInfoRes.data && collectedInfoRes.data.success) {
          console.log('✅ Collected info data loaded:', collectedInfoRes.data);
          console.log('✅ Response structure:', {
            success: collectedInfoRes.data.success,
            data: collectedInfoRes.data.data,
            summary: collectedInfoRes.data.summary
          });
          
          // Check if the class ID was automatically corrected
          const summary = collectedInfoRes.data.summary;
          setCollectedInfoSummary(summary);
          if (summary && !summary.usedRequestedClassId) {
            console.log(`⚠️ Class ID was automatically corrected from ${summary.requestedClassId} to ${summary.actualClassId}`);
          }
          
          // Merge the collected_info data with existing stored values
          const collectedInfoData = collectedInfoRes.data.data || {};
        const updatedStoredValues = { ...storedValuesByUser };
        
        console.log('🔄 Before merge - storedValuesByUser:', storedValuesByUser);
        console.log('🔄 Before merge - collectedInfoData:', collectedInfoData);
        console.log('🔄 collectedInfoData keys:', Object.keys(collectedInfoData));
        console.log('🔄 collectedInfoData values:', Object.values(collectedInfoData));
        
        // Add collected_info entries to the stored values
        console.log('🔄 Starting to process collectedInfoData entries...');
        Object.entries(collectedInfoData).forEach(([userId, userData]) => {
          console.log(`🔄 Processing entry - userId: ${userId}, userData:`, userData);
          
          if (userData.collectedInfo && userData.collectedInfo.length > 0) {
            // Use the username as the key for better display
            const displayKey = userData.username || userData.github || userId;
            
            console.log(`🔄 Processing user ${displayKey} with collected_info:`, userData.collectedInfo);
            
            if (!updatedStoredValues[displayKey]) {
              updatedStoredValues[displayKey] = {};
            }
            
            userData.collectedInfo.forEach(info => {
              updatedStoredValues[displayKey][info.key] = info.value;
              console.log(`🔄 Added ${info.key} = ${info.value} for user ${displayKey}`);
            });
          } else {
            console.log(`🔄 User ${userId} has no collectedInfo or empty array:`, userData.collectedInfo);
          }
        });
        
        console.log('🔄 After merge - updatedStoredValues:', updatedStoredValues);
        setStoredValuesByUser(updatedStoredValues);
        console.log('✅ [loadCollectedInfoData] Successfully updated storedValuesByUser state');
        
        // Add collected_info keys to storedKeys if they don't exist
        const existingKeys = new Set(storedKeys.map(k => k.dataName));
        const newKeys = [];
        
        Object.values(collectedInfoData).forEach(userData => {
          if (userData.collectedInfo) {
            userData.collectedInfo.forEach(info => {
              if (!existingKeys.has(info.key)) {
                newKeys.push({
                  dataName: info.key,
                  questId: 'Q1', // Use Q1 as default quest
                  taskId: 'T1',  // Use T1 as default task
                  expectedType: 'Text' // Set expected type
                });
                existingKeys.add(info.key);
              }
            });
          }
        });
        
        if (newKeys.length > 0) {
          console.log('🔄 Adding new keys to storedKeys:', newKeys);
          setStoredKeys(prev => [...prev, ...newKeys]);
          console.log('✅ [loadCollectedInfoData] Successfully updated storedKeys state');
        }
      }
    } catch (error) {
      console.log('ℹ️ Could not fetch collected_info data, using existing data:', error.message);
      // If collected_info fetch fails, continue with existing data
    } finally {
      setIsLoadingCollectedInfo(false);
    }
  }

  return (
    <div>
      {isPurpleDeploying && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            bgcolor: "rgba(15, 23, 42, 0.85)",
            zIndex: (theme) => theme.zIndex.modal + 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            backdropFilter: "blur(2px)",
          }}
        >
          <Stack spacing={2} alignItems="center" sx={{ textAlign: "center" }}>
            <CircularProgress
              size={64}
              sx={{ color: "#bb86fc" }}
              aria-label="Purple deployment in progress"
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Purple Deploy in Progress
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
              Please wait while the new quest is deployed and auto-unlocks are processed.
            </Typography>
          </Stack>
        </Box>
      )}
      <Container maxWidth="lg" sx={{ py: 4, width: "100%", textAlign: "left" }}>
        {/* Real-time Draft Quest Update Alert */}
        {showDraftUpdateAlert && draftUpdateInfo && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            onClose={() => setShowDraftUpdateAlert(false)}
            action={
              <Button 
                color="inherit" 
                size="small" 
                disabled={isDraftLoading}
                onClick={async () => {
                  console.log('🔄 Refreshing draft quest config after update notification...');
                  await loadDraftQuests();
                  setShowDraftUpdateAlert(false);
                  console.log('✅ Draft quest config refreshed and alert dismissed');
                }}
              >
                {isDraftLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            }
          >
            <AlertTitle>Draft Quest Config Updated</AlertTitle>
            The draft quest configuration for <strong>{draftUpdateInfo.className}</strong> was just updated by another user ({draftUpdateInfo.questCount} draft quests). 
            The page has been automatically refreshed with the latest changes.
          </Alert>
        )}

        {/* Page Title */}
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
          Manage Class Quests
        </Typography>
        {/* Save Status and Controls */}
        <Box
          mb={4}
          p={3}
          sx={{
            bgcolor: "white",
            borderRadius: 4,
            boxShadow: "none",
            border: "1px solid #e0e0e0",
            ...(saveStatusType === "success" && {
              borderColor: "#4caf50",
              bgcolor: "#f1f8e9",
            }),
            ...(saveStatusType === "error" && {
              borderColor: "#f44336",
              bgcolor: "#ffebee",
            }),
            ...(saveStatusType === "saving" && {
              borderColor: "#ff9800",
              bgcolor: "#fff3e0",
            }),
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            spacing={2}
          >
            <Box>
              {saveStatusType === "saving" ? (
                <Box
                  component="span"
                  sx={{ display: "inline-flex", alignItems: "center" }}
                >
                  <CircularProgress size={16} sx={{ color: "#ff9800" }} />
                  <Typography
                    variant="body2"
                    sx={{ ml: 1, color: "#ff9800", fontWeight: 500 }}
                  >
                    {saveStatus}
                  </Typography>
                </Box>
              ) : saveStatusType === "success" ? (
                <Typography
                  variant="body2"
                  sx={{ color: "#4caf50", fontWeight: 500 }}
                >
                  {saveStatus}
                </Typography>
              ) : saveStatusType === "error" ? (
                <Typography
                  variant="body2"
                  sx={{ color: "#f44336", fontWeight: 500 }}
                >
                  {saveStatus}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {relativeSaveText}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Metric Boxes */}
        <Stack direction="row" spacing={2} mb={4} flexWrap="nowrap">
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "white",
              borderRadius: 4,
              height: 150,
              fontWeight: 500,
              minWidth: 120,
              p: 3,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, fontSize: "1rem", mb: 1 }}
            >
              Quests
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 700, fontSize: "2.5rem" }}
            >
              {questCount}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: "#ff5722",
              color: "white",
              borderRadius: 4,
              height: 150,
              fontWeight: 500,
              minWidth: 120,
              p: 3,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, fontSize: "1rem", mb: 1 }}
            >
              Total Tasks
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 700, fontSize: "2.5rem" }}
            >
              {totalTasks}
            </Typography>
          </Box>
        </Stack>

        {/* JSON Preview Card */}
        <Card sx={{ mb: 4, borderRadius: 4, boxShadow: "none" }}>
          <Box p={3}>
            {/* README and Quest Management Buttons */}
            <Box mb={3}>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
                {/* README Upload */}
                <Box sx={{ width: 'fit-content' }}>
                  {!jsonContent.readme ? (
                    <>
                      <input
                        accept=".md"
                        style={{ display: "none" }}
                        id="readme-upload"
                        type="file"
                        onChange={handleReadmeFileUpload}
                      />
                      <label htmlFor="readme-upload">
                        <Button
                          variant="contained"
                          component="span"
                          startIcon={<DescriptionIcon />}
                          sx={STYLES.button.readmeButton}
                        >
                          Add README (.md)
                        </Button>
                      </label>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<DescriptionIcon />}
                      onClick={() => {
                        console.log(`🚀 [README Modal] Opening README modal for class: ${classId}`);
                        setReadmeContent(jsonContent.readme);
                        setShowReadmeModal(true);
                        // Fetch student count when opening README modal
                        console.log(`📞 [README Modal] Calling fetchStudentCount...`);
                        fetchStudentCount();
                      }}
                      sx={STYLES.button.readmeButton}
                    >
                      README Added
                    </Button>
                  )}
                </Box>

                {/* Add Quest Button */}
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddQuestModal(true)}
                  sx={STYLES.button.questButton}
                >
                  Add New Quest
                </Button>

                {/* Quest Bank Button */}
                <Button
                  variant="contained"
                  startIcon={<LibraryBooksIcon />}
                  onClick={handleOpenLibrary}
                  sx={STYLES.button.questBankButton}
                >
                  Quest Bank
                </Button>
              </Stack>
            </Box>

            {/* Close top section Card */}
          </Box>
        </Card>

        {/* Quest Sequence Builder Section */}
        <Card sx={{ mb: 4, borderRadius: 4, boxShadow: "none" }}>
          <Box p={3}>
            {/* Quest Blocks Interface */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h5"
                component="h3"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                Quest Sequence Builder
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use arrows to reorder quests. Tasks can be reordered within
                their quest.
              </Typography>

              {liveQuestDisplayList.map(({ quest, originalIndex }) => (
                <QuestBlock
                  key={`main-${quest.questId}-${originalIndex}`}
                  quest={quest}
                  questIndex={originalIndex}
                  totalQuests={jsonContent.questSequence.length}
                  onMoveQuest={moveQuest}
                  onEditQuest={editQuest}
                  onDeleteQuest={deleteQuest}
                  onMoveTask={moveTask}
                  onEditTask={editTask}
                  onDeleteTask={deleteTask}
                  onAddTask={() => handleAddTaskToExistingQuest(originalIndex)}
                />
              ))}
            </Box>

            {/* Toggle JSON View */}
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                sx={{ borderRadius: 4 }}
              >
                {showJsonPreview ? "Hide JSON Preview" : "Show JSON Preview"}
              </Button>
            </Box>

            {/* Collapsible JSON Preview */}
            {showJsonPreview && (
              <Paper
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "#f8f9fa",
                  maxHeight: "400px",
                  overflow: "auto",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  borderRadius: 4,
                  border: "1px solid #e0e0e0",
                }}
              >
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(jsonContent, null, 2)}
                </pre>
              </Paper>
            )}
          </Box>
        </Card>

        {/* Draft Quests Section */}
        <Card sx={{ 
          mb: 4, 
          borderRadius: 4, 
          boxShadow: "none", 
          border: "2px dashed #ffa726",
          backgroundColor: "#fff8e1" // Light yellow background
        }}>
          <Box p={3}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <EditIcon sx={{ color: "#ffa726" }} />
              <Typography variant="h6" sx={{ color: "#ffa726", fontWeight: 600 }}>
                Draft Quests ({draftQuests.questSequence?.length || 0})
              </Typography>
              {draftSaveStatus && (
                <Typography variant="body2" sx={{ color: "#666", fontStyle: "italic" }}>
                  {draftSaveStatus}
                </Typography>
              )}
            </Stack>

            <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
              New quests are created as drafts. Review, edit, and move them to the main sequence when ready.
            </Typography>

            {isDraftLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : draftQuestDisplayList.length > 0 ? (
              <Stack spacing={2}>
                {draftQuestDisplayList.map(({ quest, draftIndex }) => {
                  const normalizedQuestTitle = (quest?.title || "")
                    .trim()
                    .toLowerCase();
                  const duplicateQuestWithLive =
                    normalizedQuestTitle &&
                    liveQuestTitles.has(normalizedQuestTitle);
                  const duplicateQuestWithDraft =
                    normalizedQuestTitle &&
                    draftQuestTitleCounts[normalizedQuestTitle] > 1;
                  const duplicateQuestInfo = {
                    duplicateWithLive: Boolean(duplicateQuestWithLive),
                    duplicateWithDraft: Boolean(duplicateQuestWithDraft),
                  };

                  const duplicateTaskWarnings = {};
                  Object.entries(quest?.tasks || {}).forEach(
                    ([taskKey, task]) => {
                      const normalizedTaskTitle = (
                        task?.title ||
                        task?.taskTitle ||
                        task?.desc ||
                        ""
                      )
                        .trim()
                        .toLowerCase();
                      const duplicateTaskWithLive =
                        normalizedTaskTitle &&
                        liveTaskTitles.has(normalizedTaskTitle);
                      const duplicateTaskWithDraft =
                        normalizedTaskTitle &&
                        draftTaskTitleCounts[normalizedTaskTitle] > 1;
                      duplicateTaskWarnings[taskKey] = {
                        duplicateWithLive: Boolean(duplicateTaskWithLive),
                        duplicateWithDraft: Boolean(duplicateTaskWithDraft),
                      };
                    }
                  );

                  const questIndex = 10000 + draftIndex;

                  return (
                  <QuestBlock
                    key={`draft-${quest.questId}-${draftIndex}`}
                    quest={quest}
                    questIndex={questIndex} // Use high numbers to distinguish drafts
                    totalQuests={draftQuests.questSequence.length}
                    isDraftQuest={true} // Mark as draft quest for yellow tint
                      duplicateQuestInfo={duplicateQuestInfo}
                      duplicateTaskWarnings={duplicateTaskWarnings}
                    onMoveQuest={(questIndex, direction) => {
                      // Handle moving draft quests up/down
                      const actualIndex = questIndex - 10000; // Convert back to draft index
                      const totalDraftQuests = draftQuests.questSequence.length;
                      
                      if (direction === "up" && actualIndex > 0) {
                        const newDraftQuests = { ...draftQuests };
                        const quests = [...newDraftQuests.questSequence];
                        [quests[actualIndex], quests[actualIndex - 1]] = [quests[actualIndex - 1], quests[actualIndex]];
                        newDraftQuests.questSequence = quests;
                        setDraftQuests(newDraftQuests);
                        saveDraftQuests(newDraftQuests);
                      } else if (direction === "down" && actualIndex < totalDraftQuests - 1) {
                        const newDraftQuests = { ...draftQuests };
                        const quests = [...newDraftQuests.questSequence];
                        [quests[actualIndex], quests[actualIndex + 1]] = [quests[actualIndex + 1], quests[actualIndex]];
                        newDraftQuests.questSequence = quests;
                        setDraftQuests(newDraftQuests);
                        saveDraftQuests(newDraftQuests);
                      }
                    }}
                    onEditQuest={(questIndex) => {
                      // Load quest into edit mode
                      const questForEdit = {
                        title: quest.title,
                        description: quest.description,
                        tasks: Object.values(quest.tasks || {}).map((task, taskIndex) => {
                          const baseTask = {
                          taskType: task.type || "multiple-choice",
                          title: task.title || task.taskTitle || `Task ${taskIndex + 1}`,
                          points: task.points || 100,
                          acceptText: task.accept || "",
                          successText: task.success || "",
                          errorText: task.error || "",
                          ...task
                          };
                          
                          // Map GitHub Actions Validation fields to top level for form
                          if (task.type === "validate-github-actions" && task.githubActionsValidation) {
                            baseTask.workflowFilePath = task.githubActionsValidation.workflowFilePath || ".github/workflows/main.yml";
                            baseTask.validationParameters = task.githubActionsValidation.validationParameters || [];
                            baseTask.enableDetailedFeedback = task.githubActionsValidation.enableDetailedFeedback !== false;
                            baseTask.waitForWorkflowCompletion = task.githubActionsValidation.waitForWorkflowCompletion || false;
                            baseTask.requireStudentOwnership = task.githubActionsValidation.requireStudentOwnership || false;
                            baseTask.requirePrivateRepo = task.githubActionsValidation.requirePrivateRepo || false;
                            baseTask.maxWaitTimeSeconds = task.githubActionsValidation.maxWaitTimeSeconds || 120;
                          }
                          
                          return baseTask;
                        })
                      };
                      setQuestFormData(questForEdit);
                      setEditingQuestIndex(questIndex); // Use high numbers to distinguish drafts
                      setShowAddQuestModal(true);
                    }}
                    onDeleteQuest={(questIndex) => {
                      const actualIndex = questIndex - 10000; // Convert back to draft index
                      handleQuestDeleteClick(actualIndex, quest.title);
                    }}
                    onDeleteQuestClick={handleQuestDeleteClick}
                    onTaskDeleteClick={handleTaskDeleteClick}
                    onMoveTask={(questIndex, taskId, direction) => {
                      // Handle moving tasks within draft quests
                      const actualQuestIndex = questIndex - 10000; // Convert back to draft index
                      const quest = draftQuests.questSequence[actualQuestIndex];
                      if (!quest || !quest.tasks) return;
                      
                      const taskEntries = Object.entries(quest.tasks);
                      const taskIndex = taskEntries.findIndex(([key]) => key === taskId);
                      
                      if (direction === "up" && taskIndex > 0) {
                        // Move task up
                        const newTaskEntries = [...taskEntries];
                        [newTaskEntries[taskIndex], newTaskEntries[taskIndex - 1]] = [newTaskEntries[taskIndex - 1], newTaskEntries[taskIndex]];
                        
                        // Rebuild tasks object with new order
                        const newTasks = {};
                        newTaskEntries.forEach(([key, task], index) => {
                          newTasks[`T${index + 1}`] = task;
                        });
                        
                        const updatedDraftQuests = {
                          ...draftQuests,
                          questSequence: draftQuests.questSequence.map((q, idx) => 
                            idx === actualQuestIndex ? { ...q, tasks: newTasks } : q
                          )
                        };
                        setDraftQuests(updatedDraftQuests);
                        saveDraftQuests(updatedDraftQuests);
                      } else if (direction === "down" && taskIndex < taskEntries.length - 1) {
                        // Move task down
                        const newTaskEntries = [...taskEntries];
                        [newTaskEntries[taskIndex], newTaskEntries[taskIndex + 1]] = [newTaskEntries[taskIndex + 1], newTaskEntries[taskIndex]];
                        
                        // Rebuild tasks object with new order
                        const newTasks = {};
                        newTaskEntries.forEach(([key, task], index) => {
                          newTasks[`T${index + 1}`] = task;
                        });
                        
                        const updatedDraftQuests = {
                          ...draftQuests,
                          questSequence: draftQuests.questSequence.map((q, idx) => 
                            idx === actualQuestIndex ? { ...q, tasks: newTasks } : q
                          )
                        };
                        setDraftQuests(updatedDraftQuests);
                        saveDraftQuests(updatedDraftQuests);
                      }
                    }}
                    onEditTask={editTask}
                    onDeleteTask={deleteTask}
                    onAddTask={(questIndex) => {
                      // Add task to draft quest
                      console.log("onAddTask called with questIndex:", questIndex, "type:", typeof questIndex);
                      
                      // Validate questIndex
                      if (typeof questIndex !== 'number' || isNaN(questIndex)) {
                        console.error("Invalid questIndex:", questIndex);
                        return;
                      }
                      
                      const draftIndex = questIndex - 10000;
                      console.log("Calculated draftIndex:", draftIndex);
                      
                      // Add safety checks
                      if (!draftQuests.questSequence || !draftQuests.questSequence[draftIndex]) {
                        console.error("Draft quest not found at index:", draftIndex);
                        console.error("Available draft quests:", draftQuests.questSequence?.length || 0);
                        return;
                      }
                      
                      const quest = draftQuests.questSequence[draftIndex];
                      const existingTasks = quest.tasks || {};
                      const taskCount = Object.keys(existingTasks || {}).length;
                      const newTaskId = `T${taskCount + 1}`;
                      
                      const newTask = {
                        type: "multiple-choice",
                        title: `New Task ${taskCount + 1}`,
                        points: 100,
                        accept: "",
                        success: "",
                        error: "",
                        taskTitle: `New Task ${taskCount + 1}`,
                        desc: `New Task ${taskCount + 1}`,
                      };
                      
                      const updatedDraftQuests = {
                        ...draftQuests,
                        questSequence: draftQuests.questSequence.map((q, index) =>
                          index === draftIndex ? {
                            ...q,
                            tasks: {
                              ...existingTasks,
                              [newTaskId]: newTask
                            }
                          } : q
                        ),
                      };
                      
                      setDraftQuests(updatedDraftQuests);
                      saveDraftQuests(updatedDraftQuests);
                      console.log("Added task to draft quest:", newTaskId);
                    }}
                    onPurpleDeployQuest={(questIndex) => {
                      const actualIndex = questIndex - 10000; // Convert back to draft index
                      handlePurpleDeployClick(actualIndex);
                    }}
                  />
                );
              })}
              </Stack>
            ) : (
              <Paper sx={{ p: 3, textAlign: "center", backgroundColor: "#f9f9f9" }}>
                <Typography variant="body2" sx={{ color: "#666" }}>
                  No draft quests yet. Create a new quest to get started!
                </Typography>
              </Paper>
            )}

            {/* Toggle Draft JSON View */}
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowDraftJsonPreview(!showDraftJsonPreview)}
                sx={{ borderRadius: 4 }}
              >
                {showDraftJsonPreview ? "Hide Draft JSON" : "Show Draft JSON"}
              </Button>
            </Box>

            {/* Collapsible Draft JSON Preview */}
            {showDraftJsonPreview && (
              <Paper
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "#fff3e0",
                  maxHeight: "400px",
                  overflow: "auto",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  borderRadius: 4,
                  border: "1px solid #ffa726",
                }}
              >
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(normalizedDraftForPreview, null, 2)}
                </pre>
              </Paper>
            )}

            {/* Test Draft Quests Section */}
            {draftQuests.questSequence?.length > 0 && (
              <Paper sx={{ 
                mt: 3,
                p: 3, 
                backgroundColor: "#fff8e1",
                border: "2px solid #ffb74d",
                borderRadius: 3
              }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "#ff9800" }}>
                  🧪 Test Draft Quests
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
                  Create test repositories using only the draft quest configuration to test your quests before publishing.
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="Test Usernames (comma-separated)"
                    placeholder="e.g., testuser1, testuser2, testuser3"
                    value={testUsernames}
                    onChange={(e) => setTestUsernames(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    helperText="Enter usernames separated by commas. Each will get a test repository with draft quests."
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<PlayArrowIcon />}
                    onClick={createTestRepositories}
                    disabled={!testUsernames.trim() || isCreatingTestRepos}
                    sx={{ mr: 2 }}
                  >
                    {isCreatingTestRepos ? "Creating..." : "Create Test Repositories"}
                  </Button>
                  
                  {testRepos.length > 0 && (
                    <Button
                      variant="outlined"
                      onClick={() => setTestRepos([])}
                      sx={{ mr: 2 }}
                    >
                      Clear Results
                    </Button>
                  )}
                </Box>

                {isCreatingTestRepos && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" sx={{ mt: 1, color: "#666" }}>
                      Creating test repositories...
                    </Typography>
                  </Box>
                )}

                {testRepos.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Test Repositories Created:
                    </Typography>
                    <Stack spacing={1}>
                      {testRepos.map((repo, index) => (
                        <Box key={index} sx={{ 
                          p: 2, 
                          backgroundColor: "#fff", 
                          borderRadius: 2,
                          border: "1px solid #e0e0e0"
                        }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {repo.username}
                            </Typography>
                            <Typography variant="body2" sx={{ color: repo.success ? "#4caf50" : "#f44336" }}>
                              {repo.success ? "✅ Created" : "❌ Failed"}
                            </Typography>
                            {repo.success && repo.url && (
                              <Button
                                size="small"
                                variant="outlined"
                                href={repo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Repository
                              </Button>
                            )}
                          </Stack>
                          {repo.error && (
                            <Typography variant="caption" sx={{ color: "#f44336", mt: 1, display: "block" }}>
                              Error: {repo.error}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        </Card>

        {/* Add Quest Modal */}
        <Dialog
          open={showAddQuestModal}
          onClose={(event, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            setShowAddQuestModal(false);
            setEditingQuestIndex(null);
            setQuestFormData({ title: "", description: "", tasks: [] });
          }}
          disableEscapeKeyDown
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid #e0e0e0",
              pb: 2,
              mb: 0,
            }}
          >
            <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
              {editingQuestIndex !== null ? "Edit Quest (Title & Description Only)" : "Add New Quest"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={4}>
              {/* Quest Basic Info */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                >
                  {editingQuestIndex !== null ? "Quest Information (Edit Mode)" : "Quest Information"}
                </Typography>

                <TextField
                  label="Quest Title"
                  value={questFormData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  placeholder="e.g., Python Programming Basics"
                  fullWidth
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Quest Description"
                  value={questFormData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  placeholder="Brief description of what students will learn"
                  fullWidth
                  multiline
                  rows={3}
                />
              </Box>

              {/* Only show tasks section when adding a new quest, not when editing */}
              {editingQuestIndex === null && (
                <>
                  <Divider />

                  {/* Task Configuration */}
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                    >
                      Tasks ({questFormData.tasks.length})
                    </Typography>

                    {questFormData.tasks.map((task, taskIdx) => (
                  <Card
                    key={taskIdx}
                    data-form-task-id={taskIdx}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      boxShadow: "none",
                      p: 3,
                      mb: 2,
                      "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "#f8f9fa",
                      },
                    }}
                  >
                    <Stack spacing={3}>
                      {/* Task Header */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Task {taskIdx + 1}
                        </Typography>
                        {questFormData.tasks.length > 1 && (
                          <Stack direction="row" spacing={1}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                border: "1px solid #f44336",
                                backgroundColor: "white",
                                cursor: "pointer",
                                "&:hover": {
                                  backgroundColor: "#ffebee",
                                  borderColor: "#d32f2f",
                                },
                              }}
                              onClick={() => handleDeleteTask(taskIdx)}
                            >
                              <DeleteIcon
                                fontSize="small"
                                sx={{ color: "#f44336" }}
                              />
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 40,
                                height: 40,
                                borderRadius: 4,
                                border: "1px solid #2196f3",
                                backgroundColor: "white",
                                cursor: "pointer",
                                opacity: taskIdx === 0 ? 0.5 : 1,
                                "&:hover": {
                                  backgroundColor:
                                    taskIdx === 0 ? "white" : "#e3f2fd",
                                  borderColor:
                                    taskIdx === 0 ? "#e0e0e0" : "#1976d2",
                                },
                              }}
                              onClick={() =>
                                taskIdx !== 0 && handleMoveTask(taskIdx, "up")
                              }
                            >
                              <ArrowUpwardIcon
                                fontSize="small"
                                sx={{ color: "#2196f3" }}
                              />
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 40,
                                height: 40,
                                borderRadius: 4,
                                border: "1px solid #2196f3",
                                backgroundColor: "white",
                                cursor: "pointer",
                                opacity:
                                  taskIdx === questFormData.tasks.length - 1
                                    ? 0.5
                                    : 1,
                                "&:hover": {
                                  backgroundColor:
                                    taskIdx === questFormData.tasks.length - 1
                                      ? "white"
                                      : "#e3f2fd",
                                  borderColor:
                                    taskIdx === questFormData.tasks.length - 1
                                      ? "#e0e0e0"
                                      : "#1976d2",
                                },
                              }}
                              onClick={() =>
                                taskIdx !== questFormData.tasks.length - 1 &&
                                handleMoveTask(taskIdx, "down")
                              }
                            >
                              <ArrowDownwardIcon
                                fontSize="small"
                                sx={{ color: "#2196f3" }}
                              />
                            </Box>
                          </Stack>
                        )}
                      </Box>

                      {/* Task Type Selection (categories; one expanded at a time) */}
                      <TaskTypeCategoryPicker
                        value={task.taskType}
                        onChange={(v) =>
                          handleTaskChange(taskIdx, "taskType", v)
                        }
                        includeRepository
                      />

                      <TextField
                        label="Task Title"
                        value={task.title || ""}
                        onChange={(e) =>
                          handleTaskChange(taskIdx, "title", e.target.value)
                        }
                        placeholder="e.g., Understanding GitHub Issues"
                        fullWidth
                        sx={{ borderRadius: 2, mb: 2 }}
                      />

                      <TextField
                        label="Task Notes (not displayed to student)"
                        value={task.taskDesc}
                        onChange={(e) =>
                          handleTaskChange(taskIdx, "taskDesc", e.target.value)
                        }
                        placeholder="notes for task"
                        fullWidth
                        sx={{ borderRadius: 2 }}
                      />

                      <TextField
                        label="Points/XP"
                        type="number"
                        value={task.points || 0}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                          if (value < 0) {
                            // Prevent setting points below 0
                            return;
                          }
                          handleTaskChange(taskIdx, "points", value);
                        }}
                        inputProps={{ min: 0 }}
                        fullWidth
                        sx={{ borderRadius: 2 }}
                        helperText="Minimum value: 0"
                      />

                      <Divider />

                      {/* Question Text Field */}
                      {task.taskType !== "multiple-choice" && (
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "primary.main",
                            }}
                          >
                            Question Text
                          </Typography>
                          <TextEditor
                            value={task.acceptText}
                            onChange={(value) =>
                              handleTaskChange(taskIdx, "acceptText", value)
                            }
                            label="Question Text"
                            placeholder="This text appears when the task is first presented to students"
                            helperText="This is the main question text. You can type directly or upload a text file."
                            acceptFileTypes=".txt,.md,.markdown,text/plain,text/markdown"
                          />
                        </Box>
                      )}

                      {/* Conditional Fields based on Task Type */}
                      {task.taskType === "multiple-choice" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            Multiple Choice Question
                          </Typography>
                          <TextField
                            label="Question"
                            value={task.question || ""}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "question",
                                e.target.value
                              )
                            }
                            placeholder="Enter your question here"
                            fullWidth
                            multiline
                            rows={2}
                            helperText="The actual question that will be displayed to students"
                            sx={{ mb: 2 }}
                          />
                          {task.options.map((opt, optIdx) => (
                            <Box
                              key={opt.label}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <TextField
                                label={`Option ${opt.label}`}
                                value={opt.value}
                                onChange={(e) =>
                                  handleTaskChange(
                                    taskIdx,
                                    `option-${optIdx}`,
                                    e.target.value
                                  )
                                }
                                fullWidth
                                sx={{ borderRadius: 2 }}
                              />
                              {optIdx >= 2 && (
                                <IconButton
                                  color="error"
                                  onClick={() =>
                                    handleRemoveOption(taskIdx, optIdx)
                                  }
                                  disabled={false}
                                  sx={{ borderRadius: 2 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          ))}
                          <Button
                            onClick={() => handleAddOption(taskIdx)}
                            sx={{ mt: 1, borderRadius: 4 }}
                          >
                            Add Option
                          </Button>
                          <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Correct Answer</InputLabel>
                            <Select
                              value={task.correctAnswer}
                              onChange={(e) =>
                                handleTaskChange(
                                  taskIdx,
                                  "correctAnswer",
                                  e.target.value
                                )
                              }
                              label="Correct Answer"
                              sx={{ borderRadius: 2 }}
                            >
                              {task.options.map((opt, idx) => (
                                <MenuItem
                                  key={opt.label}
                                  value={opt.label.toLowerCase()}
                                >
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      )}

                      {task.taskType === "quiz" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            Multi-Question Quiz
                          </Typography>

                          {(task.questions || []).map((question, qIdx) => (
                            <Card
                              key={qIdx}
                              sx={{
                                border: "1px solid #e0e0e0",
                                borderRadius: 4,
                                boxShadow: "none",
                                p: 2,
                                mb: 2,
                                backgroundColor: "#f8f9fa",
                              }}
                            >
                              <Stack spacing={2}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 700 }}
                                  >
                                    Question {qIdx + 1}
                                  </Typography>
                                  {(task.questions || []).length > 1 && (
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        removeQuestion(taskIdx, qIdx)
                                      }
                                      sx={{ borderRadius: 2 }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>

                                <TextField
                                  label="Question"
                                  value={question.question}
                                  onChange={(e) =>
                                    updateQuestion(
                                      taskIdx,
                                      qIdx,
                                      "question",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter your question here"
                                  fullWidth
                                  multiline
                                  rows={2}
                                  sx={{ borderRadius: 2 }}
                                />

                                <TextField
                                  label="Option A"
                                  value={question.optionA}
                                  onChange={(e) =>
                                    updateQuestion(
                                      taskIdx,
                                      qIdx,
                                      "optionA",
                                      e.target.value
                                    )
                                  }
                                  fullWidth
                                  sx={{ borderRadius: 2 }}
                                />

                                <TextField
                                  label="Option B"
                                  value={question.optionB}
                                  onChange={(e) =>
                                    updateQuestion(
                                      taskIdx,
                                      qIdx,
                                      "optionB",
                                      e.target.value
                                    )
                                  }
                                  fullWidth
                                  sx={{ borderRadius: 2 }}
                                />

                                <TextField
                                  label="Option C"
                                  value={question.optionC}
                                  onChange={(e) =>
                                    updateQuestion(
                                      taskIdx,
                                      qIdx,
                                      "optionC",
                                      e.target.value
                                    )
                                  }
                                  fullWidth
                                  sx={{ borderRadius: 2 }}
                                />

                                <TextField
                                  label="Option D"
                                  value={question.optionD}
                                  onChange={(e) =>
                                    updateQuestion(
                                      taskIdx,
                                      qIdx,
                                      "optionD",
                                      e.target.value
                                    )
                                  }
                                  fullWidth
                                  sx={{ borderRadius: 2 }}
                                />

                                <FormControl fullWidth>
                                  <InputLabel>Correct Answer</InputLabel>
                                  <Select
                                    value={question.correctAnswer}
                                    onChange={(e) =>
                                      updateQuestion(
                                        taskIdx,
                                        qIdx,
                                        "correctAnswer",
                                        e.target.value
                                      )
                                    }
                                    label="Correct Answer"
                                    sx={{ borderRadius: 2 }}
                                  >
                                    <MenuItem value="a">A</MenuItem>
                                    <MenuItem value="b">B</MenuItem>
                                    <MenuItem value="c">C</MenuItem>
                                    <MenuItem value="d">D</MenuItem>
                                  </Select>
                                </FormControl>

                                <TextField
                                  label="Explanation (Optional)"
                                  value={question.explanation}
                                  onChange={(e) =>
                                    updateQuestion(
                                      taskIdx,
                                      qIdx,
                                      "explanation",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Explain why this is the correct answer"
                                  fullWidth
                                  multiline
                                  rows={2}
                                  sx={{ borderRadius: 2 }}
                                />
                              </Stack>
                            </Card>
                          ))}

                          <Button
                            variant="outlined"
                            onClick={() => addQuestion()}
                            startIcon={<AddIcon />}
                            sx={{ mt: 2, borderRadius: 4 }}
                          >
                            Add Another Question
                          </Button>
                        </Box>
                      )}

                      {(task.taskType === "get-issue-count" ||
                        task.taskType === "get-pr-count" ||
                        task.taskType === "get-top-contributor" ||
                        task.taskType === "get-open-issue") && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            {task.taskType === "get-issue-count" &&
                              "Issue Count Task"}
                            {task.taskType === "get-pr-count" &&
                              "Pull Request Count Task"}
                            {task.taskType === "get-top-contributor" &&
                              "Top Contributor Task"}
                            {task.taskType === "get-open-issue" &&
                              "Open Issue Count Task"}
                          </Typography>

                          <TextField
                            label="Repository (owner/repo)"
                            value={task.repository}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "repository",
                                e.target.value
                              )
                            }
                            placeholder="e.g., microsoft/vscode"
                            fullWidth
                            helperText="Format: owner/repository-name"
                            sx={{ borderRadius: 2 }}
                          />

                          {task.taskType === "get-issue-count" && (
                            <Box sx={{ mt: 2 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={task.saveValidatedData || false}
                                    onChange={(e) =>
                                      handleTaskChange(
                                        taskIdx,
                                        "saveValidatedData",
                                        e.target.checked
                                      )
                                    }
                                  />
                                }
                                label="Save validated data per user"
                                sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                              />
                              {task.saveValidatedData && (
                                <>
                                  <TextField
                                    label="Data Name"
                                    value={task.savedDataName || ""}
                                    onChange={(e) =>
                                      handleTaskChange(
                                        taskIdx,
                                        "savedDataName",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g., repo_issue_count"
                                    fullWidth
                                    helperText="Key used to store this value in each student's data."
                                    sx={{ mt: 1, borderRadius: 2 }}
                                  />
                                  <Alert
                                    severity="info"
                                    sx={{
                                      mt: 1,
                                      borderRadius: 4,
                                      "& .MuiAlert-icon": { display: "none" },
                                    }}
                                  >
                                    <AlertTitle>Per-user Storage</AlertTitle>
                                    When enabled, the validated answer is saved
                                    for each student separately. The value is
                                    stored as a number.
                                  </Alert>
                                </>
                              )}
                            </Box>
                          )}
                        </Box>
                      )}

                      {task.taskType === "get-issue-title" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            Issue Title Task
                          </Typography>

                          <TextField
                            label="Repository (owner/repo)"
                            value={task.repository}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "repository",
                                e.target.value
                              )
                            }
                            placeholder="e.g., microsoft/vscode"
                            fullWidth
                            helperText="Format: owner/repository-name"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              mb: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.useStoredKey || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "useStoredKey",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Use stored data for Issue Number"
                              sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                            />
                            <FormControl
                              sx={{ minWidth: 240 }}
                              disabled={
                                !task.useStoredKey ||
                                (storedKeys || []).length === 0
                              }
                            >
                              <InputLabel>Stored Data</InputLabel>
                              <Select
                                label="Stored Data"
                                value={task.selectedStoredKey || ""}
                                onChange={(e) =>
                                  handleTaskChange(
                                    taskIdx,
                                    "selectedStoredKey",
                                    e.target.value
                                  )
                                }
                              >
                                <MenuItem value="">
                                  Set number manually
                                </MenuItem>
                                {(storedKeys || []).map((k, i) => (
                                  <MenuItem
                                    key={`${k.dataName}-${i}`}
                                    value={k.dataName}
                                  >
                                    {k.dataName}
                                  </MenuItem>
                                ))}
                              </Select>
                              <FormHelperText>
                                {(storedKeys || []).length === 0
                                  ? "No stored keys available yet"
                                  : "Choose a previously saved value"}
                              </FormHelperText>
                            </FormControl>
                          </Box>

                          <TextField
                            label="Issue Number"
                            type="number"
                            value={task.issueNumber}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "issueNumber",
                                e.target.value
                              )
                            }
                            placeholder="e.g., 123"
                            fullWidth
                            helperText={
                              task.useStoredKey
                                ? "Using stored data; manual input disabled"
                                : "The specific issue number students should find"
                            }
                            sx={{ borderRadius: 2 }}
                            disabled={Boolean(task.useStoredKey)}
                          />
                        </Box>
                      )}

                      {task.taskType === "assigned" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            Assignment Validation Task
                          </Typography>

                          <TextField
                            label="Repository (owner/repo)"
                            value={task.repository}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "repository",
                                e.target.value
                              )
                            }
                            placeholder="e.g., microsoft/vscode"
                            fullWidth
                            helperText="Format: owner/repository-name"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <TextField
                            label="Issue Number"
                            type="number"
                            value={task.issueNumber}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "issueNumber",
                                e.target.value
                              )
                            }
                            placeholder="e.g., 123"
                            fullWidth
                            helperText="The specific issue number students must be assigned to"
                            sx={{ borderRadius: 2 }}
                          />
                        </Box>
                      )}

                      {task.taskType === "issue-no" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            Issue Number Validation Task
                          </Typography>

                          <TextField
                            label="Repository (owner/repo)"
                            value={task.repository}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "repository",
                                e.target.value
                              )
                            }
                            placeholder="e.g., microsoft/vscode"
                            fullWidth
                            helperText="Format: owner/repository-name"
                            sx={{ borderRadius: 2 }}
                          />

                          <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.saveValidatedData || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "saveValidatedData",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Save validated data per user"
                              sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                            />
                            {task.saveValidatedData && (
                              <>
                                <TextField
                                  label="Data Name"
                                  value={task.savedDataName || ""}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "savedDataName",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., provided_issue_number"
                                  fullWidth
                                  helperText="Key used to store this value in each student's data."
                                  sx={{ mt: 1, borderRadius: 2 }}
                                />
                                <Alert
                                  severity="info"
                                  sx={{
                                    mt: 1,
                                    borderRadius: 4,
                                    "& .MuiAlert-icon": { display: "none" },
                                  }}
                                >
                                  <AlertTitle>Per-user Storage</AlertTitle>
                                  When enabled, the student-provided issue
                                  number is saved for each student separately.
                                  The value is stored as a number.
                                </Alert>
                              </>
                            )}
                          </Box>
                        </Box>
                      )}

                      {task.taskType === "comment" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            Comment Validation Task
                          </Typography>

                          <TextField
                            label="Repository (owner/repo)"
                            value={task.repository}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "repository",
                                e.target.value
                              )
                            }
                            placeholder="e.g., microsoft/vscode"
                            fullWidth
                            helperText="Format: owner/repository-name"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <TextField
                            label="Issue Number"
                            type="number"
                            value={task.issueNumber}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "issueNumber",
                                e.target.value
                              )
                            }
                            placeholder="e.g., 123"
                            fullWidth
                            helperText="The specific issue number where students should post a comment"
                            sx={{ borderRadius: 2 }}
                          />
                        </Box>
                      )}

                      {task.taskType === "validate-fork-url" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            Validate Fork URL Task
                          </Typography>

                          <TextField
                            label="Repository To Be Forked (owner/repo)"
                            value={task.repositoryToBeStored || ""}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "repositoryToBeStored",
                                e.target.value
                              )
                            }
                            placeholder="e.g., AnkurMali/IST597_Fall2019_TF2.0"
                            fullWidth
                            helperText="The upstream repository that students must fork (format: owner/repo)"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.requireOwnership !== false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "requireOwnership",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Require ownership verification"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.allowForkOfFork !== false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "allowForkOfFork",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Allow fork of fork (if source repository matches)"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.saveValidatedData || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "saveValidatedData",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Save validated fork URL per user"
                              sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                            />
                            {task.saveValidatedData && (
                              <>
                                <TextField
                                  label="Data Name"
                                  value={task.savedDataName || ""}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "savedDataName",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., studentForkRepo"
                                  fullWidth
                                  helperText="Custom key used to store the fork URL (also stores 'key' and 'keyUrl')"
                                  sx={{ mt: 1, borderRadius: 2 }}
                                />
                                <Alert
                                  severity="info"
                                  sx={{
                                    mt: 1,
                                    borderRadius: 4,
                                    "& .MuiAlert-icon": { display: "none" },
                                  }}
                                >
                                  <AlertTitle>Per-user Storage</AlertTitle>
                                  When enabled, the validated fork URL is saved for each student separately. 
                                  The value is stored as a string (e.g., "username/repo").
                                </Alert>
                              </>
                            )}
                          </Box>
                        </Box>
                      )}

                      {task.taskType === "validate-file-exists" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            Validate File Exists Task
                          </Typography>

                          <TextField
                            label="Expected File Name (Optional)"
                            value={task.expectedFileName || ""}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "expectedFileName",
                                e.target.value
                              )
                            }
                            placeholder="e.g., CONTRIBUTING.md"
                            fullWidth
                            helperText="Leave empty to accept any file name"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <TextField
                            label="Expected File Type (Optional)"
                            value={task.expectedFileType || ""}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "expectedFileType",
                                e.target.value
                              )
                            }
                            placeholder="e.g., .md or .pdf"
                            fullWidth
                            helperText="File extension to match (e.g., .md, .pdf, .py). Leave empty to accept any type."
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.saveValidatedData || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "saveValidatedData",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Save validated file URL per user"
                              sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                            />
                            {task.saveValidatedData && (
                              <>
                                <TextField
                                  label="Data Name"
                                  value={task.savedDataName || ""}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "savedDataName",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., studentFileUrl"
                                  fullWidth
                                  helperText="Custom key used to store the file URL (also stores 'keyFileName' and 'keyFileType')"
                                  sx={{ mt: 1, borderRadius: 2 }}
                                />
                                <Alert
                                  severity="info"
                                  sx={{
                                    mt: 1,
                                    borderRadius: 4,
                                    "& .MuiAlert-icon": { display: "none" },
                                  }}
                                >
                                  <AlertTitle>Per-user Storage</AlertTitle>
                                  When enabled, the validated file URL, file name, and file type are saved for each student separately.
                                </Alert>
                              </>
                            )}
                          </Box>
                        </Box>
                      )}

                      {task.taskType === "validate-push" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            Validate Push/Commit Task
                          </Typography>

                          <TextField
                            label="Target Repository (Required)"
                            value={task.targetRepository || ""}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "targetRepository",
                                e.target.value
                              )
                            }
                            placeholder="e.g., igorsteinmacher/CS499-OSS"
                            fullWidth
                            required
                            helperText="The repository where the commit should exist - format: owner/repo"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <TextField
                            label="Target Branch (Optional)"
                            value={task.targetBranch || "main"}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "targetBranch",
                                e.target.value
                              )
                            }
                            placeholder="e.g., main"
                            fullWidth
                            helperText="The branch where the commit should exist. Defaults to 'main'"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <TextField
                            label="Expected File Path (Optional)"
                            value={task.expectedFilePath || ""}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "expectedFilePath",
                                e.target.value
                              )
                            }
                            placeholder="e.g., students/misanetc.md"
                            fullWidth
                            helperText="Optional: File path that should exist in the commit"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.requireOwnership !== false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "requireOwnership",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Require ownership verification (verify commit author is the student)"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.requireRecentPush || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "requireRecentPush",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Require recent push (commit must be within time window)"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          {task.requireRecentPush && (
                            <TextField
                              label="Recent Push Window (Hours)"
                              type="number"
                              value={task.recentPushWindowHours || 24}
                              onChange={(e) =>
                                handleTaskChange(
                                  taskIdx,
                                  "recentPushWindowHours",
                                  parseInt(e.target.value) || 24
                                )
                              }
                              placeholder="24"
                              fullWidth
                              helperText="Number of hours within which the commit must be made"
                              sx={{ mb: 2, borderRadius: 2 }}
                            />
                          )}

                          <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.saveValidatedData || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "saveValidatedData",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Save validated commit URL per user"
                              sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                            />
                            {task.saveValidatedData && (
                              <>
                                <TextField
                                  label="Data Name"
                                  value={task.savedDataName || ""}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "savedDataName",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., commitSha"
                                  fullWidth
                                  helperText="Custom key used to store the commit URL (also stores 'commitSha')"
                                  sx={{ mt: 1, borderRadius: 2 }}
                                />
                                <Alert
                                  severity="info"
                                  sx={{
                                    mt: 1,
                                    borderRadius: 4,
                                    "& .MuiAlert-icon": { display: "none" },
                                  }}
                                >
                                  <AlertTitle>Per-user Storage</AlertTitle>
                                  When enabled, the validated commit URL and commit SHA are saved for each student separately.
                                </Alert>
                              </>
                            )}
                          </Box>
                        </Box>
                      )}

                      {task.taskType === "validate-github-actions" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            GitHub Actions Workflow Validation Task
                          </Typography>

                          <TextField
                            label="Workflow File Path"
                            value={task.workflowFilePath || ".github/workflows/main.yml"}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "workflowFilePath",
                                e.target.value
                              )
                            }
                            placeholder=".github/workflows/main.yml"
                            fullWidth
                            helperText="Path to the workflow file to validate (e.g., .github/workflows/main.yml)"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            Validation Parameters (Required - one per line)
                          </Typography>
                          <TextField
                            label="Validation Checks"
                            value={task.validationParameters?.join('\n') || ""}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "validationParameters",
                                e.target.value.split('\n').filter(p => p.trim())
                              )
                            }
                            placeholder="e.g.,&#10;Workflow name must be 'Python application'&#10;Must trigger on both 'push' and 'pull_request'&#10;Python version must be 3.8"
                            fullWidth
                            multiline
                            rows={6}
                            required
                            helperText="List of checks to perform (one per line). Examples: 'Workflow name must be X', 'Python version must be 3.8', 'Test command must be Y'"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.enableDetailedFeedback !== false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "enableDetailedFeedback",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Enable detailed feedback (show which checks passed/failed)"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.waitForWorkflowCompletion || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "waitForWorkflowCompletion",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Check workflow execution status (if running, user will be asked to try again later)"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.requireStudentOwnership || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "requireStudentOwnership",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Require student's personal repository (repository owner must match student's GitHub username)"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          {task.requireStudentOwnership && (
                            <Box sx={{ mb: 2, ml: 4 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={task.requirePrivateRepo || false}
                                    onChange={(e) =>
                                      handleTaskChange(
                                        taskIdx,
                                        "requirePrivateRepo",
                                        e.target.checked
                                      )
                                    }
                                  />
                                }
                                label="Require private repository (only applies if student ownership is required)"
                                sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                              />
                            </Box>
                          )}

                          <Alert
                            severity="info"
                            sx={{
                              mt: 2,
                              borderRadius: 4,
                              "& .MuiAlert-icon": { display: "none" },
                            }}
                          >
                            <AlertTitle>How It Works</AlertTitle>
                            The bot will fetch the workflow file from the student's repository and check if it meets all the specified validation parameters. Each parameter is checked against the workflow content. If "Check workflow execution status" is enabled, the bot will also verify that the workflow has run successfully. If the workflow is still running, the student will be asked to try again later.
                          </Alert>
                        </Box>
                      )}

                      {task.taskType === "validate-repository" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            Repository Validation Task
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.requireRepositoryExists !== false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "requireRepositoryExists",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Require repository exists (check if repository is accessible)"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          <TextField
                            select
                            label="Ownership Type"
                            value={task.ownershipType || "any"}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "ownershipType",
                                e.target.value
                              )
                            }
                            fullWidth
                            helperText="Required repository ownership type"
                            sx={{ mb: 2, borderRadius: 2 }}
                          >
                            <MenuItem value="any">Any (user or organization)</MenuItem>
                            <MenuItem value="user">User (personal account)</MenuItem>
                            <MenuItem value="organization">Organization</MenuItem>
                          </TextField>

                          <TextField
                            label="Specific Owner (Optional)"
                            value={task.specificOwner || ""}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "specificOwner",
                                e.target.value
                              )
                            }
                            placeholder="e.g., OSS-Doorway-Dev"
                            fullWidth
                            helperText="Specific owner username/org name. Leave empty to check student ownership for 'user' type or any owner for 'org' type."
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.checkBotAuthorization || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "checkBotAuthorization",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Check bot authorization (verify bot has access to repository)"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.requirePublic || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "requirePublic",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Require public repository"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.requirePrivate || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "requirePrivate",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Require private repository"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.saveValidatedData || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "saveValidatedData",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Save validated repository URL for later use"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          {task.saveValidatedData && (
                            <TextField
                              label="Saved Data Key Name"
                              value={task.savedDataName || "validatedRepo"}
                              onChange={(e) =>
                                handleTaskChange(
                                  taskIdx,
                                  "savedDataName",
                                  e.target.value
                                )
                              }
                              placeholder="validatedRepo"
                              fullWidth
                              helperText="Key name to store the validated repository URL"
                              sx={{ mb: 2, borderRadius: 2 }}
                            />
                          )}

                          <Alert
                            severity="info"
                            sx={{
                              mt: 2,
                              borderRadius: 4,
                              "& .MuiAlert-icon": { display: "none" },
                            }}
                          >
                            <AlertTitle>How It Works</AlertTitle>
                            The bot will validate the repository provided by the student. It can check: repository existence, ownership type (user/organization), specific owner, bot authorization (if GitHub App is installed), and privacy (public/private). Use this task type to verify students are using the correct repository before starting assignments.
                          </Alert>
                        </Box>
                      )}

                      {task.taskType === "validate-pr-url" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 2,
                              color: "secondary.main",
                            }}
                          >
                            Validate PR URL Task
                          </Typography>

                          <TextField
                            label="Target Repository (Required)"
                            value={task.targetRepository || ""}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "targetRepository",
                                e.target.value
                              )
                            }
                            placeholder="e.g., igorsteinmacher/CS499-OSS"
                            fullWidth
                            required
                            helperText="The repository the PR should target (base repo) - format: owner/repo"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <TextField
                            label="Target Branch (Optional)"
                            value={task.targetBranch || "main"}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "targetBranch",
                                e.target.value
                              )
                            }
                            placeholder="e.g., main"
                            fullWidth
                            helperText="The branch the PR should target (base branch). Defaults to 'main'"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <TextField
                            label="Source Repository / OG Repo (Optional)"
                            value={task.sourceRepository || ""}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "sourceRepository",
                                e.target.value
                              )
                            }
                            placeholder="e.g., misanetc/CS499-OSS"
                            fullWidth
                            helperText="The fork/repo the PR should come from (head repo). Leave empty to accept PRs from any source (recommended for multi-student deployments)."
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.requireOwnership !== false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "requireOwnership",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Require ownership verification (verify PR creator is the student)"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.requireOpenState !== false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "requireOpenState",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Require PR to be open (reject closed/merged PRs)"
                              sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                            />
                          </Box>

                          <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.saveValidatedData || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "saveValidatedData",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Save validated PR URL per user"
                              sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                            />
                            {task.saveValidatedData && (
                              <>
                                <TextField
                                  label="Data Name"
                                  value={task.savedDataName || ""}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "savedDataName",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., prUrl"
                                  fullWidth
                                  helperText="Custom key used to store the PR URL (also stores 'prNumber')"
                                  sx={{ mt: 1, borderRadius: 2 }}
                                />
                                <Alert
                                  severity="info"
                                  sx={{
                                    mt: 1,
                                    borderRadius: 4,
                                    "& .MuiAlert-icon": { display: "none" },
                                  }}
                                >
                                  <AlertTitle>Per-user Storage</AlertTitle>
                                  When enabled, the validated PR URL and PR number are saved for each student separately.
                                </Alert>
                              </>
                            )}
                          </Box>
                        </Box>
                      )}

                      {task.taskType === "validate-file-content" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Box
                            sx={{
                              backgroundColor: "#f3e5f5",
                              p: 3,
                              borderRadius: 4,
                              border: "2px solid #9c27b0",
                              mb: 2,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "secondary.main",
                              }}
                            >
                              LLM File Content Validation Task
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              Students provide a GitHub file URL. The system fetches the file content and uses AI to validate it meets your criteria.
                            </Typography>
                          </Box>

                          <TextField
                            label="Validation Question"
                            value={task.fileContentValidation?.question || ""}
                            onChange={(e) =>
                              handleTaskChange(taskIdx, "fileContentValidation", {
                                ...task.fileContentValidation,
                                question: e.target.value,
                              })
                            }
                            placeholder="e.g., Does this file contain proper documentation?"
                            fullWidth
                            multiline
                            rows={3}
                            helperText="Optional: Provide a question or description of what should be validated"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                              Validation Criteria (Required)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Add criteria that the file content must meet. Each criterion will be checked by the AI.
                            </Typography>
                            {(task.fileContentValidation?.validationParameters || []).map((param, paramIdx) => (
                              <Box key={paramIdx} sx={{ display: "flex", gap: 1, mb: 1 }}>
                                <TextField
                                  fullWidth
                                  value={param}
                                  onChange={(e) => {
                                    const newParams = [...(task.fileContentValidation?.validationParameters || [])];
                                    newParams[paramIdx] = e.target.value;
                                    handleTaskChange(taskIdx, "fileContentValidation", {
                                      ...task.fileContentValidation,
                                      validationParameters: newParams,
                                    });
                                  }}
                                  placeholder={`Criterion ${paramIdx + 1}`}
                                  sx={{ borderRadius: 2 }}
                                />
                                <IconButton
                                  onClick={() => {
                                    const newParams = (task.fileContentValidation?.validationParameters || []).filter(
                                      (_, i) => i !== paramIdx
                                    );
                                    handleTaskChange(taskIdx, "fileContentValidation", {
                                      ...task.fileContentValidation,
                                      validationParameters: newParams,
                                    });
                                  }}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            ))}
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                const newParams = [...(task.fileContentValidation?.validationParameters || []), ""];
                                handleTaskChange(taskIdx, "fileContentValidation", {
                                  ...task.fileContentValidation,
                                  validationParameters: newParams,
                                });
                              }}
                              sx={{ borderRadius: 2 }}
                            >
                              Add Criterion
                            </Button>
                          </Box>

                          <TextField
                            label="Temperature"
                            type="number"
                            value={task.fileContentValidation?.temperature || 0.1}
                            onChange={(e) =>
                              handleTaskChange(taskIdx, "fileContentValidation", {
                                ...task.fileContentValidation,
                                temperature: parseFloat(e.target.value) || 0.1,
                              })
                            }
                            inputProps={{ min: 0, max: 1, step: 0.1 }}
                            fullWidth
                            helperText="LLM temperature (0.0 = deterministic, 1.0 = creative). Recommended: 0.1"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={task.fileContentValidation?.enableDetailedFeedback || false}
                                onChange={(e) =>
                                  handleTaskChange(taskIdx, "fileContentValidation", {
                                    ...task.fileContentValidation,
                                    enableDetailedFeedback: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Enable detailed feedback"
                            sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                          />

                          <TextField
                            label="Expected File Path (Optional)"
                            value={task.expectedFilePath || ""}
                            onChange={(e) =>
                              handleTaskChange(taskIdx, "expectedFilePath", e.target.value)
                            }
                            placeholder="e.g., README.md or LICENSE.txt"
                            fullWidth
                            helperText="Optional: Specify the exact file name that must be submitted (case-insensitive). Leave empty to accept any file name."
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Alert
                            severity="info"
                            sx={{
                              mb: 2,
                              borderRadius: 4,
                              "& .MuiAlert-icon": { display: "none" },
                            }}
                          >
                            <AlertTitle>File Content Validation</AlertTitle>
                            Students will provide a GitHub file URL (e.g., https://github.com/owner/repo/blob/main/file.md).
                            The system will fetch the file content and validate it using AI against your criteria.
                            Only text-based files are supported (e.g., .md, .txt, .js, .py, .json).
                          </Alert>
                        </Box>
                      )}

                      {task.taskType === "iterative-code-review" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Box
                            sx={{
                              backgroundColor: "#e8eaf6",
                              p: 3,
                              borderRadius: 4,
                              border: "2px solid #3f51b5",
                              mb: 2,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "primary.main",
                              }}
                            >
                              Iterative Code Review Task
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              Students submit code via GitHub file URL for AI review. The bot provides feedback until the code meets your requirements or max iterations is reached. Students can resubmit by posting a new URL or typing "done" to recheck the last reviewed file.
                            </Typography>
                          </Box>

                          <TextField
                            label="Review Prompt / Requirements"
                            value={task.iterativeCodeReview?.reviewPrompt || ""}
                            onChange={(e) =>
                              handleTaskChange(taskIdx, "iterativeCodeReview", {
                                ...task.iterativeCodeReview,
                                reviewPrompt: e.target.value,
                              })
                            }
                            placeholder="Describe what the code should do and what criteria it will be reviewed against..."
                            fullWidth
                            multiline
                            rows={5}
                            helperText="Required: Detailed description of the code requirements and review criteria"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                              Review Criteria (Required)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Add specific criteria that the code must meet. Each criterion will be checked by the AI reviewer.
                            </Typography>
                            {(task.iterativeCodeReview?.reviewCriteria || []).map((criterion, idx) => (
                              <Box key={idx} sx={{ display: "flex", gap: 1, mb: 1 }}>
                                <TextField
                                  fullWidth
                                  value={criterion}
                                  onChange={(e) => {
                                    const newCriteria = [...(task.iterativeCodeReview?.reviewCriteria || [])];
                                    newCriteria[idx] = e.target.value;
                                    handleTaskChange(taskIdx, "iterativeCodeReview", {
                                      ...task.iterativeCodeReview,
                                      reviewCriteria: newCriteria,
                                    });
                                  }}
                                  placeholder={`Criterion ${idx + 1} (e.g., "Handles edge cases", "Includes error checking")`}
                                  sx={{ borderRadius: 2 }}
                                />
                                <IconButton
                                  onClick={() => {
                                    const newCriteria = (task.iterativeCodeReview?.reviewCriteria || []).filter(
                                      (_, i) => i !== idx
                                    );
                                    handleTaskChange(taskIdx, "iterativeCodeReview", {
                                      ...task.iterativeCodeReview,
                                      reviewCriteria: newCriteria,
                                    });
                                  }}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            ))}
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                const newCriteria = [...(task.iterativeCodeReview?.reviewCriteria || []), ""];
                                handleTaskChange(taskIdx, "iterativeCodeReview", {
                                  ...task.iterativeCodeReview,
                                  reviewCriteria: newCriteria,
                                });
                              }}
                              sx={{ borderRadius: 2 }}
                            >
                              Add Criterion
                            </Button>
                          </Box>

                          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                            <TextField
                              label="Max Iterations"
                              type="number"
                              value={task.iterativeCodeReview?.maxIterations || 5}
                              onChange={(e) =>
                                handleTaskChange(taskIdx, "iterativeCodeReview", {
                                  ...task.iterativeCodeReview,
                                  maxIterations: parseInt(e.target.value) || 5,
                                })
                              }
                              inputProps={{ min: 1, max: 20 }}
                              helperText="Max review cycles (1-20)"
                              sx={{ width: 180 }}
                            />

                            <TextField
                              label="Temperature"
                              type="number"
                              value={task.iterativeCodeReview?.temperature || 0.3}
                              onChange={(e) =>
                                handleTaskChange(taskIdx, "iterativeCodeReview", {
                                  ...task.iterativeCodeReview,
                                  temperature: parseFloat(e.target.value) || 0.3,
                                })
                              }
                              inputProps={{ min: 0, max: 2, step: 0.1 }}
                              helperText="AI creativity (0.1-2.0)"
                              sx={{ width: 180 }}
                            />
                          </Box>

                          <TextField
                            label="PR File Pattern (Optional)"
                            value={task.iterativeCodeReview?.prFilePattern || ""}
                            onChange={(e) =>
                              handleTaskChange(taskIdx, "iterativeCodeReview", {
                                ...task.iterativeCodeReview,
                                prFilePattern: e.target.value,
                              })
                            }
                            placeholder="*.cpp,*.h"
                            fullWidth
                            helperText="For PR submissions: file patterns to review (comma-separated). Leave empty to review all files."
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={task.iterativeCodeReview?.commentOnPR !== false}
                                onChange={(e) =>
                                  handleTaskChange(taskIdx, "iterativeCodeReview", {
                                    ...task.iterativeCodeReview,
                                    commentOnPR: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Post feedback as comments on PR (in addition to task issue)"
                            sx={{ ...STYLES.checkbox.standard, mb: 1, display: 'flex', width: 'fit-content' }}
                          />
                          
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={task.iterativeCodeReview?.approvePR === true}
                                onChange={(e) =>
                                  handleTaskChange(taskIdx, "iterativeCodeReview", {
                                    ...task.iterativeCodeReview,
                                    approvePR: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Auto-approve PR when code review passes (requires pull_requests: write permission)"
                            sx={{ ...STYLES.checkbox.standard, mb: 1, display: 'flex', width: 'fit-content' }}
                          />
                          
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={task.iterativeCodeReview?.mergePR === true}
                                onChange={(e) =>
                                  handleTaskChange(taskIdx, "iterativeCodeReview", {
                                    ...task.iterativeCodeReview,
                                    mergePR: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Auto-merge PR when code review passes (requires pull_requests: write permission and merge access)"
                            sx={{ ...STYLES.checkbox.standard, mb: 1, display: 'flex', width: 'fit-content' }}
                          />
                          
                          {task.iterativeCodeReview?.mergePR && (
                            <TextField
                              select
                              label="Merge Method"
                              value={task.iterativeCodeReview?.mergeMethod || 'merge'}
                              onChange={(e) =>
                                handleTaskChange(taskIdx, "iterativeCodeReview", {
                                  ...task.iterativeCodeReview,
                                  mergeMethod: e.target.value,
                                })
                              }
                              helperText="How to merge the PR: merge (merge commit), squash (single commit), or rebase (linear history)"
                              sx={{ mb: 2, minWidth: 200 }}
                            >
                              <MenuItem value="merge">Merge Commit</MenuItem>
                              <MenuItem value="squash">Squash and Merge</MenuItem>
                              <MenuItem value="rebase">Rebase and Merge</MenuItem>
                            </TextField>
                          )}

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={task.iterativeCodeReview?.enableDetailedFeedback !== false}
                                onChange={(e) =>
                                  handleTaskChange(taskIdx, "iterativeCodeReview", {
                                    ...task.iterativeCodeReview,
                                    enableDetailedFeedback: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Enable detailed feedback (constructive code review comments)"
                            sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                          />

                          <Alert
                            severity="info"
                            sx={{
                              mb: 2,
                              borderRadius: 4,
                              "& .MuiAlert-icon": { display: "none" },
                            }}
                          >
                            <AlertTitle>How It Works</AlertTitle>
                            <Typography variant="body2" component="div">
                              1. Student posts a GitHub file URL OR PR link containing their code<br/>
                              2. Bot fetches and reviews the code using AI<br/>
                              3. If not approved, bot posts feedback and waits for resubmission<br/>
                              4. Student can post a new URL, PR link, or type "done" to recheck<br/>
                              5. Process repeats until code is approved or max iterations reached<br/>
                              <strong>PR Support:</strong> Students can create a feature branch, push changes, and submit a PR link for review
                            </Typography>
                          </Alert>
                        </Box>
                      )}

                      {task.taskType === "bot-code-review" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Box
                            sx={{
                              backgroundColor: "#e3f2fd",
                              p: 3,
                              borderRadius: 4,
                              mb: 3,
                              border: "2px solid #2196f3",
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "#1976d2",
                                fontWeight: "bold",
                                mb: 2,
                              }}
                            >
                              <AutoAwesomeIcon />
                              Bot Code Review Configuration
                            </Typography>
                          </Box>

                          <TextField
                            label="Original Code"
                            value={task.botCodeReview?.originalCode || ""}
                            onChange={(e) =>
                              handleTaskChange(taskIdx, "botCodeReview", {
                                ...task.botCodeReview,
                                originalCode: e.target.value,
                              })
                            }
                            placeholder="Paste the initial (flawed) code that students will review..."
                            fullWidth
                            multiline
                            rows={10}
                            helperText="Required: The code with issues that the bot will present for review"
                            sx={{ mb: 2, borderRadius: 2, fontFamily: 'monospace' }}
                          />

                          <TextField
                            label="Code Language"
                            value={task.botCodeReview?.codeLanguage || "cpp"}
                            onChange={(e) =>
                              handleTaskChange(taskIdx, "botCodeReview", {
                                ...task.botCodeReview,
                                codeLanguage: e.target.value,
                              })
                            }
                            placeholder="e.g., cpp, python, java, javascript"
                            fullWidth
                            helperText="Language for syntax highlighting (default: cpp)"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <TextField
                            label="Code Requirements"
                            value={task.botCodeReview?.requirements || ""}
                            onChange={(e) =>
                              handleTaskChange(taskIdx, "botCodeReview", {
                                ...task.botCodeReview,
                                requirements: e.target.value,
                              })
                            }
                            placeholder="Describe what the code is supposed to do..."
                            fullWidth
                            multiline
                            rows={3}
                            helperText="Required: Description of the code's intended functionality"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <TextField
                            label="Known Issues (Required)"
                            value={(task.botCodeReview?.knownIssues || []).join('\n')}
                            onChange={(e) =>
                              handleTaskChange(taskIdx, "botCodeReview", {
                                ...task.botCodeReview,
                                knownIssues: e.target.value.split('\n').filter(line => line.trim()),
                              })
                            }
                            placeholder="Enter each issue on a new line&#10;e.g., Missing null pointer checks&#10;Buffer overflow in sprintf&#10;Incorrect loop bounds"
                            fullWidth
                            multiline
                            rows={6}
                            helperText="Required: List all issues students should identify (one per line)"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                            <TextField
                              label="Max Iterations"
                              type="number"
                              value={task.botCodeReview?.maxIterations || 5}
                              onChange={(e) =>
                                handleTaskChange(taskIdx, "botCodeReview", {
                                  ...task.botCodeReview,
                                  maxIterations: parseInt(e.target.value) || 5,
                                })
                              }
                              inputProps={{ min: 1, max: 20 }}
                              helperText="Max review cycles (1-20)"
                              sx={{ width: 180 }}
                            />

                            <TextField
                              label="Temperature"
                              type="number"
                              value={task.botCodeReview?.temperature || 0.3}
                              onChange={(e) =>
                                handleTaskChange(taskIdx, "botCodeReview", {
                                  ...task.botCodeReview,
                                  temperature: parseFloat(e.target.value) || 0.3,
                                })
                              }
                              inputProps={{ min: 0, max: 2, step: 0.1 }}
                              helperText="AI creativity (0.1-2.0)"
                              sx={{ width: 180 }}
                            />
                          </Box>

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={task.botCodeReview?.enableDetailedFeedback !== false}
                                onChange={(e) =>
                                  handleTaskChange(taskIdx, "botCodeReview", {
                                    ...task.botCodeReview,
                                    enableDetailedFeedback: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Enable detailed feedback (bot explains fixes made)"
                            sx={{ ...STYLES.checkbox.standard, mb: 1, display: 'flex', width: 'fit-content' }}
                          />

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={task.botCodeReview?.awardPointsOnFailure || false}
                                onChange={(e) =>
                                  handleTaskChange(taskIdx, "botCodeReview", {
                                    ...task.botCodeReview,
                                    awardPointsOnFailure: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Award points/XP even if max iterations reached without success"
                            sx={{ ...STYLES.checkbox.standard, mb: 1, display: 'flex', width: 'fit-content' }}
                          />
                          
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={task.botCodeReview?.createPR === true}
                                onChange={(e) =>
                                  handleTaskChange(taskIdx, "botCodeReview", {
                                    ...task.botCodeReview,
                                    createPR: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Create PR with bot's code for review (instead of posting in issue comments)"
                            sx={{ ...STYLES.checkbox.standard, mb: 1, display: 'flex', width: 'fit-content' }}
                          />
                          
                          {task.botCodeReview?.createPR && (
                            <TextField
                              label="File Name for PR"
                              value={task.botCodeReview?.fileName || 'code.cpp'}
                              onChange={(e) =>
                                handleTaskChange(taskIdx, "botCodeReview", {
                                  ...task.botCodeReview,
                                  fileName: e.target.value,
                                })
                              }
                              placeholder="e.g., code.cpp, email_validator.cpp"
                              helperText="File name to use when creating PR"
                              sx={{ mb: 2, width: 300 }}
                            />
                          )}
                          
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={task.botCodeReview?.validateOnApproval !== false}
                                onChange={(e) =>
                                  handleTaskChange(taskIdx, "botCodeReview", {
                                    ...task.botCodeReview,
                                    validateOnApproval: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Validate code against requirements when student approves (ensures code quality even if student approves prematurely)"
                            sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                          />

                          <Alert
                            severity="info"
                            sx={{
                              mb: 2,
                              borderRadius: 4,
                              "& .MuiAlert-icon": { display: "none" },
                            }}
                          >
                            <AlertTitle>How It Works</AlertTitle>
                            <Typography variant="body2" component="div">
                              1. Bot posts flawed code using the task's Accept Message (Question field)<br/>
                              2. Student reviews the code and posts feedback<br/>
                              3. Bot uses AI to fix only the issues the student mentioned<br/>
                              4. If code still has problems, bot asks "What else might be wrong?"<br/>
                              5. Process repeats until all issues are identified or max iterations reached<br/>
                              6. Optional: Award points/XP even if student doesn't finish within max iterations
                            </Typography>
                          </Alert>
                        </Box>
                      )}

                      {task.taskType === "custom-api-call" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Box
                            sx={{
                              backgroundColor: "#e3f2fd",
                              p: 3,
                              borderRadius: 4,
                              border: "2px solid #2196f3",
                              mb: 2,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "primary.main",
                              }}
                            >
                              Custom API Call Task
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              Create dynamic tasks that call GitHub APIs to
                              retrieve real-time data
                            </Typography>
                          </Box>

                          <TextField
                            label="Repository (owner/repo)"
                            value={task.repository}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "repository",
                                e.target.value
                              )
                            }
                            placeholder="JabRef/jabref"
                            fullWidth
                            helperText="Repository to analyze (e.g., JabRef/jabref) - leave empty to use student's assigned repo"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <TextField
                            label="API Endpoint"
                            value={task.apiEndpoint}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "apiEndpoint",
                                e.target.value
                              )
                            }
                            placeholder="/repos/{owner}/{repo}/stargazers"
                            fullWidth
                            helperText="GitHub API endpoint with {owner} and {repo} placeholders"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <TextField
                            label="Response Path"
                            value={task.responsePath}
                            onChange={(e) =>
                              handleTaskChange(
                                taskIdx,
                                "responsePath",
                                e.target.value
                              )
                            }
                            placeholder="length, language, description"
                            fullWidth
                            helperText="JSON path to extract the answer from API response"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />

                          <FormControl fullWidth>
                            <InputLabel>Expected Answer Type</InputLabel>
                            <Select
                              value={task.expectedAnswerType || "Number"}
                              onChange={(e) =>
                                handleTaskChange(
                                  taskIdx,
                                  "expectedAnswerType",
                                  e.target.value
                                )
                              }
                              label="Expected Answer Type"
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="Number">Number</MenuItem>
                              <MenuItem value="Text">Text</MenuItem>
                            </Select>
                          </FormControl>

                          {/* Save validated data per-user */}
                          <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.saveValidatedData || false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "saveValidatedData",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Save validated data per user"
                              sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                            />
                            {task.saveValidatedData && (
                              <>
                                <TextField
                                  label="Data Name"
                                  value={task.savedDataName || ""}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "savedDataName",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., repo_issue_count"
                                  fullWidth
                                  helperText="Key used to store this value in each student's data."
                                  sx={{ mt: 1, borderRadius: 2 }}
                                />
                                <Alert
                                  severity="info"
                                  sx={{
                                    mt: 1,
                                    borderRadius: 4,
                                    "& .MuiAlert-icon": { display: "none" },
                                  }}
                                >
                                  <AlertTitle>Per-user Storage</AlertTitle>
                                  When enabled, the validated answer is saved
                                  for each student separately. The value is
                                  automatically stored as a number or text based
                                  on the expected answer type.
                                </Alert>
                              </>
                            )}
                          </Box>

                          {/* Additional options for Number type */}
                          {task.expectedAnswerType === "Number" && (
                            <Box sx={{ mt: 2 }}>
                              {/* Info box for number visibility */}
                              <Alert
                                severity="info"
                                sx={{
                                  mb: 2,
                                  borderRadius: 4,
                                  "& .MuiAlert-icon": {
                                    display: "none",
                                  },
                                }}
                              >
                                <AlertTitle>Number Visibility</AlertTitle>
                                Ensure the number can be seen by students in the
                                GitHub repository. For example, if asking for
                                issue count, make sure students can access the
                                repository and see the issues tab.
                              </Alert>

                              {/* Tolerance fields in a row */}
                              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                {/* Tolerance checkbox box */}
                                <Card
                                  sx={{
                                    flex: 1,
                                    p: 2,
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 4,
                                    boxShadow: "none",
                                    backgroundColor: "#f9f9fa",
                                  }}
                                >
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={task.enableTolerance || false}
                                        onChange={(e) =>
                                          handleTaskChange(
                                            taskIdx,
                                            "enableTolerance",
                                            e.target.checked
                                          )
                                        }
                                      />
                                    }
                                    label="Enable tolerance for dynamic numbers (±10 default)"
                                  />
                                </Card>

                                {/* Tolerance number box */}
                                {task.enableTolerance && (
                                  <Card
                                    sx={{
                                      flex: 1,
                                      p: 2,
                                      border: "1px solid #e0e0e0",
                                      borderRadius: 4,
                                      boxShadow: "none",
                                      backgroundColor: "#f9f9fa",
                                    }}
                                  >
                                    <TextField
                                      fullWidth
                                      label="Tolerance Range"
                                      type="number"
                                      value={task.toleranceRange || 10}
                                      onChange={(e) =>
                                        handleTaskChange(
                                          taskIdx,
                                          "toleranceRange",
                                          parseInt(e.target.value) || 10
                                        )
                                      }
                                      helperText="Fixed number tolerance (e.g., 10 means ±10 from expected answer)"
                                      sx={{
                                        "& .MuiOutlinedInput-root": {
                                          borderRadius: 2,
                                        },
                                      }}
                                    />
                                  </Card>
                                )}
                              </Stack>
                            </Box>
                          )}
                        </Box>
                      )}

                      {task.taskType === "llm-text-validation" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Box
                            sx={{
                              backgroundColor: "#fff3e0",
                              p: 3,
                              borderRadius: 4,
                              border: "2px solid #ff9800",
                              mb: 2,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "warning.main",
                              }}
                            >
                              LLM Text Validation Task
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              Create AI-powered tasks that validate student text
                              answers using GPT-4o
                            </Typography>
                          </Box>

                          {/* Criteria for Evaluation */}
                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, mb: 2 }}
                            >
                              Criteria for Evaluation
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 2 }}
                            >
                              Define the criteria that the AI will use to
                              evaluate student answers. Students must address
                              all criteria to pass.
                            </Typography>

                            {/* Existing Parameters */}
                            {(
                              task.llmTextValidation?.validationParameters || []
                            ).map((param, paramIdx) => (
                              <Box
                                key={paramIdx}
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  mb: 1,
                                  alignItems: "center",
                                }}
                              >
                                <TextField
                                  fullWidth
                                  label={`Parameter ${paramIdx + 1}`}
                                  value={param}
                                  onChange={(e) => {
                                    const newParams = [
                                      ...(task.llmTextValidation
                                        ?.validationParameters || []),
                                    ];
                                    newParams[paramIdx] = e.target.value;
                                    handleTaskChange(
                                      taskIdx,
                                      "llmTextValidation",
                                      {
                                        ...task.llmTextValidation,
                                        validationParameters: newParams,
                                      }
                                    );
                                  }}
                                  placeholder="e.g., Provide 3 examples, Explain the concept clearly, Include code snippets"
                                  sx={{ borderRadius: 2 }}
                                />
                                <IconButton
                                  onClick={() => {
                                    const newParams = (
                                      task.llmTextValidation
                                        ?.validationParameters || []
                                    ).filter((_, idx) => idx !== paramIdx);
                                    handleTaskChange(
                                      taskIdx,
                                      "llmTextValidation",
                                      {
                                        ...task.llmTextValidation,
                                        validationParameters: newParams,
                                      }
                                    );
                                  }}
                                  sx={{
                                    color: "#f44336",
                                    "&:hover": { backgroundColor: "#ffebee" },
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            ))}

                            {/* Add Parameter Button */}
                            <Button
                              variant="contained"
                              onClick={() => {
                                const newParams = [
                                  ...(task.llmTextValidation
                                    ?.validationParameters || []),
                                  "",
                                ];
                                handleTaskChange(taskIdx, "llmTextValidation", {
                                  ...task.llmTextValidation,
                                  validationParameters: newParams,
                                });
                              }}
                              startIcon={<AddIcon />}
                              sx={{ ...STYLES.button.addParameterButton, mt: 1 }}
                            >
                              Add Parameter
                            </Button>
                          </Box>

                          {/* Advanced Settings */}
                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, mb: 2 }}
                            >
                              Advanced Settings (Optional)
                            </Typography>

                            <TextField
                              label="Temperature"
                              type="number"
                              value={task.llmTextValidation?.temperature || 0.1}
                              onChange={(e) =>
                                handleTaskChange(taskIdx, "llmTextValidation", {
                                  ...task.llmTextValidation,
                                  temperature:
                                    parseFloat(e.target.value) || 0.1,
                                })
                              }
                              helperText="AI creativity level (0.0-1.0)"
                              inputProps={{ min: 0, max: 1, step: 0.1 }}
                              sx={{
                                "& .MuiOutlinedInput-root": { borderRadius: 2 },
                              }}
                            />

                            {/* Info box for temperature */}
                            <Alert
                              severity="info"
                              sx={{
                                mt: 1,
                                mb: 2,
                                borderRadius: 4,
                                "& .MuiAlert-icon": {
                                  display: "none",
                                },
                              }}
                            >
                              <AlertTitle>Temperature Control</AlertTitle>
                              Controls how creative vs. consistent the AI is
                              when evaluating answers. Lower values (0.0-0.3)
                              make responses more consistent and focused. Higher
                              values (0.7-1.0) allow more creative
                              interpretation but may be less predictable.
                            </Alert>

                            {/* Detailed Feedback Toggle */}
                            <Box sx={{ mt: 1 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={
                                      task.llmTextValidation
                                        ?.enableDetailedFeedback || false
                                    }
                                    onChange={(e) =>
                                      handleTaskChange(
                                        taskIdx,
                                        "llmTextValidation",
                                        {
                                          ...task.llmTextValidation,
                                          enableDetailedFeedback:
                                            e.target.checked,
                                        }
                                      )
                                    }
                                  />
                                }
                                label="Enable detailed feedback"
                                sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      )}

                      {task.taskType === "collect-info" && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Box
                            sx={{
                              backgroundColor: "#e8f5e8",
                              p: 3,
                              borderRadius: 4,
                              border: "2px solid #4caf50",
                              mb: 2,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "#2e7d32",
                              }}
                            >
                              📝 Collect Information Task
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              Create non-graded tasks that collect information from students. 
                              Any response will be accepted and stored for later reference.
                            </Typography>
                          </Box>

                          {/* Save validated data per-user */}
                          <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.saveValidatedData !== false}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "saveValidatedData",
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label="Save collected information for later tasks"
                              sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                            />
                            {task.saveValidatedData !== false && (
                              <>
                                <TextField
                                  label="Data Name"
                                  value={task.savedDataName || "collected_info"}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      taskIdx,
                                      "savedDataName",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., collected_info"
                                  fullWidth
                                  helperText="Unique key to reference this collected information in future tasks"
                                  sx={{ mt: 1, borderRadius: 2 }}
                                />
                                <Alert
                                  severity="info"
                                  sx={{
                                    mt: 1,
                                    borderRadius: 4,
                                    "& .MuiAlert-icon": { display: "none" },
                                  }}
                                >
                                  <AlertTitle>Per-user Storage</AlertTitle>
                                  When enabled, the information collected from students is saved for each student separately.
                                  The value is stored as text and can be referenced in future tasks using the data name.
                                </Alert>
                              </>
                            )}
                          </Box>
                        </Box>
                      )}

                      <Divider sx={{ my: 2 }} />

                      {/* Hints Section */}
                      <Box sx={{ mb: 4 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "primary.main", mb: 1 }}
                        >
                          Hints
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          Add progressive hints that students can access by
                          typing "help" in issue comments. Each hint costs
                          points.
                        </Typography>

                        {(task.detailedHints || []).map((hint, hintIdx) => (
                          <Card
                            key={hintIdx}
                            sx={{
                              border: "1px solid #e0e0e0",
                              borderRadius: 4,
                              boxShadow: "none",
                              p: 2,
                              mb: 2,
                              backgroundColor: "#f9f9fa",
                            }}
                          >
                            <Stack spacing={2}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 700 }}
                                >
                                  Hint {hintIdx + 1}
                                </Typography>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    handleRemoveHint(
                                      editingQuestIndex || 0,
                                      taskIdx,
                                      hintIdx
                                    )
                                  }
                                  sx={{ borderRadius: 2 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>

                              <TextField
                                label="Hint Content"
                                value={hint.content || ""}
                                onChange={(e) =>
                                  handleUpdateHint(
                                    editingQuestIndex || 0,
                                    taskIdx,
                                    hintIdx,
                                    "content",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter the hint content that will be shown to students"
                                fullWidth
                                multiline
                                rows={3}
                                helperText="This is the text that will be displayed when students request this hint"
                                sx={{ borderRadius: 2 }}
                              />

                              <TextField
                                label="Image URL (Optional)"
                                value={hint.image || ""}
                                onChange={(e) =>
                                  handleUpdateHint(
                                    editingQuestIndex || 0,
                                    taskIdx,
                                    hintIdx,
                                    "image",
                                    e.target.value
                                  )
                                }
                                placeholder="https://example.com/image.png"
                                fullWidth
                                helperText="Optional image URL to accompany the hint"
                                sx={{ borderRadius: 2 }}
                              />

                              <TextField
                                label="Penalty (Points)"
                                type="number"
                                value={hint.penalty || 0}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                                  if (value < 0) {
                                    // Prevent setting penalty below 0
                                    return;
                                  }
                                  handleUpdateHint(
                                    editingQuestIndex || 0,
                                    taskIdx,
                                    hintIdx,
                                    "penalty",
                                    value
                                  );
                                }}
                                inputProps={{ min: 0 }}
                                sx={{ width: 150, borderRadius: 2 }}
                                helperText="Points deducted when this hint is used (Min: 0)"
                              />
                            </Stack>
                          </Card>
                        ))}

                        <Button
                          variant="contained"
                          startIcon={<AddCircleOutlineIcon />}
                          onClick={() =>
                            handleAddHint(editingQuestIndex || 0, taskIdx)
                          }
                          sx={{
                            ...STYLES.button.addHintButton,
                            mt: 0.5,
                            mr: 1,
                          }}
                        >
                          Add Hint
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AutoAwesomeIcon />}
                          onClick={async () => {
                            try {
                              const payload = {
                                type: task.taskType,
                                desc: task.taskDesc,
                                accept: task.acceptText,
                                repository: task.repository,
                                ossRepository: task.ossRepository,
                                issueNumber: task.issueNumber,
                                responsePath: task.responsePath,
                                expectedAnswerType: task.expectedAnswerType,
                                llmTextValidation: task.llmTextValidation,
                              };
                              const { data } = await axios.post(
                                `${API_BASE_URL}/api/group/${classId}/ai/generate-hint`,
                                payload,
                                {
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                }
                              );
                              const aiHint =
                                data && data.data && data.data.hint
                                  ? data.data.hint
                                  : "Try focusing on the key requirement and the relevant tab in the repository.";
                              handleAddHint(editingQuestIndex || 0, taskIdx);
                              const newIdx = task.detailedHints?.length || 0;
                              handleUpdateHint(
                                editingQuestIndex || 0,
                                taskIdx,
                                newIdx - 1,
                                "content",
                                aiHint
                              );
                            } catch (e) {
                              console.error("AI hint generation failed:", e);
                              alert(
                                "Failed to generate hint. Please try again."
                              );
                            }
                          }}
                          sx={{
                            ...STYLES.button.generateHintButton,
                            mt: 0.5,
                          }}
                        >
                          Generate hint with AI
                        </Button>
                      </Box>

                      <Divider />

                      {/* Success and Error Text Fields */}
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                        >
                          Response Text
                        </Typography>

                        <TextField
                          label="Success Text (Correct Answer Response)"
                          value={task.successText}
                          onChange={(e) =>
                            handleTaskChange(
                              taskIdx,
                              "successText",
                              e.target.value
                            )
                          }
                          placeholder="This text appears when students answer correctly"
                          fullWidth
                          multiline
                          rows={3}
                          helperText="Use {points} as a placeholder for the points value"
                          sx={{ mb: 2, borderRadius: 2 }}
                        />

                        <TextField
                          label="Error Text (Incorrect Answer Response)"
                          value={task.errorText}
                          onChange={(e) =>
                            handleTaskChange(
                              taskIdx,
                              "errorText",
                              e.target.value
                            )
                          }
                          placeholder="This text appears when students answer incorrectly"
                          fullWidth
                          multiline
                          rows={3}
                          helperText="Should provide helpful hints and guidance"
                          sx={{ borderRadius: 2 }}
                        />
                      </Box>
                    </Stack>
                  </Card>
                ))}

                {/* Add Task Button - Only show when adding new quests */}
                {editingQuestIndex === null && (
                  <Button
                    variant="outlined"
                    onClick={handleAddTaskToQuest}
                    startIcon={<AddIcon />}
                    sx={{
                      borderRadius: 4,
                      fontWeight: "bold",
                      borderColor: "primary.main",
                      color: "primary.main",
                      "&:hover": {
                        borderColor: "primary.dark",
                        backgroundColor: "#e3f2fd",
                      },
                    }}
                  >
                    Add Task
                  </Button>
                )}
              </Box>
                </>
              )}
            </Stack>
          </DialogContent>
          
          {/* Hint Penalty Validation Errors */}
          {hasHintPenaltyErrors && (
            <Box sx={{ p: 3, pt: 0 }}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                <AlertTitle>Invalid Hint Penalties</AlertTitle>
                <Typography variant="body2" component="div">
                  The following tasks have hint penalties that exceed the task points:
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                  {hintPenaltyErrors.map((error, index) => (
                    <Typography key={index} component="li" variant="body2">
                      {error}
                    </Typography>
                  ))}
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Please reduce hint penalties or increase task points to continue.
                </Typography>
              </Alert>
            </Box>
          )}
          
          <DialogActions sx={{ p: 3, pt: 2, borderTop: "1px solid #e0e0e0" }}>
            <Button
              onClick={() => setShowAddQuestModal(false)}
              sx={{
                borderRadius: 4,
                fontWeight: "bold",
                px: 3,
                py: 1,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddQuest}
              variant="contained"
              disabled={isAddQuestDisabled}
              sx={{
                bgcolor: "#4caf50",
                fontWeight: "bold",
                px: 4,
                borderRadius: 4,
                boxShadow: "none",
                "&:hover": { bgcolor: "#388e3c", boxShadow: "none" },
              }}
            >
              {editingQuestIndex !== null ? "Save Changes" : "Add New Quest"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Task Modal */}
        <Dialog
          open={showEditTaskModal}
          onClose={(event, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            setShowEditTaskModal(false);
            setEditingTaskData(null);
            setEditingTaskQuestIndex(null);
            setEditingTaskId(null);
          }}
          disableEscapeKeyDown
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid #e0e0e0",
              pb: 2,
              mb: 0,
            }}
          >
            <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
              Edit Task
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {editingTaskData && (
              <Stack spacing={4}>
                {/* Task Basic Info */}
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                  >
                    Task Information
                  </Typography>

                  <TextField
                    label="Task Title"
                    value={editingTaskData.taskDesc || ""}
                    onChange={(e) =>
                      setEditingTaskData({
                        ...editingTaskData,
                        taskDesc: e.target.value,
                      })
                    }
                    placeholder="e.g., Understanding GitHub Issues"
                    fullWidth
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    label="Quest Notes (not displayed to student)"
                    value={editingTaskData.questNotes || ""}
                    onChange={(e) =>
                      setEditingTaskData({
                        ...editingTaskData,
                        questNotes: e.target.value,
                      })
                    }
                    placeholder="Internal notes about this task"
                    fullWidth
                    multiline
                    rows={2}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    label="Points/XP"
                    type="number"
                    value={editingTaskData.points || 0}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                      if (value < 0) return;
                      setEditingTaskData({
                        ...editingTaskData,
                        points: value,
                        xp: value, // Keep XP in sync with points
                      });
                    }}
                    inputProps={{ min: 0 }}
                    sx={{ width: 200 }}
                    helperText="Points and XP are the same value (Min: 0)"
                  />
                </Box>

                <Divider />

                {/* Task Type Specific Fields */}
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                  >
                    Task Configuration
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <TaskTypeCategoryPicker
                      value={editingTaskData?.taskType || "multiple-choice"}
                      onChange={(v) => {
                        console.log(
                          `🔄 [TASK-EDIT] Changing task type from "${editingTaskData?.taskType}" to "${v}"`
                        );
                        setEditingTaskData((prev) => ({
                          ...prev,
                          taskType: v,
                        }));
                      }}
                      includeRepository
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Question Text Field - Hidden for MCQ tasks */}
                  {editingTaskData.taskType !== "multiple-choice" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: "primary.main",
                        }}
                      >
                        Question Text
                      </Typography>
                      <TextEditor
                        value={editingTaskData.acceptText || ""}
                        onChange={(value) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            acceptText: value,
                          })
                        }
                        label="Question Text"
                        placeholder="This text appears when the task is first presented to students"
                        helperText="This is the main question text. You can use markdown formatting with live preview."
                        acceptFileTypes=".txt,.md,.markdown,text/plain,text/markdown"
                      />
                    </Box>
                  )}

                  {/* Multiple Choice-specific Question Field */}
                  {editingTaskData.taskType === "multiple-choice" && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Multiple Choice Question
                      </Typography>
                      <TextField
                        label="Question"
                        value={editingTaskData.question || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            question: e.target.value,
                          })
                        }
                        placeholder="Enter your multiple choice question here"
                        fullWidth
                        multiline
                        rows={2}
                        helperText="The actual question that will be displayed to students"
                        sx={{ mb: 2 }}
                      />
                    </Box>
                  )}

                  {/* Multiple Choice Options */}
                  {editingTaskData.taskType === "multiple-choice" && (
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Multiple Choice Options
                      </Typography>
                      
                      {/* Options List */}
                      {editingTaskData.options?.map((option, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                          <TextField
                            label={`Option ${option.label}`}
                            value={option.value}
                            onChange={(e) => {
                              const newOptions = [...editingTaskData.options];
                              newOptions[index].value = e.target.value;
                              setEditingTaskData({
                                ...editingTaskData,
                                options: newOptions,
                              });
                            }}
                            fullWidth
                          />
                          {/* Delete button - show only if more than 2 options and not A or B */}
                          {editingTaskData.options.length > 2 && index >= 2 && (
                            <IconButton
                              onClick={() => {
                                const newOptions = [...editingTaskData.options];
                                newOptions.splice(index, 1);
                                
                                // Update correct answer if it was the deleted option
                                let newCorrectAnswer = editingTaskData.correctAnswer;
                                if (editingTaskData.correctAnswer === option.label) {
                                  newCorrectAnswer = "A"; // Default to A if deleted option was selected
                                }
                                
                                setEditingTaskData({
                                  ...editingTaskData,
                                  options: newOptions,
                                  correctAnswer: newCorrectAnswer,
                                });
                              }}
                              color="error"
                              sx={{ mt: 1 }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                      
                      {/* Add Option Button */}
                      {editingTaskData.options?.length < 26 && (
                        <Button
                          onClick={() => {
                            const nextLetter = String.fromCharCode(65 + editingTaskData.options.length); // A=65, B=66, etc.
                            const newOptions = [
                              ...editingTaskData.options,
                              { label: nextLetter, value: "" }
                            ];
                            setEditingTaskData({
                              ...editingTaskData,
                              options: newOptions,
                            });
                          }}
                          startIcon={<span>+</span>}
                          variant="outlined"
                          sx={{ mb: 2 }}
                        >
                          Add Option {String.fromCharCode(65 + editingTaskData.options?.length)}
                        </Button>
                      )}
                      
                      {/* Correct Answer Dropdown */}
                      <FormControl sx={{ width: 200 }}>
                        <InputLabel>Correct Answer</InputLabel>
                        <Select
                          value={editingTaskData.correctAnswer || "A"}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              correctAnswer: e.target.value,
                            })
                          }
                          label="Correct Answer"
                        >
                          {editingTaskData.options?.map((option) => (
                            <MenuItem key={option.label} value={option.label}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}

                  {/* GitHub Repo Configuration */}
                  {["get-issue-count", "get-pr-count", "get-top-contributor", "get-open-issue", "get-issue-title"].includes(editingTaskData.taskType) && (
                    <Box
                      sx={{
                        backgroundColor: "#f0f8ff",
                        p: 3,
                        borderRadius: 4,
                        border: "2px solid #1976d2",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          color: "#1565c0",
                          mb: 2,
                        }}
                      >
                        🔗 GitHub Repo Configuration
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          mb: 2,
                        }}
                      >
                        {editingTaskData.taskType === "get-issue-count" &&
                          "Issue Count Task"}
                        {editingTaskData.taskType === "get-pr-count" &&
                          "Pull Request Count Task"}
                        {editingTaskData.taskType === "get-top-contributor" &&
                          "Top Contributor Task"}
                        {editingTaskData.taskType === "get-open-issue" &&
                          "Open Issue Count Task"}
                        {editingTaskData.taskType === "get-issue-title" &&
                          "Issue Title Task"}
                      </Typography>

                      <TextField
                        label="Repository (owner/repo)"
                        value={editingTaskData.repository || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            repository: e.target.value,
                          })
                        }
                        placeholder="e.g., microsoft/vscode"
                        fullWidth
                        helperText="Format: owner/repository-name"
                        sx={{ borderRadius: 2 }}
                      />

                      {editingTaskData.taskType === "get-issue-count" && (
                        <Box sx={{ mt: 2 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={editingTaskData.saveValidatedData || false}
                                onChange={(e) =>
                                  setEditingTaskData({
                                    ...editingTaskData,
                                    saveValidatedData: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Save validated data for later tasks"
                            sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                          />
                          {editingTaskData.saveValidatedData && (
                            <>
                              <TextField
                                label="Data Name"
                                value={editingTaskData.savedDataName || ""}
                                onChange={(e) =>
                                  setEditingTaskData({
                                    ...editingTaskData,
                                    savedDataName: e.target.value,
                                  })
                                }
                                placeholder="e.g., issue_count"
                                fullWidth
                                helperText="Unique key to reference this data in future tasks"
                                sx={{ mt: 1, borderRadius: 2 }}
                              />
                              <Alert
                                severity="info"
                                sx={{
                                  mt: 1,
                                  borderRadius: 4,
                                  "& .MuiAlert-icon": { display: "none" },
                                }}
                              >
                                <AlertTitle>Per-user Storage</AlertTitle>
                                When enabled, the validated answer is saved for each student separately.
                                The value is automatically stored as a number or text based on the expected answer type.
                              </Alert>
                            </>
                          )}
                        </Box>
                      )}

                      {editingTaskData.taskType === "get-issue-title" && (
                        <TextField
                          label="Issue Number"
                          value={editingTaskData.issueNumber || ""}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              issueNumber: e.target.value,
                            })
                          }
                          placeholder="123"
                          sx={{ mt: 2, width: 150 }}
                        />
                      )}
                    </Box>
                  )}

                  {/* Custom API Call Configuration */}
                  {editingTaskData.taskType === "custom-api-call" && (
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Custom API Call Configuration
                      </Typography>
                      <TextField
                        label="API Endpoint"
                        value={editingTaskData.apiEndpoint || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            apiEndpoint: e.target.value,
                          })
                        }
                        placeholder="https://api.example.com/data"
                        fullWidth
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="Response Path"
                        value={editingTaskData.responsePath || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            responsePath: e.target.value,
                          })
                        }
                        placeholder="data.count"
                        fullWidth
                        sx={{ mb: 2 }}
                      />
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Expected Answer Type</InputLabel>
                        <Select
                          value={editingTaskData.expectedAnswerType || "Number"}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              expectedAnswerType: e.target.value,
                            })
                          }
                          label="Expected Answer Type"
                        >
                          <MenuItem value="Number">Number</MenuItem>
                          <MenuItem value="String">String</MenuItem>
                          <MenuItem value="Boolean">Boolean</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editingTaskData.enableTolerance || false}
                            onChange={(e) =>
                              setEditingTaskData({
                                ...editingTaskData,
                                enableTolerance: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Enable Tolerance Range"
                      />
                      {editingTaskData.enableTolerance && (
                        <TextField
                          label="Tolerance Range (%)"
                          type="number"
                          value={editingTaskData.toleranceRange || 10}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              toleranceRange: parseInt(e.target.value) || 10,
                            })
                          }
                          sx={{ width: 150, ml: 2 }}
                        />
                      )}
                      <Box sx={{ mt: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.saveValidatedData || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  saveValidatedData: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Save validated data for later tasks"
                          sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                        />
                        {editingTaskData.saveValidatedData && (
                          <>
                            <TextField
                              label="Data Name"
                              value={editingTaskData.savedDataName || ""}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  savedDataName: e.target.value,
                                })
                              }
                              placeholder="e.g., repo_issue_count"
                              fullWidth
                              sx={{ mt: 1 }}
                              helperText="Unique key to reference this saved value in future tasks"
                            />
                            <Alert
                              severity="info"
                              sx={{
                                mt: 1,
                                borderRadius: 4,
                                "& .MuiAlert-icon": { display: "none" },
                              }}
                            >
                              <AlertTitle>Per-user Storage</AlertTitle>
                              When enabled, the validated answer is saved for each student separately.
                              The value is automatically stored as a number or text based on the expected answer type.
                            </Alert>
                          </>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* LLM Text Validation Configuration */}
                  {editingTaskData.taskType === "llm-text-validation" && (
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        LLM Text Validation Configuration
                      </Typography>
                      <TextField
                        label="Validation Question"
                        value={editingTaskData.llmTextValidation?.question || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            llmTextValidation: {
                              ...editingTaskData.llmTextValidation,
                              question: e.target.value,
                            },
                          })
                        }
                        placeholder="What should be validated in the student's response?"
                        fullWidth
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                      />
                      
                      <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                        Validation Parameters
                      </Typography>
                      {(editingTaskData.llmTextValidation?.validationParameters || []).map((param, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <TextField
                            label="Parameter"
                            value={param}
                            onChange={(e) => {
                              const newParams = [...(editingTaskData.llmTextValidation?.validationParameters || [])];
                              newParams[index] = e.target.value;
                              setEditingTaskData({
                                ...editingTaskData,
                                llmTextValidation: {
                                  ...editingTaskData.llmTextValidation,
                                  validationParameters: newParams,
                                },
                              });
                            }}
                            fullWidth
                          />
                          <IconButton 
                            onClick={() => {
                              const newParams = [...(editingTaskData.llmTextValidation?.validationParameters || [])];
                              newParams.splice(index, 1);
                              setEditingTaskData({
                                ...editingTaskData,
                                llmTextValidation: {
                                  ...editingTaskData.llmTextValidation,
                                  validationParameters: newParams,
                                },
                              });
                            }}
                            color="error"
                          >
                            ✕
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        variant="contained"
                        onClick={() => {
                          const newParams = [...(editingTaskData.llmTextValidation?.validationParameters || []), ""];
                          setEditingTaskData({
                            ...editingTaskData,
                            llmTextValidation: {
                              ...editingTaskData.llmTextValidation,
                              validationParameters: newParams,
                            },
                          });
                        }}
                        startIcon={<AddIcon />}
                        sx={{ ...STYLES.button.addParameterButton, mb: 2 }}
                      >
                        Add Parameter
                      </Button>

                      <TextField
                        label="Temperature"
                        type="number"
                        value={editingTaskData.llmTextValidation?.temperature || 0.1}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            llmTextValidation: {
                              ...editingTaskData.llmTextValidation,
                              temperature: parseFloat(e.target.value) || 0.1,
                            },
                          })
                        }
                        inputProps={{ min: 0, max: 2, step: 0.1 }}
                        sx={{ width: 150, mb: 2 }}
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editingTaskData.llmTextValidation?.enableDetailedFeedback || false}
                            onChange={(e) =>
                              setEditingTaskData({
                                ...editingTaskData,
                                llmTextValidation: {
                                  ...editingTaskData.llmTextValidation,
                                  enableDetailedFeedback: e.target.checked,
                                },
                              })
                            }
                          />
                        }
                        label="Enable Detailed Feedback"
                        sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                      />
                    </Box>
                  )}

                  {/* Hints Section */}
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "primary.main", mb: 1 }}
                    >
                      Hints
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Add progressive hints that students can access by
                      typing "help" in issue comments. Each hint costs
                      points.
                    </Typography>

                    {(editingTaskData.detailedHints || []).map((hint, hintIdx) => (
                      <Card
                        key={hintIdx}
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 4,
                          boxShadow: "none",
                          p: 2,
                          mb: 2,
                          backgroundColor: "#f9f9fa",
                        }}
                      >
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 700 }}
                            >
                              Hint {hintIdx + 1}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                const newHints = [...(editingTaskData.detailedHints || [])];
                                newHints.splice(hintIdx, 1);
                                setEditingTaskData({
                                  ...editingTaskData,
                                  detailedHints: newHints,
                                });
                              }}
                              sx={{ borderRadius: 2 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          <TextField
                            label="Hint Content"
                            value={hint.content || ""}
                            onChange={(e) => {
                              const newHints = [...(editingTaskData.detailedHints || [])];
                              newHints[hintIdx] = {
                                ...newHints[hintIdx],
                                content: e.target.value,
                              };
                              setEditingTaskData({
                                ...editingTaskData,
                                detailedHints: newHints,
                              });
                            }}
                            placeholder="Enter the hint content that will be shown to students"
                            fullWidth
                            multiline
                            rows={3}
                            helperText="This is the text that will be displayed when students request this hint"
                            sx={{ borderRadius: 2 }}
                          />

                          <TextField
                            label="Image URL (Optional)"
                            value={hint.image || ""}
                            onChange={(e) => {
                              const newHints = [...(editingTaskData.detailedHints || [])];
                              newHints[hintIdx] = {
                                ...newHints[hintIdx],
                                image: e.target.value,
                              };
                              setEditingTaskData({
                                ...editingTaskData,
                                detailedHints: newHints,
                              });
                            }}
                            placeholder="https://example.com/image.png"
                            fullWidth
                            helperText="Optional image URL to accompany the hint"
                            sx={{ borderRadius: 2 }}
                          />

                          <TextField
                            label="Penalty (Points)"
                            type="number"
                            value={hint.penalty || 0}
                            onChange={(e) => {
                              const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                              if (value < 0) return;
                              const newHints = [...(editingTaskData.detailedHints || [])];
                              newHints[hintIdx] = {
                                ...newHints[hintIdx],
                                penalty: value,
                              };
                              setEditingTaskData({
                                ...editingTaskData,
                                detailedHints: newHints,
                              });
                            }}
                            inputProps={{ min: 0 }}
                            sx={{ width: 150, borderRadius: 2 }}
                            helperText="Points deducted when this hint is used (Min: 0)"
                          />
                        </Stack>
                      </Card>
                    ))}

                    <Button
                      variant="contained"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={() => {
                        const newHints = [...(editingTaskData.detailedHints || []), {
                          content: "",
                          image: "",
                          penalty: 0,
                        }];
                        setEditingTaskData({
                          ...editingTaskData,
                          detailedHints: newHints,
                        });
                      }}
                      sx={{
                        ...STYLES.button.addHintButton,
                        mt: 0.5,
                        mr: 1,
                      }}
                    >
                      Add Hint
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={async () => {
                        try {
                          const payload = {
                            type: editingTaskData.taskType,
                            desc: editingTaskData.taskDesc,
                            accept: editingTaskData.acceptText,
                            repository: editingTaskData.repository,
                            ossRepository: editingTaskData.repository,
                            issueNumber: editingTaskData.issueNumber,
                            responsePath: editingTaskData.responsePath,
                            expectedAnswerType: editingTaskData.expectedAnswerType,
                            llmTextValidation: editingTaskData.llmTextValidation,
                          };
                          const { data } = await axios.post(
                            `${API_BASE_URL}/api/group/${classId}/ai/generate-hint`,
                            payload,
                            {
                              headers: {
                                "Content-Type": "application/json",
                              },
                            }
                          );
                          const aiHint =
                            data && data.data && data.data.hint
                              ? data.data.hint
                              : "Try focusing on the key requirement and the relevant tab in the repository.";
                          
                          // Add the AI-generated hint
                          const newHints = [...(editingTaskData.detailedHints || []), {
                            content: aiHint,
                            image: "",
                            penalty: 0,
                          }];
                          setEditingTaskData({
                            ...editingTaskData,
                            detailedHints: newHints,
                          });
                        } catch (e) {
                          console.error("AI hint generation failed:", e);
                          alert(
                            "Failed to generate hint. Please try again."
                          );
                        }
                      }}
                      sx={{
                        ...STYLES.button.generateHintButton,
                        mt: 0.5,
                      }}
                    >
                      Generate hint with AI
                    </Button>
                  </Box>

                  {/* Task Type Specific Fields */}
                  {editingTaskData.taskType === "quiz" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "secondary.main" }}
                      >
                        Multi-Question Quiz
                      </Typography>
                      
                      {(editingTaskData.questions || []).map((question, qIdx) => (
                        <Card
                          key={qIdx}
                          sx={{
                            border: "1px solid #e0e0e0",
                            borderRadius: 4,
                            boxShadow: "none",
                            p: 2,
                            mb: 2,
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          <Stack spacing={2}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                Question {qIdx + 1}
                              </Typography>
                              {(editingTaskData.questions || []).length > 1 && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    const newQuestions = [...(editingTaskData.questions || [])];
                                    newQuestions.splice(qIdx, 1);
                                    setEditingTaskData({
                                      ...editingTaskData,
                                      questions: newQuestions,
                                    });
                                  }}
                                  sx={{ borderRadius: 2 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>

                            <TextField
                              label="Question"
                              value={question.question || ""}
                              onChange={(e) => {
                                const newQuestions = [...(editingTaskData.questions || [])];
                                newQuestions[qIdx] = {
                                  ...newQuestions[qIdx],
                                  question: e.target.value,
                                };
                                setEditingTaskData({
                                  ...editingTaskData,
                                  questions: newQuestions,
                                });
                              }}
                              placeholder="Enter your question here"
                              fullWidth
                              multiline
                              rows={2}
                              sx={{ borderRadius: 2 }}
                            />

                            <TextField
                              label="Option A"
                              value={question.optionA || ""}
                              onChange={(e) => {
                                const newQuestions = [...(editingTaskData.questions || [])];
                                newQuestions[qIdx] = {
                                  ...newQuestions[qIdx],
                                  optionA: e.target.value,
                                };
                                setEditingTaskData({
                                  ...editingTaskData,
                                  questions: newQuestions,
                                });
                              }}
                              fullWidth
                              sx={{ borderRadius: 2 }}
                            />

                            <TextField
                              label="Option B"
                              value={question.optionB || ""}
                              onChange={(e) => {
                                const newQuestions = [...(editingTaskData.questions || [])];
                                newQuestions[qIdx] = {
                                  ...newQuestions[qIdx],
                                  optionB: e.target.value,
                                };
                                setEditingTaskData({
                                  ...editingTaskData,
                                  questions: newQuestions,
                                });
                              }}
                              fullWidth
                              sx={{ borderRadius: 2 }}
                            />

                            <TextField
                              label="Option C"
                              value={question.optionC || ""}
                              onChange={(e) => {
                                const newQuestions = [...(editingTaskData.questions || [])];
                                newQuestions[qIdx] = {
                                  ...newQuestions[qIdx],
                                  optionC: e.target.value,
                                };
                                setEditingTaskData({
                                  ...editingTaskData,
                                  questions: newQuestions,
                                });
                              }}
                              fullWidth
                              sx={{ borderRadius: 2 }}
                            />

                            <TextField
                              label="Option D"
                              value={question.optionD || ""}
                              onChange={(e) => {
                                const newQuestions = [...(editingTaskData.questions || [])];
                                newQuestions[qIdx] = {
                                  ...newQuestions[qIdx],
                                  optionD: e.target.value,
                                };
                                setEditingTaskData({
                                  ...editingTaskData,
                                  questions: newQuestions,
                                });
                              }}
                              fullWidth
                              sx={{ borderRadius: 2 }}
                            />
                          </Stack>
                        </Card>
                      ))}

                      <Button
                        variant="outlined"
                        onClick={() => {
                          const newQuestions = [...(editingTaskData.questions || []), {
                            question: "",
                            optionA: "",
                            optionB: "",
                            optionC: "",
                            optionD: "",
                          }];
                          setEditingTaskData({
                            ...editingTaskData,
                            questions: newQuestions,
                          });
                        }}
                        sx={{ mt: 1, borderRadius: 4 }}
                      >
                        Add Question
                      </Button>
                    </Box>
                  )}



                  {/* Assignment Validation Task Fields */}
                  {editingTaskData.taskType === "assigned" && (
                    <Box>
                      <Divider sx={{ mb: 2 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: "secondary.main",
                        }}
                      >
                        Assignment Validation Task
                      </Typography>

                      <TextField
                        label="Repository (owner/repo)"
                        value={editingTaskData.repository || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            repository: e.target.value,
                          })
                        }
                        placeholder="e.g., microsoft/vscode"
                        fullWidth
                        helperText="Format: owner/repository-name"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Issue Number"
                        type="number"
                        value={editingTaskData.issueNumber || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            issueNumber: e.target.value,
                          })
                        }
                        placeholder="e.g., 123"
                        fullWidth
                        helperText="The specific issue number students must be assigned to"
                        sx={{ borderRadius: 2 }}
                      />
                    </Box>
                  )}

                  {/* Comment Validation Task Fields */}
                  {editingTaskData.taskType === "comment" && (
                    <Box>
                      <Divider sx={{ mb: 2 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: "secondary.main",
                        }}
                      >
                        Comment Validation Task
                      </Typography>

                      <TextField
                        label="Repository (owner/repo)"
                        value={editingTaskData.repository || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            repository: e.target.value,
                          })
                        }
                        placeholder="e.g., microsoft/vscode"
                        fullWidth
                        helperText="Format: owner/repository-name"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Issue Number"
                        type="number"
                        value={editingTaskData.issueNumber || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            issueNumber: e.target.value,
                          })
                        }
                        placeholder="e.g., 123"
                        fullWidth
                        helperText="The specific issue number where students should post a comment"
                        sx={{ borderRadius: 2 }}
                      />
                    </Box>
                  )}

                  {/* Issue Number Task Fields */}
                  {editingTaskData.taskType === "issue-no" && (
                    <Box>
                      <Divider sx={{ mb: 2 }} />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: "secondary.main",
                        }}
                      >
                        Issue Number Validation Task
                      </Typography>

                      <TextField
                        label="Repository (owner/repo)"
                        value={editingTaskData.repository || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            repository: e.target.value,
                          })
                        }
                        placeholder="e.g., microsoft/vscode"
                        fullWidth
                        helperText="Format: owner/repository-name"
                        sx={{ borderRadius: 2 }}
                      />

                      <Box sx={{ mt: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.saveValidatedData || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  saveValidatedData: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Save validated data per user"
                          sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                        />
                        {editingTaskData.saveValidatedData && (
                          <>
                            <TextField
                              label="Data Name"
                              value={editingTaskData.savedDataName || ""}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  savedDataName: e.target.value,
                                })
                              }
                              placeholder="e.g., provided_issue_number"
                              fullWidth
                              helperText="Key used to store this value in each student's data."
                              sx={{ mt: 1, borderRadius: 2 }}
                            />
                            <Alert
                              severity="info"
                              sx={{
                                mt: 1,
                                borderRadius: 4,
                                "& .MuiAlert-icon": { display: "none" },
                              }}
                            >
                              <AlertTitle>Per-user Storage</AlertTitle>
                              When enabled, the student-provided issue
                              number is saved for each student separately.
                              The value is stored as a number.
                            </Alert>
                          </>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Custom API Call Task Fields - consolidated above; duplicate removed */}

                  {/* LLM Text Validation Task Fields */}
                  {editingTaskData.taskType === "llm-text-validation" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "secondary.main" }}
                      >
                        LLM Text Validation Configuration
                      </Typography>

                      <TextField
                        label="Validation Question"
                        value={editingTaskData.llmTextValidation?.question || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            llmTextValidation: {
                              ...editingTaskData.llmTextValidation,
                              question: e.target.value,
                            },
                          })
                        }
                        placeholder="The question students must answer"
                        fullWidth
                        multiline
                        rows={3}
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Validation Parameters (one per line)"
                        value={(editingTaskData.llmTextValidation?.validationParameters || []).join('\n')}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            llmTextValidation: {
                              ...editingTaskData.llmTextValidation,
                              validationParameters: e.target.value.split('\n').filter(line => line.trim()),
                            },
                          })
                        }
                        placeholder="Enter validation criteria, one per line"
                        fullWidth
                        multiline
                        rows={3}
                        helperText="Each line becomes a validation criterion for the AI"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Temperature"
                        type="number"
                        value={editingTaskData.llmTextValidation?.temperature || 0.1}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            llmTextValidation: {
                              ...editingTaskData.llmTextValidation,
                              temperature: parseFloat(e.target.value) || 0.1,
                            },
                          })
                        }
                        inputProps={{ min: 0, max: 2, step: 0.1 }}
                        helperText="AI creativity level (0.1 = focused, 2.0 = creative)"
                        sx={{ mb: 2, width: 200 }}
                      />

                      <Box sx={{ mt: 0 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.llmTextValidation?.enableDetailedFeedback || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  llmTextValidation: {
                                    ...editingTaskData.llmTextValidation,
                                    enableDetailedFeedback: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                          label="Enable detailed feedback from AI validation"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Image Validation Task Fields */}
                  {editingTaskData.taskType === "imageValidation" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                      >
                        LLM Image Validation Configuration
                      </Typography>

                      <TextField
                        label="Validation Question"
                        value={editingTaskData.imageValidation?.question || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            imageValidation: {
                              ...editingTaskData.imageValidation,
                              question: e.target.value,
                            },
                          })
                        }
                        placeholder="What should be validated in the student's image submission?"
                        fullWidth
                        multiline
                        rows={3}
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Validation Parameters"
                        value={(editingTaskData.imageValidation?.validationParameters || []).join('\n')}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            imageValidation: {
                              ...editingTaskData.imageValidation,
                              validationParameters: e.target.value.split('\n').filter(line => line.trim()),
                            },
                          })
                        }
                        placeholder="Enter validation criteria, one per line&#10;e.g., Must show a use case diagram&#10;Must include actors and use cases&#10;Must have proper UML notation"
                        fullWidth
                        multiline
                        rows={4}
                        helperText="Each line becomes a validation criterion for the AI to check in the image"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Temperature"
                        type="number"
                        value={editingTaskData.imageValidation?.temperature || 0.1}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            imageValidation: {
                              ...editingTaskData.imageValidation,
                              temperature: parseFloat(e.target.value) || 0.1,
                            },
                          })
                        }
                        inputProps={{ min: 0, max: 2, step: 0.1 }}
                        helperText="AI creativity level (0.1 = focused, 2.0 = creative)"
                        sx={{ mb: 2, width: 200 }}
                      />

                      <Box sx={{ mt: 0 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.imageValidation?.enableDetailedFeedback || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  imageValidation: {
                                    ...editingTaskData.imageValidation,
                                    enableDetailedFeedback: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                          label="Enable detailed feedback from AI validation"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Validate Fork URL Task Fields */}
                  {editingTaskData.taskType === "validate-fork-url" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                      >
                        Fork URL Validation Configuration
                      </Typography>

                      <TextField
                        label="Repository To Be Stored (Required)"
                        value={editingTaskData.repositoryToBeStored || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            repositoryToBeStored: e.target.value,
                          })
                        }
                        placeholder="e.g., AnkurMali/IST597_Fall2019_TF2.0"
                        fullWidth
                        required
                        helperText="The upstream repository that students must fork (format: owner/repo)"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.requireOwnership !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  requireOwnership: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Require ownership verification (verify fork belongs to expected user)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.allowForkOfFork !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  allowForkOfFork: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Allow fork of fork (accept repositories forked from forks if source matches)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.saveValidatedData || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  saveValidatedData: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Save validated fork URL for use in subsequent tasks"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      {editingTaskData.saveValidatedData && (
                        <TextField
                          label="Saved Data Name"
                          value={editingTaskData.savedDataName || ""}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              savedDataName: e.target.value,
                            })
                          }
                          placeholder="e.g., studentForkRepo"
                          fullWidth
                          helperText="Custom key name for storing the fork URL (stores both 'key' and 'keyUrl')"
                          sx={{ mb: 2, borderRadius: 2 }}
                        />
                      )}
                    </Box>
                  )}

                  {/* Validate File Exists Task Fields */}
                  {editingTaskData.taskType === "validate-file-exists" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                      >
                        File Exists Validation Configuration
                      </Typography>

                      <TextField
                        label="Expected File Name (Optional)"
                        value={editingTaskData.expectedFileName || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            expectedFileName: e.target.value,
                          })
                        }
                        placeholder="e.g., CONTRIBUTING.md"
                        fullWidth
                        helperText="Leave empty to accept any file name"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Expected File Type (Optional)"
                        value={editingTaskData.expectedFileType || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            expectedFileType: e.target.value,
                          })
                        }
                        placeholder="e.g., .md or .pdf"
                        fullWidth
                        helperText="File extension to match (e.g., .md, .pdf, .py). Leave empty to accept any type."
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.saveValidatedData || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  saveValidatedData: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Save validated file URL for use in subsequent tasks"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      {editingTaskData.saveValidatedData && (
                        <TextField
                          label="Saved Data Name"
                          value={editingTaskData.savedDataName || ""}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              savedDataName: e.target.value,
                            })
                          }
                          placeholder="e.g., studentFileUrl"
                          fullWidth
                          helperText="Custom key name for storing the file URL (stores 'key', 'keyFileName', and 'keyFileType')"
                          sx={{ mb: 2, borderRadius: 2 }}
                        />
                      )}
                    </Box>
                  )}

                  {/* Validate PR URL Task Fields */}
                  {editingTaskData.taskType === "validate-pr-url" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                      >
                        PR URL Validation Configuration
                      </Typography>

                      <TextField
                        label="Target Repository (Required)"
                        value={editingTaskData.targetRepository || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            targetRepository: e.target.value,
                          })
                        }
                        placeholder="e.g., igorsteinmacher/CS499-OSS"
                        fullWidth
                        required
                        helperText="The repository the PR should target (base repo) - format: owner/repo"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Target Branch (Optional)"
                        value={editingTaskData.targetBranch || "main"}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            targetBranch: e.target.value,
                          })
                        }
                        placeholder="e.g., main"
                        fullWidth
                        helperText="The branch the PR should target (base branch). Defaults to 'main'"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Source Repository / OG Repo (Optional)"
                        value={editingTaskData.sourceRepository || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            sourceRepository: e.target.value,
                          })
                        }
                        placeholder="e.g., misanetc/CS499-OSS"
                        fullWidth
                        helperText="The fork/repo the PR should come from (head repo). Leave empty to accept PRs from any source (recommended for multi-student deployments)."
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.requireOwnership !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  requireOwnership: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Require ownership verification (verify PR creator is the student)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.requireOpenState !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  requireOpenState: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Require PR to be open (reject closed/merged PRs)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.saveValidatedData || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  saveValidatedData: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Save validated PR URL for use in subsequent tasks"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      {editingTaskData.saveValidatedData && (
                        <TextField
                          label="Saved Data Name"
                          value={editingTaskData.savedDataName || ""}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              savedDataName: e.target.value,
                            })
                          }
                          placeholder="e.g., prUrl"
                          fullWidth
                          helperText="Custom key name for storing the PR URL (also stores 'prNumber')"
                          sx={{ mb: 2, borderRadius: 2 }}
                        />
                      )}
                    </Box>
                  )}

                  {/* Validate Push/Commit Task Fields */}
                  {editingTaskData.taskType === "validate-push" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                      >
                        Push/Commit Validation Configuration
                      </Typography>

                      <TextField
                        label="Target Repository (Required)"
                        value={editingTaskData.targetRepository || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            targetRepository: e.target.value,
                          })
                        }
                        placeholder="e.g., igorsteinmacher/CS499-OSS"
                        fullWidth
                        required
                        helperText="The repository where the commit should exist - format: owner/repo"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Target Branch (Optional)"
                        value={editingTaskData.targetBranch || "main"}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            targetBranch: e.target.value,
                          })
                        }
                        placeholder="e.g., main"
                        fullWidth
                        helperText="The branch where the commit should exist. Defaults to 'main'"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Expected File Path (Optional)"
                        value={editingTaskData.expectedFilePath || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            expectedFilePath: e.target.value,
                          })
                        }
                        placeholder="e.g., students/misanetc.md"
                        fullWidth
                        helperText="Optional: File path that should exist in the commit"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.requireOwnership !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  requireOwnership: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Require ownership verification (verify commit author is the student)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.requireRecentPush || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  requireRecentPush: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Require recent push (commit must be within time window)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      {editingTaskData.requireRecentPush && (
                        <TextField
                          label="Recent Push Window (Hours)"
                          type="number"
                          value={editingTaskData.recentPushWindowHours || 24}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              recentPushWindowHours: parseInt(e.target.value) || 24,
                            })
                          }
                          placeholder="24"
                          fullWidth
                          helperText="Number of hours within which the commit must be made"
                          sx={{ mb: 2, borderRadius: 2 }}
                        />
                      )}

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.saveValidatedData || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  saveValidatedData: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Save validated commit URL for use in subsequent tasks"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      {editingTaskData.saveValidatedData && (
                        <TextField
                          label="Saved Data Name"
                          value={editingTaskData.savedDataName || ""}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              savedDataName: e.target.value,
                            })
                          }
                          placeholder="e.g., commitSha"
                          fullWidth
                          helperText="Custom key name for storing the commit URL (also stores 'commitSha')"
                          sx={{ mb: 2, borderRadius: 2 }}
                        />
                      )}
                    </Box>
                  )}

                  {/* GitHub Actions Workflow Validation Task Fields */}
                  {editingTaskData.taskType === "validate-github-actions" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                      >
                        GitHub Actions Workflow Validation Configuration
                      </Typography>

                      <TextField
                        label="Workflow File Path"
                        value={editingTaskData.workflowFilePath || ".github/workflows/main.yml"}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            workflowFilePath: e.target.value,
                          })
                        }
                        placeholder=".github/workflows/main.yml"
                        fullWidth
                        helperText="Path to the workflow file to validate"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Validation Parameters (Required)"
                        value={(editingTaskData.validationParameters || []).join('\n')}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            validationParameters: e.target.value.split('\n').filter(line => line.trim()),
                          })
                        }
                        placeholder="Enter validation checks, one per line&#10;e.g., Workflow name must be 'Python application'&#10;Must trigger on both 'push' and 'pull_request'&#10;Python version must be 3.8"
                        fullWidth
                        multiline
                        rows={6}
                        required
                        helperText="List of checks to perform on the workflow file (one per line)"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.enableDetailedFeedback !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  enableDetailedFeedback: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Enable detailed feedback (show which checks passed/failed)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.waitForWorkflowCompletion || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  waitForWorkflowCompletion: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Check workflow execution status (if running, user will be asked to try again later)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.requireStudentOwnership || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  requireStudentOwnership: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Require student's personal repository (repository owner must match student's GitHub username)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      {editingTaskData.requireStudentOwnership && (
                        <Box sx={{ mb: 2, ml: 4 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={editingTaskData.requirePrivateRepo || false}
                                onChange={(e) =>
                                  setEditingTaskData({
                                    ...editingTaskData,
                                    requirePrivateRepo: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Require private repository (only applies if student ownership is required)"
                            sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                          />
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Repository Validation Task Fields */}
                  {editingTaskData.taskType === "validate-repository" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                      >
                        Repository Validation Configuration
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.requireRepositoryExists !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  requireRepositoryExists: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Require repository exists (check if repository is accessible)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <TextField
                        select
                        label="Ownership Type"
                        value={editingTaskData.ownershipType || "any"}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            ownershipType: e.target.value,
                          })
                        }
                        fullWidth
                        helperText="Required repository ownership type"
                        sx={{ mb: 2, borderRadius: 2 }}
                      >
                        <MenuItem value="any">Any (user or organization)</MenuItem>
                        <MenuItem value="user">User (personal account)</MenuItem>
                        <MenuItem value="organization">Organization</MenuItem>
                      </TextField>

                      <TextField
                        label="Specific Owner (Optional)"
                        value={editingTaskData.specificOwner || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            specificOwner: e.target.value,
                          })
                        }
                        placeholder="e.g., OSS-Doorway-Dev"
                        fullWidth
                        helperText="Specific owner username/org name. Leave empty to check student ownership for 'user' type or any owner for 'org' type."
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.checkBotAuthorization || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  checkBotAuthorization: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Check bot authorization (verify bot has access to repository)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.requirePublic || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  requirePublic: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Require public repository"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.requirePrivate || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  requirePrivate: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Require private repository"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.saveValidatedData || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  saveValidatedData: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Save validated repository URL for later use"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      {editingTaskData.saveValidatedData && (
                        <TextField
                          label="Saved Data Key Name"
                          value={editingTaskData.savedDataName || "validatedRepo"}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              savedDataName: e.target.value,
                            })
                          }
                          placeholder="validatedRepo"
                          fullWidth
                          helperText="Key name to store the validated repository URL"
                          sx={{ mb: 2, borderRadius: 2 }}
                        />
                      )}

                      <Alert
                        severity="info"
                        sx={{
                          mt: 2,
                          borderRadius: 4,
                          "& .MuiAlert-icon": { display: "none" },
                        }}
                      >
                        <AlertTitle>How It Works</AlertTitle>
                        The bot will validate the repository provided by the student. It can check: repository existence, ownership type (user/organization), specific owner, bot authorization (if GitHub App is installed), and privacy (public/private). Use this task type to verify students are using the correct repository before starting assignments.
                      </Alert>
                    </Box>
                  )}

                  {/* Validate File Content Task Fields */}
                  {editingTaskData.taskType === "validate-file-content" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                      >
                        LLM File Content Validation Configuration
                      </Typography>
                      
                      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        <AlertTitle>File Content Validation</AlertTitle>
                        Students will provide a GitHub file URL. The system will fetch the file content and validate it using AI against your criteria.
                      </Alert>

                      <TextField
                        label="Validation Question"
                        value={editingTaskData.fileContentValidation?.question || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            fileContentValidation: {
                              ...editingTaskData.fileContentValidation,
                              question: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g., Does this file contain proper documentation?"
                        fullWidth
                        multiline
                        rows={3}
                        helperText="Optional: Provide a question or description of what should be validated"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Validation Parameters"
                        value={(editingTaskData.fileContentValidation?.validationParameters || []).join('\n')}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            fileContentValidation: {
                              ...editingTaskData.fileContentValidation,
                              validationParameters: e.target.value.split('\n').filter(line => line.trim()),
                            },
                          })
                        }
                        placeholder="Enter validation criteria, one per line&#10;e.g., Contains contribution guidelines&#10;Includes code of conduct&#10;Has instructions for submitting contributions"
                        fullWidth
                        multiline
                        rows={4}
                        helperText="Each line becomes a validation criterion for the AI to check in the file content"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Temperature"
                        type="number"
                        value={editingTaskData.fileContentValidation?.temperature || 0.1}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            fileContentValidation: {
                              ...editingTaskData.fileContentValidation,
                              temperature: parseFloat(e.target.value) || 0.1,
                            },
                          })
                        }
                        inputProps={{ min: 0, max: 2, step: 0.1 }}
                        helperText="AI creativity level (0.1 = focused, 2.0 = creative)"
                        sx={{ mb: 2, width: 200 }}
                      />

                      <Box sx={{ mt: 0 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.fileContentValidation?.enableDetailedFeedback || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  fileContentValidation: {
                                    ...editingTaskData.fileContentValidation,
                                    enableDetailedFeedback: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                          label="Enable detailed feedback from AI validation"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <TextField
                        label="Expected File Path (Optional)"
                        value={editingTaskData.expectedFilePath || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            expectedFilePath: e.target.value,
                          })
                        }
                        placeholder="e.g., README.md or LICENSE.txt"
                        fullWidth
                        helperText="Optional: Specify the exact file name that must be submitted (case-insensitive). Leave empty to accept any file name."
                        sx={{ mb: 2, mt: 2, borderRadius: 2 }}
                      />
                    </Box>
                  )}

                  {/* Iterative Code Review Task Fields */}
                  {editingTaskData.taskType === "iterative-code-review" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                      >
                        Iterative Code Review Configuration
                      </Typography>

                      <TextField
                        label="Review Prompt / Requirements"
                        value={editingTaskData.iterativeCodeReview?.reviewPrompt || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            iterativeCodeReview: {
                              ...editingTaskData.iterativeCodeReview,
                              reviewPrompt: e.target.value,
                            },
                          })
                        }
                        placeholder="Describe what the code should do and what criteria it will be reviewed against..."
                        fullWidth
                        multiline
                        rows={5}
                        helperText="Required: Detailed description of the code requirements and review criteria"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Review Criteria"
                        value={(editingTaskData.iterativeCodeReview?.reviewCriteria || []).join('\n')}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            iterativeCodeReview: {
                              ...editingTaskData.iterativeCodeReview,
                              reviewCriteria: e.target.value.split('\n').filter(line => line.trim()),
                            },
                          })
                        }
                        placeholder="Enter review criteria, one per line&#10;e.g., Handles edge cases properly&#10;Includes error checking&#10;Uses appropriate data structures"
                        fullWidth
                        multiline
                        rows={4}
                        helperText="Each line becomes a review criterion for the AI to check"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <TextField
                          label="Max Iterations"
                          type="number"
                          value={editingTaskData.iterativeCodeReview?.maxIterations || 5}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              iterativeCodeReview: {
                                ...editingTaskData.iterativeCodeReview,
                                maxIterations: parseInt(e.target.value) || 5,
                              },
                            })
                          }
                          inputProps={{ min: 1, max: 20 }}
                          helperText="Max review cycles (1-20)"
                          sx={{ width: 180 }}
                        />

                        <TextField
                          label="Temperature"
                          type="number"
                          value={editingTaskData.iterativeCodeReview?.temperature || 0.3}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              iterativeCodeReview: {
                                ...editingTaskData.iterativeCodeReview,
                                temperature: parseFloat(e.target.value) || 0.3,
                              },
                            })
                          }
                          inputProps={{ min: 0, max: 2, step: 0.1 }}
                          helperText="AI creativity (0.1-2.0)"
                          sx={{ width: 180 }}
                        />
                      </Box>

                      <TextField
                        label="PR File Pattern (Optional)"
                        value={editingTaskData.iterativeCodeReview?.prFilePattern || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            iterativeCodeReview: {
                              ...editingTaskData.iterativeCodeReview,
                              prFilePattern: e.target.value,
                            },
                          })
                        }
                        placeholder="*.cpp,*.h"
                        fullWidth
                        helperText="For PR submissions: file patterns to review (comma-separated). Leave empty to review all files."
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <Box sx={{ mt: 0 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.iterativeCodeReview?.commentOnPR !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  iterativeCodeReview: {
                                    ...editingTaskData.iterativeCodeReview,
                                    commentOnPR: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                          label="Post feedback as comments on PR (in addition to task issue)"
                          sx={{ mb: 1 }}
                        />
                        
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.iterativeCodeReview?.approvePR === true}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  iterativeCodeReview: {
                                    ...editingTaskData.iterativeCodeReview,
                                    approvePR: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                          label="Auto-approve PR when code review passes (requires pull_requests: write permission)"
                          sx={{ mb: 1 }}
                        />
                        
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.iterativeCodeReview?.mergePR === true}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  iterativeCodeReview: {
                                    ...editingTaskData.iterativeCodeReview,
                                    mergePR: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                          label="Auto-merge PR when code review passes (requires pull_requests: write permission and merge access)"
                          sx={{ mb: 1 }}
                        />
                        
                        {editingTaskData.iterativeCodeReview?.mergePR && (
                          <TextField
                            select
                            label="Merge Method"
                            value={editingTaskData.iterativeCodeReview?.mergeMethod || 'merge'}
                            onChange={(e) =>
                              setEditingTaskData({
                                ...editingTaskData,
                                iterativeCodeReview: {
                                  ...editingTaskData.iterativeCodeReview,
                                  mergeMethod: e.target.value,
                                },
                              })
                            }
                            helperText="How to merge the PR: merge (merge commit), squash (single commit), or rebase (linear history)"
                            sx={{ mb: 2, minWidth: 200 }}
                          >
                            <MenuItem value="merge">Merge Commit</MenuItem>
                            <MenuItem value="squash">Squash and Merge</MenuItem>
                            <MenuItem value="rebase">Rebase and Merge</MenuItem>
                          </TextField>
                        )}
                        
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.iterativeCodeReview?.enableDetailedFeedback !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  iterativeCodeReview: {
                                    ...editingTaskData.iterativeCodeReview,
                                    enableDetailedFeedback: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                          label="Enable detailed feedback from AI code review"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Alert
                        severity="info"
                        sx={{
                          mt: 2,
                          borderRadius: 4,
                          "& .MuiAlert-icon": { display: "none" },
                        }}
                      >
                        <AlertTitle>Iterative Code Review</AlertTitle>
                        Students submit code via GitHub file URL. The bot reviews the code and provides feedback until it meets all criteria or max iterations is reached.
                        Students can resubmit with a new URL or type "done" to recheck the last reviewed file.
                      </Alert>
                    </Box>
                  )}

                  {/* Bot Code Review Task Fields */}
                  {editingTaskData.taskType === "bot-code-review" && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                      >
                        Bot Code Review Configuration
                      </Typography>

                      <TextField
                        label="Original Code"
                        value={editingTaskData.botCodeReview?.originalCode || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            botCodeReview: {
                              ...editingTaskData.botCodeReview,
                              originalCode: e.target.value,
                            },
                          })
                        }
                        placeholder="Paste the initial (flawed) code that students will review..."
                        fullWidth
                        multiline
                        rows={10}
                        helperText="Required: The code with issues that the bot will present for review"
                        sx={{ mb: 2, borderRadius: 2, fontFamily: 'monospace' }}
                      />

                      <TextField
                        label="Code Language"
                        value={editingTaskData.botCodeReview?.codeLanguage || "cpp"}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            botCodeReview: {
                              ...editingTaskData.botCodeReview,
                              codeLanguage: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g., cpp, python, java, javascript"
                        fullWidth
                        helperText="Language for syntax highlighting (default: cpp)"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Code Requirements"
                        value={editingTaskData.botCodeReview?.requirements || ""}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            botCodeReview: {
                              ...editingTaskData.botCodeReview,
                              requirements: e.target.value,
                            },
                          })
                        }
                        placeholder="Describe what the code is supposed to do..."
                        fullWidth
                        multiline
                        rows={3}
                        helperText="Required: Description of the code's intended functionality"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <TextField
                        label="Known Issues"
                        value={(editingTaskData.botCodeReview?.knownIssues || []).join('\n')}
                        onChange={(e) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            botCodeReview: {
                              ...editingTaskData.botCodeReview,
                              knownIssues: e.target.value.split('\n').filter(line => line.trim()),
                            },
                          })
                        }
                        placeholder="Enter known issues, one per line&#10;e.g., Missing null pointer checks&#10;Wrong denominator logic&#10;Doesn't validate entire string"
                        fullWidth
                        multiline
                        rows={4}
                        helperText="Each line is an issue students should identify"
                        sx={{ mb: 2, borderRadius: 2 }}
                      />

                      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <TextField
                          label="Max Iterations"
                          type="number"
                          value={editingTaskData.botCodeReview?.maxIterations || 5}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              botCodeReview: {
                                ...editingTaskData.botCodeReview,
                                maxIterations: parseInt(e.target.value) || 5,
                              },
                            })
                          }
                          inputProps={{ min: 1, max: 20 }}
                          helperText="Max review cycles (1-20)"
                          sx={{ width: 180 }}
                        />

                        <TextField
                          label="Temperature"
                          type="number"
                          value={editingTaskData.botCodeReview?.temperature || 0.3}
                          onChange={(e) =>
                            setEditingTaskData({
                              ...editingTaskData,
                              botCodeReview: {
                                ...editingTaskData.botCodeReview,
                                temperature: parseFloat(e.target.value) || 0.3,
                              },
                            })
                          }
                          inputProps={{ min: 0, max: 2, step: 0.1 }}
                          helperText="AI creativity (0.1-2.0)"
                          sx={{ width: 180 }}
                        />
                      </Box>

                      <Box sx={{ mt: 0 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.botCodeReview?.enableDetailedFeedback !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  botCodeReview: {
                                    ...editingTaskData.botCodeReview,
                                    enableDetailedFeedback: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                          label="Enable detailed feedback (bot explains fixes made)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                        
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.botCodeReview?.awardPointsOnFailure || false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  botCodeReview: {
                                    ...editingTaskData.botCodeReview,
                                    awardPointsOnFailure: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                          label="Award points/XP even if max iterations reached without success"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                        
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.botCodeReview?.createPR === true}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  botCodeReview: {
                                    ...editingTaskData.botCodeReview,
                                    createPR: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                          label="Create PR with bot's code for review (instead of posting in issue comments)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                        
                        {editingTaskData.botCodeReview?.createPR && (
                          <TextField
                            label="File Name for PR"
                            value={editingTaskData.botCodeReview?.fileName || 'code.cpp'}
                            onChange={(e) =>
                              setEditingTaskData({
                                ...editingTaskData,
                                botCodeReview: {
                                  ...editingTaskData.botCodeReview,
                                  fileName: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., code.cpp, email_validator.cpp"
                            helperText="File name to use when creating PR"
                            sx={{ mb: 2, width: 300 }}
                          />
                        )}
                        
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.botCodeReview?.validateOnApproval !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  botCodeReview: {
                                    ...editingTaskData.botCodeReview,
                                    validateOnApproval: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                          label="Validate code against requirements when student approves (ensures code quality even if student approves prematurely)"
                          sx={{ ...STYLES.checkbox.standard, mb: 0.5, display: 'flex', width: 'fit-content' }}
                        />
                      </Box>

                      <Alert
                        severity="info"
                        sx={{
                          mt: 2,
                          borderRadius: 4,
                          "& .MuiAlert-icon": { display: "none" },
                        }}
                      >
                        <AlertTitle>Bot Code Review</AlertTitle>
                        Bot posts flawed code. Students review and provide feedback. Bot fixes only what students mention and asks "What else might be wrong?" until all issues are found.
                      </Alert>
                    </Box>
                  )}

                  {/* Response Texts */}
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        color: "primary.main",
                      }}
                    >
                      Response Messages
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        Success Message
                      </Typography>
                      <TextEditor
                        value={editingTaskData.successText || ""}
                        onChange={(value) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            successText: value,
                          })
                        }
                        label="Success Text"
                        placeholder="Message shown when the student completes the task successfully"
                        helperText="This message appears when the student gets the correct answer. You can use markdown formatting."
                        acceptFileTypes=".txt,.md,.markdown,text/plain,text/markdown"
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        Error Message
                      </Typography>
                      <TextEditor
                        value={editingTaskData.errorText || ""}
                        onChange={(value) =>
                          setEditingTaskData({
                            ...editingTaskData,
                            errorText: value,
                          })
                        }
                        label="Error Text"
                        placeholder="Message shown when the student provides an incorrect answer"
                        helperText="This message appears when the student gets an incorrect answer. You can use markdown formatting."
                        acceptFileTypes=".txt,.md,.markdown,text/plain,text/markdown"
                      />
                    </Box>
                  </Box>

                  {/* Collect Info Task Fields */}
                  {editingTaskData.taskType === "collect-info" && (
                    <Box>
                      <Divider sx={{ mb: 2 }} />
                      <Box
                        sx={{
                          backgroundColor: "#e8f5e8",
                          p: 3,
                          borderRadius: 4,
                          border: "2px solid #4caf50",
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "#2e7d32",
                          }}
                        >
                          📝 Collect Information Task
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          Create non-graded tasks that collect information from students. 
                          Any response will be accepted and stored for later reference.
                        </Typography>
                      </Box>

                      {/* Save validated data per-user */}
                      <Box sx={{ mt: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingTaskData.saveValidatedData !== false}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  saveValidatedData: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Save collected information for later tasks"
                          sx={{ ...STYLES.checkbox.standard, mb: 2, display: 'flex', width: 'fit-content' }}
                        />
                        {editingTaskData.saveValidatedData !== false && (
                          <>
                            <TextField
                              label="Data Name"
                              value={editingTaskData.savedDataName || "collected_info"}
                              onChange={(e) =>
                                setEditingTaskData({
                                  ...editingTaskData,
                                  savedDataName: e.target.value,
                                })
                              }
                              placeholder="e.g., collected_info"
                              fullWidth
                              helperText="Unique key to reference this collected information in future tasks"
                              sx={{ mt: 1, borderRadius: 2 }}
                            />
                            <Alert
                              severity="info"
                              sx={{
                                mt: 1,
                                borderRadius: 4,
                                "& .MuiAlert-icon": { display: "none" },
                              }}
                            >
                              <AlertTitle>Per-user Storage</AlertTitle>
                              When enabled, the information collected from students is saved for each student separately.
                              The value is stored as text and can be referenced in future tasks using the data name.
                            </Alert>
                          </>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Repository and Issue Fields */}
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, borderTop: "1px solid #e0e0e0" }}>
            <Button
              onClick={() => {
                setShowEditTaskModal(false);
                setEditingTaskData(null);
                setEditingTaskQuestIndex(null);
                setEditingTaskId(null);
              }}
              sx={{
                borderRadius: 4,
                fontWeight: "bold",
                px: 3,
                py: 1,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveEditedTask}
              variant="contained"
              sx={{
                bgcolor: "#4caf50",
                fontWeight: "bold",
                px: 4,
                borderRadius: 4,
                boxShadow: "none",
                "&:hover": { bgcolor: "#388e3c", boxShadow: "none" },
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Quest Modal */}
        <Dialog
          open={showEditQuestModal}
          onClose={(event, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            setShowEditQuestModal(false);
            setEditingQuestData(null);
            setEditingQuestIndex(null);
          }}
          disableEscapeKeyDown
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid #e0e0e0",
              pb: 2,
              mb: 0,
            }}
          >
            <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
              Edit Quest
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {editingQuestData && (
              <Stack spacing={3}>
                {/* Quest Basic Info */}
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
                  >
                    Quest Information
                  </Typography>

                  <TextField
                    label="Quest Title"
                    value={editingQuestData.title || ""}
                    onChange={(e) =>
                      setEditingQuestData({
                        ...editingQuestData,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Understanding OSS Projects and GitHub Basics"
                    fullWidth
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    label="Quest Description"
                    value={editingQuestData.description || ""}
                    onChange={(e) =>
                      setEditingQuestData({
                        ...editingQuestData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe what students will learn in this quest"
                    fullWidth
                    multiline
                    rows={4}
                    helperText="This description helps organize quests but is not displayed to students"
                  />
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => {
                setShowEditQuestModal(false);
                setEditingQuestData(null);
                setEditingQuestIndex(null);
              }}
              variant="outlined"
              sx={{
                borderRadius: 4,
                fontWeight: "bold",
                px: 3,
                py: 1,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveEditedQuest}
              variant="contained"
              sx={{
                bgcolor: "#4caf50",
                fontWeight: "bold",
                px: 4,
                borderRadius: 4,
                boxShadow: "none",
                "&:hover": { bgcolor: "#388e3c", boxShadow: "none" },
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Quest Edit Confirmation Dialog */}
        <Dialog
          open={showQuestEditConfirmationDialog}
          onClose={(event, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            setShowQuestEditConfirmationDialog(false);
          }}
          disableEscapeKeyDown
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            },
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#ff9800" }}>
              ⚠️ Quest Configuration Required
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {questEditMessage}
            </Typography>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              This action will create a new quest configuration and migrate all students to the updated version.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setShowQuestEditConfirmationDialog(false)}
              variant="outlined"
              sx={{ borderRadius: 4, fontWeight: "bold" }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowQuestEditConfirmationDialog(false);
                confirmSaveEditedQuest();
              }}
              variant="contained"
              sx={{
                bgcolor: "#ff9800",
                borderRadius: 4,
                fontWeight: "bold",
                "&:hover": { bgcolor: "#f57c00" },
              }}
            >
              Continue with Quest Deploy
            </Button>
          </DialogActions>
        </Dialog>

        {/* Quest Edit Success Dialog */}
        <Dialog
          open={showQuestEditSuccessDialog}
          onClose={() => setShowQuestEditSuccessDialog(false)}
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            },
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#4caf50" }}>
              ✅ Quest Updated Successfully
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body1">
              {questEditMessage}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setShowQuestEditSuccessDialog(false)}
              variant="contained"
              sx={{
                bgcolor: "#4caf50",
                borderRadius: 4,
                fontWeight: "bold",
                "&:hover": { bgcolor: "#388e3c" },
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* Quest Edit Error Dialog */}
        <Dialog
          open={showQuestEditErrorDialog}
          onClose={() => setShowQuestEditErrorDialog(false)}
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            },
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#f44336" }}>
              ❌ Quest Update Failed
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body1">
              {questEditMessage}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setShowQuestEditErrorDialog(false)}
              variant="contained"
              sx={{
                bgcolor: "#f44336",
                borderRadius: 4,
                fontWeight: "bold",
                "&:hover": { bgcolor: "#d32f2f" },
              }}
            >
              OK
            </Button>
          </DialogActions>
         </Dialog>

         {/* Quest Delete Confirmation Dialog */}
         <Dialog
           open={showQuestDeleteConfirmationDialog}
           onClose={(event, reason) => {
             if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
             setShowQuestDeleteConfirmationDialog(false);
             setQuestToDelete(null);
           }}
           disableEscapeKeyDown
           maxWidth="sm"
           PaperProps={{
             sx: {
               borderRadius: 4,
               boxShadow: "none",
               border: "1px solid #e0e0e0",
             },
           }}
         >
           <DialogTitle sx={{ pb: 2 }}>
             <Typography variant="h6" sx={{ fontWeight: 700, color: "#f44336" }}>
               ⚠️ Delete Quest
             </Typography>
           </DialogTitle>
           <DialogContent sx={{ pt: 1 }}>
             <Typography variant="body1" sx={{ mb: 2 }}>
               Are you sure you want to delete the quest "{questToDelete?.title}"?
             </Typography>
             <Alert severity="warning" sx={{ borderRadius: 2 }}>
               This action cannot be undone. All tasks within this quest will also be deleted.
             </Alert>
           </DialogContent>
           <DialogActions sx={{ p: 3, pt: 0 }}>
             <Button
               onClick={() => {
                 setShowQuestDeleteConfirmationDialog(false);
                 setQuestToDelete(null);
               }}
               variant="outlined"
               sx={{ borderRadius: 4, fontWeight: "bold" }}
             >
               Cancel
             </Button>
             <Button
               onClick={confirmQuestDelete}
               variant="contained"
               sx={{
                 bgcolor: "#f44336",
                 borderRadius: 4,
                 fontWeight: "bold",
                 "&:hover": { bgcolor: "#d32f2f" },
               }}
             >
               Delete Quest
             </Button>
           </DialogActions>
         </Dialog>

         {/* Task Delete Confirmation Dialog */}
         <Dialog
           open={showTaskDeleteConfirmationDialog}
           onClose={(event, reason) => {
             if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
             setShowTaskDeleteConfirmationDialog(false);
             setTaskToDelete(null);
           }}
           disableEscapeKeyDown
           maxWidth="sm"
           PaperProps={{
             sx: {
               borderRadius: 4,
               boxShadow: "none",
               border: "1px solid #e0e0e0",
             },
           }}
         >
           <DialogTitle sx={{ pb: 2 }}>
             <Typography variant="h6" sx={{ fontWeight: 700, color: "#f44336" }}>
               ⚠️ Delete Task
             </Typography>
           </DialogTitle>
           <DialogContent sx={{ pt: 1 }}>
             <Typography variant="body1" sx={{ mb: 2 }}>
               Are you sure you want to delete the task "{taskToDelete?.title}"?
             </Typography>
             <Alert severity="warning" sx={{ borderRadius: 2 }}>
               This action cannot be undone.
             </Alert>
           </DialogContent>
           <DialogActions sx={{ p: 3, pt: 0 }}>
             <Button
               onClick={() => {
                 setShowTaskDeleteConfirmationDialog(false);
                 setTaskToDelete(null);
               }}
               variant="outlined"
               sx={{ borderRadius: 4, fontWeight: "bold" }}
             >
               Cancel
             </Button>
             <Button
               onClick={confirmTaskDelete}
               variant="contained"
               sx={{
                 bgcolor: "#f44336",
                 borderRadius: 4,
                 fontWeight: "bold",
                 "&:hover": { bgcolor: "#d32f2f" },
               }}
             >
               Delete Task
             </Button>
           </DialogActions>
         </Dialog>

         {/* Purple Deploy Confirmation Dialog */}
         <Dialog
           open={showPurpleDeployConfirmationDialog}
           onClose={(event, reason) => {
             if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
             setShowPurpleDeployConfirmationDialog(false);
             setQuestToDeploy(null);
           }}
           disableEscapeKeyDown
           maxWidth="sm"
           PaperProps={{
             sx: {
               borderRadius: 4,
               boxShadow: "none",
               border: "1px solid #e0e0e0",
             },
           }}
         >
           <DialogTitle sx={{ pb: 2 }}>
             <Typography variant="h6" sx={{ fontWeight: 700, color: "#9c27b0" }}>
               🚀 Deploy Quest
             </Typography>
           </DialogTitle>
           <DialogContent sx={{ pt: 1 }}>
             <Typography variant="body1" sx={{ mb: 2 }}>
               Are you sure you want to deploy the quest "{questToDeploy?.title}"?
             </Typography>
             
             {/* Duplicate Warning */}
             {questToDeploy?.hasDuplicates && (
               <Alert 
                 severity="error" 
                 sx={{ 
                   mb: 2, 
                   borderRadius: 2,
                   border: "2px solid #d32f2f",
                   bgcolor: "#ffebee"
                 }}
               >
                 <AlertTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                   ⚠️ Duplicate Titles Detected!
                 </AlertTitle>
                 
                 {questToDeploy.duplicateQuestWithLive && (
                   <Typography variant="body2" sx={{ mb: 1 }}>
                     • <strong>Quest title</strong> duplicates an existing live quest
                   </Typography>
                 )}
                 
                 {questToDeploy.duplicateQuestWithDraft && (
                   <Typography variant="body2" sx={{ mb: 1 }}>
                     • <strong>Quest title</strong> duplicates another draft quest
                   </Typography>
                 )}
                 
                 {questToDeploy.duplicateTaskWarnings?.length > 0 && (
                   <Box sx={{ mt: 1 }}>
                     <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                       Task title duplicates:
                     </Typography>
                     {questToDeploy.duplicateTaskWarnings.map((warning, idx) => (
                       <Typography key={idx} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                         • <strong>{warning.taskTitle}</strong> duplicates {warning.duplicateWithLive ? "a live task" : ""}{warning.duplicateWithLive && warning.duplicateWithDraft ? " and " : ""}{warning.duplicateWithDraft ? "another draft task" : ""}
                       </Typography>
                     ))}
                   </Box>
                 )}
                 
                 <Typography variant="body2" sx={{ mt: 2, fontWeight: 600, color: "#b71c1c" }}>
                   Deploying with duplicate titles may confuse students. Consider editing the quest or task titles before deploying.
                 </Typography>
               </Alert>
             )}
             
             <Alert severity="info" sx={{ borderRadius: 2 }}>
               This will create a new quest configuration and migrate all students to the updated version. The quest will be removed from drafts after deployment.
             </Alert>
           </DialogContent>
           <DialogActions sx={{ p: 3, pt: 0 }}>
             <Button
               onClick={() => {
                 setShowPurpleDeployConfirmationDialog(false);
                 setQuestToDeploy(null);
               }}
               variant="outlined"
               sx={{ borderRadius: 4, fontWeight: "bold" }}
             >
               Cancel
             </Button>
             <Button
               onClick={confirmPurpleDeploy}
               variant="contained"
               sx={{
                 bgcolor: "#9c27b0",
                 borderRadius: 4,
                 fontWeight: "bold",
                 "&:hover": { bgcolor: "#7b1fa2" },
               }}
             >
               Deploy Quest
             </Button>
           </DialogActions>
         </Dialog>

         {/* README Preview/Edit Modal */}
        <Dialog
          open={showReadmeModal}
          onClose={(event, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            setShowReadmeModal(false);
          }}
          disableEscapeKeyDown
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid #e0e0e0",
              pb: 2,
              mb: 0,
            }}
          >
            <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
              README File Preview & Edit
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Preview and edit your README content before adding it to the quest
              configuration.
            </Typography>

            <TextEditor
              value={readmeContent}
              onChange={setReadmeContent}
              label="README Content (Markdown)"
              placeholder="# Welcome to Your Quest!

This repository contains your personalized learning journey.

## Getting Started

1. Check the **Issues** tab for your first quest
2. Complete tasks in sequential order
3. Use **comments** to submit your answers
4. Type **help** if you need hints

Good luck! 🚀"
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                💡 Tip: Use standard Markdown formatting. This content will be
                created as README.md in each student repository.
              </Typography>
            </Box>
          </DialogContent>
          <DialogContent sx={{ pt: 0 }}>
            {/* Show batch update status if active */}
            {isBatchUpdating && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress sx={{ mb: 1 }} />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {batchUpdateStatus}
                </Typography>
              </Box>
            )}

            {/* Success status display */}
            {batchUpdateStatus && !isBatchUpdating && (
              <Alert severity={batchUpdateStatus.includes('❌') ? 'error' : 'success'} sx={{ mb: 2, width: '100%' }}>
                {batchUpdateStatus}
              </Alert>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 2, borderTop: "1px solid #e0e0e0" }}>
            {/* Hidden input for uploading new README */}
            <input
              accept=".md"
              style={{ display: "none" }}
              id="readme-replace-upload"
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.name.endsWith(".md")) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    setReadmeContent(evt.target.result);
                  };
                  reader.readAsText(file);
                }
                e.target.value = "";
              }}
            />

            {/* Button container */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
              {/* New README File upload */}
              <label htmlFor="readme-replace-upload">
                <Button
                  variant="outlined"
                  disabled={isBatchUpdating}
                  sx={{
                    textTransform: "none",
                    borderRadius: 4,
                    fontWeight: "bold",
                    px: 3,
                    py: 1,
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                  }}
                >
                  New README File
                </Button>
              </label>

              {/* Save locally only */}
              <Button
                onClick={handleReadmeSave}
                variant="outlined"
                disabled={!readmeContent.trim() || isBatchUpdating}
                sx={{
                  borderRadius: 4,
                  fontWeight: "bold",
                  px: 3,
                  py: 1,
                  boxShadow: "none",
                  "&:hover": { boxShadow: "none" },
                }}
              >
                Save to Config
              </Button>

              {/* Save and publish to all repos */}
              <Button
                onClick={() => setShowBatchUpdateConfirm(true)}
                variant="contained"
                disabled={!readmeContent.trim() || isBatchUpdating}
                sx={{
                  bgcolor: "#4caf50",
                  borderRadius: 4,
                  fontWeight: "bold",
                  px: 3,
                  py: 1,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#388e3c", boxShadow: "none" },
                }}
              >
                {isBatchUpdating ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                    Publishing...
                  </>
                ) : (
                  `Save & Publish to Students (${studentCount})`
                )}
              </Button>

              {/* Remove README */}
              {jsonContent.readme !== undefined && (
                <Button
                  color="error"
                  variant="outlined"
                  disabled={isBatchUpdating}
                  onClick={() => setShowRemoveReadmeConfirm(true)}
                  sx={{
                    borderRadius: 4,
                    fontWeight: "bold",
                    px: 3,
                    py: 1,
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                  }}
                >
                  Remove README
                </Button>
              )}

              {/* Cancel */}
              <Button
                onClick={() => setShowReadmeModal(false)}
                disabled={isBatchUpdating}
                sx={{
                  borderRadius: 4,
                  fontWeight: "bold",
                  px: 3,
                  py: 1,
                }}
              >
                Cancel
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* Remove README Confirmation Dialog */}
        <Dialog
          open={showRemoveReadmeConfirm}
          onClose={(event, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            setShowRemoveReadmeConfirm(false);
          }}
          disableEscapeKeyDown
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              🗑️ Remove README for All Students
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <AlertTitle>This will clear the instructor section</AlertTitle>
              Publishing this change will:
              <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li>Set the README instructor section to empty</li>
                <li>Preserve any existing progress/links section</li>
                <li>Apply to all {studentCount} student repositories</li>
              </ul>
            </Alert>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Are you sure you want to remove the README instructor content for all students?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setShowRemoveReadmeConfirm(false)} sx={{ borderRadius: 4, fontWeight: 'bold' }}>
              Cancel
            </Button>
            <Button onClick={handleRemoveAndPublishEmpty} variant="contained" color="error" sx={{ borderRadius: 4, fontWeight: 'bold' }}>
              Yes, Remove & Publish
            </Button>
          </DialogActions>
        </Dialog>

        {/* Batch Update Confirmation Dialog */}
        <Dialog
          open={showBatchUpdateConfirm}
          onClose={(event, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            setShowBatchUpdateConfirm(false);
          }}
          disableEscapeKeyDown
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              📢 Publish README to All Students
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <AlertTitle>⚠️ This will update existing student repositories</AlertTitle>
              This action will:
              <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li>Save the README content to your class configuration</li>
                <li>Update README files in all {studentCount} student repositories</li>
                <li>Preserve existing progress sections (links, scores, etc.)</li>
                <li>Only replace the instructor content (first section)</li>
              </ul>
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to publish this README to all {studentCount} student repositories?
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              💡 <strong>Tip:</strong> Student progress sections will remain unchanged. Only the instructor content will be updated.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setShowBatchUpdateConfirm(false)}
              sx={{ borderRadius: 4, fontWeight: "bold" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReadmeSaveAndPublish}
              variant="contained"
              sx={{
                bgcolor: "#4caf50",
                borderRadius: 4,
                fontWeight: "bold",
                "&:hover": { bgcolor: "#388e3c" },
              }}
            >
              Yes, Publish to All Students
            </Button>
          </DialogActions>
        </Dialog>

        {/* Quest Library Dialog */}
        <Dialog
          open={showLibraryDialog}
          onClose={handleCloseLibrary}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid #e0e0e0",
              pb: 2,
              mb: 0,
            }}
          >
            <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
              Quest Library
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {isLibraryLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 4,
                }}
              >
                <CircularProgress size={40} />
                <Typography sx={{ ml: 2 }}>Loading quests...</Typography>
              </Box>
            ) : libraryError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {libraryError}
              </Alert>
            ) : libraryQuests.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <LibraryBooksIcon
                  sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No quests in your library yet
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Create your first quest to get started with the quest library.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {libraryQuests.map((quest) => (
                  <Card
                    key={quest._id}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      boxShadow: "none",
                      p: 3,
                      "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "#f8f9fa",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ flex: 1, mr: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, mb: 1 }}
                        >
                          {quest.questTitle}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {quest.description || ""}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Chip
                            label={`${(quest.tasks || []).length} tasks`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ borderRadius: 2 }}
                          />
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexShrink: 0,
                        }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleAddLibraryQuest(quest)}
                          sx={{
                            borderRadius: 4,
                            fontWeight: "bold",
                            px: 2,
                            py: 1,
                            boxShadow: "none",
                            "&:hover": { boxShadow: "none" },
                          }}
                        >
                          Add to Class
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDeleteLibraryQuest(quest._id)}
                          sx={{
                            borderRadius: 4,
                            fontWeight: "bold",
                            px: 2,
                            py: 1,
                            borderColor: "#f44336",
                            color: "#f44336",
                            "&:hover": {
                              borderColor: "#d32f2f",
                              backgroundColor: "#ffebee",
                            },
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, borderTop: "1px solid #e0e0e0" }}>
            <Button
              onClick={handleCloseLibrary}
              sx={{
                borderRadius: 4,
                fontWeight: "bold",
                px: 3,
                py: 1,
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Stored Data Overview */}
        <Card sx={{ mb: 4, borderRadius: 4, boxShadow: "none" }}>
          <Box p={3}>
            <Typography
              variant="h5"
              component="h3"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              Stored Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This section lists keys configured to save validated answers per
              student, and shows stored values when available.
            </Typography>

            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={loadStoredValues}
                sx={{ borderRadius: 3 }}
              >
                Refresh All Data
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setHasLoadedCollectedInfo(false);
                  loadCollectedInfoData();
                }}
                sx={{ borderRadius: 3 }}
                color="secondary"
                disabled={isLoadingCollectedInfo}
              >
                {isLoadingCollectedInfo ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading...
                  </>
                ) : (
                  'Refresh Collected Info'
                )}
              </Button>
            </Box>

            {/* Keys List */}
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 3,
                boxShadow: "none",
                border: "1px solid #e0e0e0",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#1976d2" }}>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      Data Name
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      Quest
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      Task
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      Expected Type
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(storedKeys || []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        sx={{ py: 3, textAlign: "center" }}
                      >
                        No stored data keys configured.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (storedKeys || []).map((k, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{k.dataName}</TableCell>
                        <TableCell>{k.questId}</TableCell>
                        <TableCell>{k.taskId}</TableCell>
                        <TableCell>{k.expectedType}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Deploy MCQ Quest to Existing Repo */}
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>

            </Box>

            {/* Collected Info Summary */}
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography
                variant="h6"
                component="h4"
                sx={{ fontWeight: 600, mb: 2, color: 'secondary.main' }}
              >
                📝 Collected Info Summary
              </Typography>
              
              {/* Show subtle notification if class ID was corrected */}
              {collectedInfoSummary && !collectedInfoSummary.usedRequestedClassId && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  ℹ️ Showing collected_info data from available classes
                </Typography>
              )}
              
              {(() => {
                const collectedInfoKeys = storedKeys.filter(k => 
                  k.dataName === 'collected_info' || k.dataName.includes('collected_info')
                );
                
                // Count actual collected_info entries from stored values
                const totalCollectedInfoEntries = Object.values(storedValuesByUser).reduce((total, userValues) => {
                  return total + Object.keys(userValues).filter(key => 
                    key === 'collected_info' || key.includes('collected_info')
                  ).length;
                }, 0);
                
                // Count students who actually have collected_info data
                const studentsWithCollectedInfo = Object.keys(storedValuesByUser).filter(userId => 
                  Object.keys(storedValuesByUser[userId] || {}).some(key => 
                    key === 'collected_info' || key.includes('collected_info')
                  )
                ).length;
                
                if (collectedInfoKeys.length === 0) {
                  return (
                    <Typography variant="body2" color="text.secondary">
                      No collected_info data configured yet. Use "collect-info" task types to gather student information.
                    </Typography>
                  );
                }
                
                return (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${collectedInfoKeys.length} collected_info keys`} 
                      color="secondary" 
                      variant="outlined"
                      size="small"
                    />
                    <Chip 
                      label={`${totalCollectedInfoEntries} total entries`} 
                      color="primary" 
                      variant="outlined"
                      size="small"
                    />
                    <Chip 
                      label={`${studentsWithCollectedInfo} students with data`} 
                      color="success" 
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                );
              })()}
            </Box>

            {/* Per-user values placeholder */}
            <Box sx={{ mt: 3 }}>
              {storedKeys && storedKeys.length > 0 ? (
                storedKeys.map((k, idx) => (
                  <Box key={`${k.dataName}-${idx}`} sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      {k.dataName} ({k.questId}.{k.taskId}) — Saved by{" "}
                      {
                        Object.entries(storedValuesByUser || {}).filter(
                          ([_, v]) => v && v[k.dataName] !== undefined
                        ).length
                      }{" "}
                      {Object.entries(storedValuesByUser || {}).filter(
                        ([_, v]) => v && v[k.dataName] !== undefined
                      ).length === 1
                        ? "student"
                        : "students"}
                    </Typography>
                    <TableContainer
                      component={Paper}
                      sx={{
                        borderRadius: 3,
                        boxShadow: "none",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#1976d2" }}>
                            <TableCell sx={{ color: "white", fontWeight: 700 }}>
                              Student
                            </TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 700 }}>
                              Value
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.keys(storedValuesByUser).length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={2}
                                sx={{ py: 2, textAlign: "center" }}
                              >
                                No values recorded yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            Object.entries(storedValuesByUser).map(
                              ([username, values]) => (
                                <TableRow key={`${username}-${k.dataName}`}>
                                  <TableCell>{username}</TableCell>
                                  <TableCell>
                                    {values && values[k.dataName] !== undefined
                                      ? String(values[k.dataName])
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                              )
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Values are recorded by the bot at runtime per student and will
                  appear here when available.
                </Typography>
              )}
            </Box>
          </Box>
        </Card>
      </Container>
      
      {/* Task Deletion Confirmation Dialog */}
      <TaskDeleteConfirmationDialog
        open={showDeleteTaskDialog}
        onClose={cancelDeleteTask}
        onConfirm={confirmDeleteTask}
        taskToDelete={taskToDelete}
        questToDeleteFrom={questToDeleteFrom}
      />

      {/* Task Edit Confirmation Dialog */}
      <TaskEditConfirmationDialog
        open={showTaskEditConfirmationDialog}
        onClose={() => setShowTaskEditConfirmationDialog(false)}
        onConfirm={confirmSaveEditedTask}
        taskData={editingTaskData}
        questIndex={editingTaskQuestIndex}
        isDraftEdit={editingTaskQuestIndex >= 10000}
      />

      {/* Task Edit Success Dialog */}
      <TaskEditSuccessDialog
        open={showTaskEditSuccessDialog}
        onClose={() => setShowTaskEditSuccessDialog(false)}
        message={taskEditMessage}
      />

      {/* Task Edit Error Dialog */}
      <TaskEditErrorDialog
        open={showTaskEditErrorDialog}
        onClose={() => setShowTaskEditErrorDialog(false)}
        message={taskEditMessage}
      />

    </div>
  );
};

// Move these to parent scope so both QuestBlock and TaskBlock can use them
/** Normalize type slug from quest task objects (DB / draft may use `type` or `taskType`). */
const resolveTaskTypeKey = (task) => {
  if (!task) return "";
  const raw = task.type ?? task.taskType;
  if (raw == null || raw === "" || raw === "N/A") return "";
  return String(raw).trim();
};

const humanizeTaskTypeSlug = (slug) => {
  if (!slug) return "Unknown";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

/** Stable distinct color for types not in the explicit map (e.g. future task types). */
const hashStringToColor = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 52%, 40%)`;
};

const getTaskTypeColor = (taskType) => {
  switch (taskType) {
    case "multiple-choice":
      return "#1976d2";
    case "quiz":
      return "#7b1fa2";
    case "collect-info":
      return "#00897b";
    case "get-issue-count":
      return "#f57c00";
    case "get-pr-count":
      return "#d32f2f";
    case "get-top-contributor":
      return "#388e3c";
    case "get-issue-title":
      return "#455a64";
    case "get-open-issue":
      return "#6d4c41";
    case "custom-api-call":
      return "#0d47a1";
    case "assigned":
      return "#c2185b";
    case "issue-no":
      return "#ff5722";
    case "comment":
      return "#0097a7";
    case "validate-fork-url":
      return "#303f9f";
    case "validate-file-exists":
      return "#5e35b1";
    case "validate-pr-url":
      return "#6a1b9a";
    case "validate-push":
      return "#00695c";
    case "validate-github-actions":
      return "#37474f";
    case "validate-repository":
      return "#bf360c";
    case "llm-text-validation":
      return "#e65100";
    case "imageValidation":
      return "#2e7d32";
    case "validate-file-content":
      return "#8e24aa";
    case "iterative-code-review":
      return "#283593";
    case "bot-code-review":
      return "#4527a0";
    default:
      return taskType ? hashStringToColor(taskType) : "#757575";
  }
};

const getTaskTypeLabel = (taskType) => {
  switch (taskType) {
    case "multiple-choice":
      return "MCQ";
    case "quiz":
      return "Quiz";
    case "collect-info":
      return "Collect info";
    case "get-issue-count":
      return "Issue count";
    case "get-pr-count":
      return "PR count";
    case "get-top-contributor":
      return "Top contributor";
    case "get-issue-title":
      return "Issue title";
    case "get-open-issue":
      return "Open issues";
    case "custom-api-call":
      return "Custom API";
    case "assigned":
      return "Assignment";
    case "issue-no":
      return "Issue #";
    case "comment":
      return "Comment";
    case "validate-fork-url":
      return "Fork URL";
    case "validate-file-exists":
      return "File exists";
    case "validate-pr-url":
      return "PR URL";
    case "validate-push":
      return "Push / commit";
    case "validate-github-actions":
      return "GitHub Actions";
    case "validate-repository":
      return "Repository";
    case "llm-text-validation":
      return "LLM text";
    case "imageValidation":
      return "LLM image";
    case "validate-file-content":
      return "LLM file";
    case "iterative-code-review":
      return "Iterative review";
    case "bot-code-review":
      return "Bot review";
    default:
      return humanizeTaskTypeSlug(taskType);
  }
};

// QuestBlock Component
const QuestBlock = ({
  quest,
  questIndex,
  totalQuests,
  onMoveQuest,
  onEditQuest,
  onDeleteQuest,
  onDeleteQuestClick,
  onTaskDeleteClick,
  onMoveTask,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onPurpleDeployQuest, // New prop for purple deployment
  isDraftQuest = false, // New prop to indicate if this is a draft quest
  duplicateQuestInfo = null,
  duplicateTaskWarnings = {},
}) => {
  const [expanded, setExpanded] = useState(isDraftQuest); // Draft quests expanded by default
  
  // Check if any tasks have duplicates
  const hasTaskDuplicates = isDraftQuest && duplicateTaskWarnings && Object.values(duplicateTaskWarnings).some(
    (warning) => warning?.duplicateWithLive || warning?.duplicateWithDraft
  );
  
  // Only show duplicate badge on quest title if the QUEST TITLE itself is duplicated
  const hasQuestTitleDuplicate =
    isDraftQuest &&
    duplicateQuestInfo &&
    (duplicateQuestInfo.duplicateWithLive ||
      duplicateQuestInfo.duplicateWithDraft);
  
  const questDuplicateMessages = [];
  if (duplicateQuestInfo?.duplicateWithLive) {
    questDuplicateMessages.push("Quest title duplicates a live quest");
  }
  if (duplicateQuestInfo?.duplicateWithDraft) {
    questDuplicateMessages.push("Quest title duplicates another draft quest");
  }
  
  // Debug logging to understand quest structure
  console.log(`🔍 [QuestBlock] Quest ${questIndex + 1} data:`, {
    questId: quest.questId,
    title: quest.title,
    tasks: quest.tasks,
    tasksType: typeof quest.tasks,
    tasksKeys: quest.tasks ? Object.keys(quest.tasks) : 'N/A',
    tasksLength: quest.tasks ? Object.keys(quest.tasks).length : 0
  });
  
  const taskEntries = Object.entries(quest.tasks || {});
  return (
    <Accordion
      data-quest-id={quest.questId || `Q${questIndex}`}
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        mb: 2,
        bgcolor: isDraftQuest 
          ? (expanded ? "#fff8e1" : "#fff3c4") // Yellow tint for draft quests
          : quest.isQ0 
            ? "#f8f9fa" 
            : (expanded ? "white" : "#f5f5f5"),
        borderRadius: 4,
        boxShadow: "none",
        transition: "background-color 0.2s ease-in-out",
        border: isDraftQuest ? "1px solid #ffb74d" : "none", // Orange border for draft quests
      }}
    >
      <AccordionSummary>
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <Typography
                component="span"
                sx={{
                  color: "#f57c00",
                  fontWeight: 700,
                  mr: 1,
                  fontSize: "0.9em",
                  backgroundColor: "#fff3e0",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid #ffcc02",
                }}
              >
                Q{questIndex + 1}
              </Typography>
              {quest.title}
              {hasQuestTitleDuplicate && (
                <Chip
                  label="Duplicate title"
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: "#f44336",
                    color: "#ffffff",
                    border: "1px solid #d32f2f",
                  }}
                />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {taskEntries.length} tasks
            </Typography>
            {hasQuestTitleDuplicate && questDuplicateMessages.length > 0 && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block" }}
              >
                {questDuplicateMessages.join(" • ")}
              </Typography>
            )}
            <Stack direction="row" spacing={1} mt={1}></Stack>
          </Box>
          {/* Quest Action Buttons */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 0.5,
              minWidth: "fit-content",
            }}
          >
            {/* Rearrangement Arrows - Only show for draft quests */}
            {isDraftQuest && (
              <>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  title="Move Up"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveQuest(questIndex, "up");
                  }}
                  disabled={questIndex === 0}
                  style={{
                    marginRight: 2,
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontSize: 16,
                    opacity: questIndex === 0 ? 0.3 : 1,
                    border: "1px solid #1976d2",
                    backgroundColor: "#1976d2",
                    color: "white",
                  }}
                >
                  ↑
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  title="Move Down"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveQuest(questIndex, "down");
                  }}
                  disabled={questIndex === totalQuests - 1}
                  style={{
                    marginRight: 6,
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontSize: 16,
                    opacity: questIndex === totalQuests - 1 ? 0.3 : 1,
                    border: "1px solid #1976d2",
                    backgroundColor: "#1976d2",
                    color: "white",
                  }}
                >
                  ↓
                </button>
              </>
            )}
            <Tooltip title="Edit Quest">
              <span>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditQuest(questIndex);
                  }}
                  sx={{
                    border: "1px solid #4caf50",
                    borderRadius: 4,
                    ml: 0,
                    backgroundColor: "#4caf50",
                    color: "white",
                    "&:hover": { backgroundColor: "#388e3c" },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
             {/* Delete Quest Button - Only show for draft quests */}
             {isDraftQuest && (
               <Tooltip title="Delete Quest">
                 <span>
                   <IconButton
                     size="small"
                     onClick={(e) => {
                       e.stopPropagation();
                       onDeleteQuest(questIndex);
                     }}
                     sx={{
                       border: "1px solid #f44336",
                       borderRadius: 4,
                       ml: 0.5,
                       backgroundColor: "#f44336",
                       color: "white",
                       "&:hover": { backgroundColor: "#d32f2f" },
                     }}
                   >
                     <DeleteIcon fontSize="small" />
                   </IconButton>
                 </span>
               </Tooltip>
             )}
            {onPurpleDeployQuest && (
              <Tooltip title="Deploy Quest - Create New Config with Appended Quest">
                  <span>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPurpleDeployQuest(questIndex);
                      }}
                      sx={{
                        border: "1px solid #9c27b0",
                        borderRadius: 4,
                        ml: 0.5,
                        backgroundColor: "#9c27b0",
                        color: "white",
                        "&:hover": { backgroundColor: "#7b1fa2" },
                      }}
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
            )}
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{
        backgroundColor: isDraftQuest ? "#fff8e1" : "transparent", // Yellow background for draft quest tasks
        borderRadius: isDraftQuest ? 2 : 0,
        border: isDraftQuest ? "1px solid #ffb74d" : "none",
        margin: isDraftQuest ? 1 : 0,
      }}>
        {/* Tasks header inside details */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Tasks
        </Typography>
        {/* Render tasks if present */}
        {taskEntries.length > 0 && (
          <Box>
            {taskEntries.map(([taskKey, task], tIdx) => (
              <TaskBlock
                key={taskKey}
                taskId={taskKey}
                task={task}
                taskIndex={tIdx}
                totalTasks={taskEntries.length}
                questIndex={questIndex}
                onMoveTask={onMoveTask}
                onEditTask={onEditTask}
                onDeleteTask={(questIndex, taskId, taskTitle) => {
                  if (isDraftQuest && onTaskDeleteClick) {
                    onTaskDeleteClick(questIndex, taskId, taskTitle);
                  } else {
                    onDeleteTask(questIndex, taskId);
                  }
                }}
                getTaskTypeColor={getTaskTypeColor}
                getTaskTypeLabel={getTaskTypeLabel}
                isDraftQuest={isDraftQuest}
                duplicateInfo={duplicateTaskWarnings[taskKey]}
              />
            ))}
          </Box>
        )}
        
        {/* Add Task Button - Always visible when tasks are expanded */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => onAddTask(questIndex)}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 4,
              fontWeight: "bold",
              borderColor: "primary.main",
              color: "primary.main",
              "&:hover": {
                borderColor: "primary.dark",
                backgroundColor: "#e3f2fd",
              },
            }}
          >
            Add Task
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

const TaskBlock = ({
  taskId,
  task,
  taskIndex,
  totalTasks,
  questIndex,
  onMoveTask,
  onEditTask,
  onDeleteTask,
  getTaskTypeColor,
  getTaskTypeLabel,
  isDraftQuest = false,
  duplicateInfo = null,
}) => {
  const hasTaskDuplicate =
    isDraftQuest &&
    duplicateInfo &&
    (duplicateInfo.duplicateWithLive || duplicateInfo.duplicateWithDraft);
  const taskDuplicateMessages = [];
  if (duplicateInfo?.duplicateWithLive) {
    taskDuplicateMessages.push("Title duplicates a live task");
  }
  if (duplicateInfo?.duplicateWithDraft) {
    taskDuplicateMessages.push("Title duplicates another draft task");
  }
  const taskTypeKey = resolveTaskTypeKey(task);
  const typeChipBg = getTaskTypeColor(taskTypeKey);
  return (
    <Card
      data-task-id={taskId}
      data-quest-index={questIndex}
      sx={{
        mb: 2,
        borderRadius: 4,
        boxShadow: "none",
        border: isDraftQuest ? "1px solid #ffb74d" : "1px solid #e0e0e0",
        backgroundColor: isDraftQuest ? "#fff8e1" : "white",
        "&:hover": {
          borderColor: isDraftQuest ? "#ff9800" : "primary.main",
          backgroundColor: isDraftQuest ? "#fff3c4" : "#f8f9fa",
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Task Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {task.desc || taskId}
              {hasTaskDuplicate && (
                <Chip
                  label="Duplicate title"
                  color="warning"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Task {taskIndex + 1} of {totalTasks}
            </Typography>
            {hasTaskDuplicate && taskDuplicateMessages.length > 0 && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block" }}
              >
                {taskDuplicateMessages.join(" • ")}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Task Details Row */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 0.5,
            mb: 1,
            justifyContent: "flex-start",
            flexWrap: "nowrap",
          }}
        >
          <Chip
            label={getTaskTypeLabel(taskTypeKey)}
            size="small"
            sx={{
              borderRadius: 2,
              width: "auto",
              flexShrink: 0,
              bgcolor: typeChipBg,
              color: "#fff",
              fontWeight: 600,
              "& .MuiChip-label": { px: 1 },
            }}
          />
          <Chip
            label={`XP: ${task.xp ?? 0}`}
            color="default"
            size="small"
            sx={{
              bgcolor: "#e0e0e0",
              color: "#333",
              borderRadius: 2,
              width: "auto",
              flexShrink: 0,
            }}
          />
          <Chip
            label={`Points: ${task.points ?? 0}`}
            color="default"
            size="small"
            sx={{
              bgcolor: "#e0e0e0",
              color: "#333",
              borderRadius: 2,
              width: "auto",
              flexShrink: 0,
            }}
          />
        </Box>

        {/* Action Buttons Row - ARROW BUTTONS for draft quests only */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 0.5,
            mb: 2,
          }}
        >
          {isDraftQuest && (
            <>
              <Tooltip title="Move Up">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => onMoveTask(questIndex, taskId, "up")}
                    disabled={taskIndex === 0}
                    sx={{
                      border: "1px solid #1976d2",
                      borderRadius: 4,
                      backgroundColor: "#1976d2",
                      color: "white",
                      "&:hover": { backgroundColor: "#1565c0" },
                      "&:disabled": {
                        opacity: 0.3,
                        backgroundColor: "#e0e0e0",
                        color: "#666",
                      },
                    }}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move Down">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => onMoveTask(questIndex, taskId, "down")}
                    disabled={taskIndex === totalTasks - 1}
                    sx={{
                      border: "1px solid #1976d2",
                      borderRadius: 4,
                      backgroundColor: "#1976d2",
                      color: "white",
                      "&:hover": { backgroundColor: "#1565c0" },
                      "&:disabled": {
                        opacity: 0.3,
                        backgroundColor: "#e0e0e0",
                        color: "#666",
                      },
                    }}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}
          <Tooltip title="Edit Task">
            <span>
              <IconButton
                size="small"
                onClick={() => onEditTask(questIndex, taskId)}
                sx={{
                  border: "1px solid #4caf50",
                  borderRadius: 4,
                  backgroundColor: "#4caf50",
                  color: "white",
                  "&:hover": { backgroundColor: "#388e3c" },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
           {/* Delete Task Button - Only show for draft quests */}
           {isDraftQuest && (
             <Tooltip title="Delete Task">
               <span>
                 <IconButton
                   size="small"
                   onClick={() => onDeleteTask(questIndex, taskId, task.title || taskId)}
                   sx={{
                     border: "1px solid #f44336",
                     borderRadius: 4,
                     backgroundColor: "#f44336",
                     color: "white",
                     "&:hover": { backgroundColor: "#d32f2f" },
                   }}
                 >
                   <DeleteIcon fontSize="small" />
                 </IconButton>
               </span>
             </Tooltip>
           )}
        </Box>
      </Box>
    </Card>
  );
};

// Task Edit Confirmation Dialog Component
const TaskEditConfirmationDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  taskData,
  questIndex,
  isDraftEdit = false
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        bgcolor: isDraftEdit ? '#e8f5e8' : '#fff3e0',
        color: isDraftEdit ? '#2e7d32' : '#e65100'
      }}>
        <InfoIcon />
        {isDraftEdit ? 'Confirm Draft Task Changes' : 'Confirm Task Changes'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {isDraftEdit ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Draft Task Update</AlertTitle>
            This will update the draft quest configuration. Changes will only affect new test repositories created with this draft.
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>This will create a new quest configuration</AlertTitle>
            A new quest configuration will be created and all students will be migrated to use the updated task.
          </Alert>
        )}
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          You are about to modify:
        </Typography>
        
        <Box sx={{ 
          bgcolor: '#f5f5f5', 
          p: 2, 
          borderRadius: 2, 
          mb: 2 
        }}>
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
            Quest {questIndex + 1} - Task: {taskData?.taskDesc || taskData?.title || 'Untitled Task'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Task Type:{" "}
            {getTaskTypeLabel(resolveTaskTypeKey(taskData))}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Points: {taskData?.points || 0} | XP: {taskData?.xp || 0}
          </Typography>
        </Box>

        {isDraftEdit ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will update the draft quest configuration. The changes will be saved to the draft JSON and will be used when creating new test repositories.
            Existing users will not be affected by this change.
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will create a new quest configuration and migrate all students to use it. 
            The original configuration will be preserved for rollback purposes.
          </Typography>
        )}

        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {isDraftEdit ? 'Do you want to proceed with updating the draft?' : 'Do you want to proceed with creating the new configuration?'}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="primary" 
          variant="contained"
          sx={{ 
            bgcolor: isDraftEdit ? '#4caf50' : '#1976d2',
            '&:hover': { bgcolor: isDraftEdit ? '#388e3c' : '#1565c0' }
          }}
        >
          {isDraftEdit ? 'Update Draft' : 'Create New Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Task Edit Success Dialog Component
const TaskEditSuccessDialog = ({ 
  open, 
  onClose, 
  message 
}) => {
  const isDraftUpdate = message && message.includes('Draft task updated');
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        bgcolor: '#e8f5e8',
        color: '#2e7d32'
      }}>
        <CheckCircleIcon sx={{ color: '#4caf50' }} />
        {isDraftUpdate ? 'Draft Updated Successfully' : 'Task Updated Successfully'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {isDraftUpdate ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            <AlertTitle>Draft Configuration Updated</AlertTitle>
            The draft quest configuration has been updated and saved.
          </Alert>
        ) : (
          <Alert severity="success" sx={{ mb: 2 }}>
            <AlertTitle>Quest Configuration Created</AlertTitle>
            A new quest configuration has been created and all students have been migrated to it.
          </Alert>
        )}
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message}
        </Typography>

        {isDraftUpdate ? (
          <Typography variant="body2" color="text.secondary">
            The changes will be applied when you create new test repositories using this draft configuration.
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            All students have been migrated to the new configuration and will see the updated task content.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={onClose} 
          color="primary" 
          variant="contained"
          sx={{ 
            bgcolor: '#4caf50',
            '&:hover': { bgcolor: '#388e3c' }
          }}
        >
          Got It
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Task Edit Error Dialog Component
const TaskEditErrorDialog = ({ 
  open, 
  onClose, 
  message 
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        bgcolor: '#ffebee',
        color: '#c62828'
      }}>
        <ErrorIcon sx={{ color: '#f44336' }} />
        Task Update Failed
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Update Failed</AlertTitle>
          There was an error updating the task configuration.
        </Alert>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          The task has been updated locally, but the live configuration could not be updated. 
          You may need to try again or check your connection.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={onClose} 
          color="error" 
          variant="contained"
          sx={{ 
            bgcolor: '#f44336',
            '&:hover': { bgcolor: '#d32f2f' }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Task Deletion Confirmation Dialog Component
const TaskDeleteConfirmationDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  taskToDelete, 
  questToDeleteFrom 
}) => {
  const getTaskDisplayName = () => {
    if (questToDeleteFrom === 'questForm') {
      return `Task ${taskToDelete + 1}`;
    } else {
      return taskToDelete;
    }
  };

  const getQuestDisplayName = () => {
    if (questToDeleteFrom === 'questForm') {
      return 'the quest you are creating';
    } else {
      return `Quest ${questToDeleteFrom + 1}`;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>Delete Task</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete <strong>{getTaskDisplayName()}</strong> from {getQuestDisplayName()}?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained"
          sx={{ 
            bgcolor: 'error.main',
            '&:hover': { bgcolor: 'error.dark' }
          }}
        >
          Delete Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenerateJson;
