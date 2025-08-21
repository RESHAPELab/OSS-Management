import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_CONFIG from '../../config/api';
import TextEditor from '../../components/TextEditor';
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
  ListSubheader,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  CardContent,
  InputBase,
  FormHelperText
} from '@mui/material';
import {
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  DragIndicator as DragIndicatorIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  LibraryBooks as LibraryBooksIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  AutoAwesome as AutoAwesomeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuthContext } from '../../context/AuthContext';

const GenerateJson = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const baseURL = API_CONFIG.getBaseURL();
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showAddQuestModal, setShowAddQuestModal] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showReadmeModal, setShowReadmeModal] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [saveStatusType, setSaveStatusType] = useState(''); // 'success', 'error', 'saving'
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [githubUsername, setGithubUsername] = useState('');
  const [isCreatingRepos, setIsCreatingRepos] = useState(false);
  const [repoCreationStatus, setRepoCreationStatus] = useState('');
  const [storedKeys, setStoredKeys] = useState([]);
  const [storedValuesByUser, setStoredValuesByUser] = useState({});
  // 1. Add new state for multiple tasks in questFormData
  const [questFormData, setQuestFormData] = useState({
    title: '',
    description: '',
    tasks: [], // <-- array of task objects
  });
  // 1. Add state for editing quest
  const [editingQuestIndex, setEditingQuestIndex] = useState(null);
  const { authUser } = useAuthContext();
  const [showLibraryDialog, setShowLibraryDialog] = useState(false);
  const [libraryQuests, setLibraryQuests] = useState([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');

  // Initial JSON content with state management
  const [jsonContent, setJsonContent] = useState({
    map_repo_link: "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map",
    questSequence: [
      {
        questId: "Q1",
        title: "Understanding OSS Projects and GitHub Basics",
        isQ0: false,
        questType: "fixed",
        sequenceNumber: 0,
        metadata: {
          title: "Understanding OSS Projects and GitHub Basics",
          description:
            "Learn the fundamentals of open source software and GitHub workflow",
          prerequisite: null,
          type: "general",
        },
        badgeDescription: "Explorer 🚀",
        tasks: {
          T1: {
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
        title: "Assignment Validation",
        isQ0: false,
        questType: "custom",
        sequenceNumber: 1,
        metadata: {
          title: "Assignment Validation",
          description: "Validate user assignments to specific issues",
          prerequisite: "Q1",
          type: "custom",
        },
        badgeDescription: "Custom Quest 🎯",
        tasks: {
          T1: {
            desc: "Identify the assigned user for the issue #88",
            points: 25,
            xp: 25,
            hints: [],
            detailedHints: [],
          },
          T2: {
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

  // Add a quest ID counter to ensure consistent timestamps
  const [questIdCounter, setQuestIdCounter] = useState(0);
  const [sessionTimestamp] = useState(Date.now()); // Use same timestamp for all quests in this session

  // Track the last successful save time for relative timestamp display
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Compute a human-readable relative time string (e.g., "15 secs ago", "2 hours ago")
  const relativeSaveText = useMemo(() => {
    if (!lastSavedAt) return '';
    const diffSec = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000);
    if (diffSec < 5) return 'Saved successfully just now';
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
    return questSequence.map((quest, index) => ({
      ...quest,
      questId: `Q${index + 1}`,
      sequenceNumber: index
    }));
  };

  // Function to update quest IDs whenever quest sequence changes
  const updateQuestIds = (questSequence) => {
    console.log('🔄 Updating quest IDs for sequence:', questSequence.map(q => ({ id: q.questId, title: q.title })));
    
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
    
    console.log('✅ Updated quest IDs:', updatedSequence.map(q => ({ id: q.questId, title: q.title, prereq: q.metadata?.prerequisite })));
    
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
        if (quest.metadata && quest.metadata.prerequisite !== previousQuest.questId) {
          console.log(`🔧 Fixing prerequisite for quest ${quest.questId}: ${quest.metadata.prerequisite} → ${previousQuest.questId}`);
          quest.metadata.prerequisite = previousQuest.questId;
        }
      } else {
        // First quest should have no prerequisite
        if (quest.metadata && quest.metadata.prerequisite !== null) {
          console.log(`🔧 Fixing prerequisite for first quest ${quest.questId}: ${quest.metadata.prerequisite} → null`);
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
    setLibraryError('');
    try {
      const res = await axios.get(`/api/generatejson/quests/${authUser._id}`);
      setLibraryQuests(res.data.data || []);
    } catch (err) {
      setLibraryError('Failed to load quest library');
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

  // Add a library quest to the current class
  const handleAddLibraryQuest = (quest) => {
    // Convert quest.tasks (array of Task objects) to our questFormData.tasks format
    const tasksArr = (quest.tasks || []).map(task => ({
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
      questType: 'custom',
      sequenceNumber: sequenceNumber,
      metadata: {
        title: quest.questTitle,
        description: '',
        prerequisite: null, // Will be set by updateQuestIds
        type: 'custom'
      },
      badgeDescription: "Custom Quest 🎯",
      tasks: tasksObj
    };
    setJsonContent(prev => {
      const updatedSequence = [...prev.questSequence, newQuest];
      return {
        ...prev,
        questSequence: updateQuestIds(updatedSequence)
      };
    });
    setShowLibraryDialog(false);
  };

  // Delete a quest from the library
  const handleDeleteLibraryQuest = async (questId) => {
    if (!window.confirm('Delete this quest from your library?')) return;
    try {
      await axios.delete(`/api/generatejson/quest/${questId}`);
      setLibraryQuests(prev => prev.filter(q => q._id !== questId));
    } catch (err) {
      alert('Failed to delete quest');
    }
  };

  // 2. Add a function to create a blank task (with all fields)
  const createBlankTask = () => ({
    desc: '',
    points: 20,
    xp: 20,
    type: 'general',
    accept: '',
    success: '',
    error: '',
    answer: '',
    options: [],
    detailedHints: [],
    taskType: 'multiple-choice',
    taskDesc: '',
    successText: '',
    errorText: '',
    question: '',
    correctAnswer: '',
    repository: '',
    apiEndpoint: '',
    responsePath: '',
    expectedAnswerType: 'Number',
    enableTolerance: false,
    toleranceRange: 10,
    issueNumber: '',
    questions: [],
    // LLM Text Validation fields
    llmTextValidation: {
      question: '',
      validationParameters: [],
      temperature: 0.1,
      enableDetailedFeedback: false
    }
  });

  // 3. Add a function to add a new blank task
  const handleAddTaskToQuest = () => {
    setQuestFormData(prev => {
      const newTask = createBlankTask();
      const defaults = generateDefaultTexts(newTask.taskType);
      newTask.successText = defaults.successText;
      newTask.errorText = defaults.errorText;
      return {
        ...prev,
        tasks: [...prev.tasks, newTask]
      };
    });
  };

  // 4. Add functions to edit, delete, and reorder tasks in questFormData.tasks
  const handleTaskChange = (taskIdx, field, value) => {
    setQuestFormData(prev => {
      const updatedTasks = prev.tasks.map((task, idx) => {
        if (idx !== taskIdx) return task;
        if (field.startsWith('option-')) {
          const optionIdx = parseInt(field.split('-')[1], 10);
          const newOptions = [...task.options];
          newOptions[optionIdx].value = value;
          return { ...task, options: newOptions };
        }
        let updated = { ...task, [field]: value };
        if (field === 'taskType') {
          const defaults = generateDefaultTexts(value);
          if (!updated.successText?.trim()) updated.successText = defaults.successText;
          if (!updated.errorText?.trim()) updated.errorText = defaults.errorText;
        }
        return updated;
      });
      return { ...prev, tasks: updatedTasks };
    });
  };
  const handleDeleteTask = (taskIdx) => {
    setQuestFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, idx) => idx !== taskIdx)
    }));
  };
  const handleMoveTask = (taskIdx, direction) => {
    setQuestFormData(prev => {
      const newTasks = [...prev.tasks];
      const newIndex = direction === 'up' ? taskIdx - 1 : taskIdx + 1;
      if (newIndex < 0 || newIndex >= newTasks.length) return prev;
      [newTasks[taskIdx], newTasks[newIndex]] = [newTasks[newIndex], newTasks[taskIdx]];
      return { ...prev, tasks: newTasks };
    });
  };

  // Load saved configuration on component mount
  useEffect(() => {
    const loadSavedConfig = async () => {
      if (!classId) {
        console.error('No classId available for loadSavedConfig');
        return;
      }
      
      try {
        setIsLoading(true);
        console.log('🔄 Loading saved quest JSON configuration for class:', classId);
        
        const response = await axios.get(`${baseURL}/api/group/${classId}/quest-json-config`);
        
        console.log('🔍 Debug response data:', response.data);
        console.log('🔍 hasConfig:', response.data.data?.hasConfig);
        console.log('🔍 questJsonConfig:', response.data.data?.questJsonConfig);
        console.log('🔍 questSequence length:', response.data.data?.questJsonConfig?.questSequence?.length);
        
        if (response.data.success && response.data.data.hasConfig && response.data.data.questJsonConfig && response.data.data.questJsonConfig.questSequence && response.data.data.questJsonConfig.questSequence.length > 0) {
          console.log('✅ Loaded existing quest JSON configuration');
          // Validate and fix the loaded configuration, then apply sequential IDs
          const validatedConfig = validateAndFixQuestConfig(response.data.data.questJsonConfig);
          const configWithSequentialIds = {
            ...validatedConfig,
            questSequence: updateQuestIds(validatedConfig.questSequence)
          };
          setJsonContent(configWithSequentialIds);
          setSaveStatusType('success');
          setSaveStatus(`Last saved: ${new Date(response.data.data.lastUpdated).toLocaleString()}`);
          setLastSavedAt(new Date(response.data.data.lastUpdated));
        } else {
          console.log('📭 No existing quest JSON configuration found, loading default quest configuration');
          // Load default quest configuration for new classes
          const defaultConfig = {
            map_repo_link: "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map",
            questSequence: []
          };
          setJsonContent(defaultConfig);
          setSaveStatusType('');
          setSaveStatus('');
          setLastSavedAt(null);
        }
      } catch (error) {
        console.error('Error loading saved configuration:', error);
      } finally {
        setIsLoading(false);
        // Always attempt to load stored values after config loads
        loadStoredValues();
      }
    };

      loadSavedConfig();
  }, [classId]);

  // Also refresh stored values when we save the JSON
  useEffect(() => {
    loadStoredValues();
  }, [lastSavedAt, classId]);

  // Auto-save configuration when jsonContent changes
  useEffect(() => {
    const autoSave = async () => {
      if (!autoSaveEnabled || isLoading || !classId) return;
      
      try {
        setIsSaving(true);
        setSaveStatusType('saving');
        setSaveStatus('Saving quest sequence...');
        console.log('💾 Auto-saving quest JSON configuration...');
        
        // Validate and fix quest configuration before saving
        const validatedConfig = validateAndFixQuestConfig(jsonContent);
        
        const response = await axios.post(`${baseURL}/api/group/${classId}/quest-json-config`, {
          questJsonConfig: validatedConfig
        });
        
        if (response.data.success) {
          setSaveStatusType('success');
          setSaveStatus(`Auto-saved: ${new Date().toLocaleString()}`);
          console.log('✅ Auto-save successful');
          setLastSavedAt(new Date());
          // Clear success status after 3 seconds
          setTimeout(() => {
            setSaveStatusType('');
            setSaveStatus('');
          }, 3000);
        }
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
        setSaveStatusType('error');
        setSaveStatus('Auto-save failed');
        // Clear error status after 5 seconds
        setTimeout(() => {
          setSaveStatusType('');
          setSaveStatus('');
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
      console.error('No classId available for handleManualSave');
      setSaveStatusType('error');
      setSaveStatus('No class ID available');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveStatusType('saving');
      setSaveStatus('Saving quest sequence...');
      console.log('💾 Manually saving quest JSON configuration...');
      
      // Validate and fix quest configuration before saving
      const validatedConfig = validateAndFixQuestConfig(jsonContent);
      
      const response = await axios.post(`${baseURL}/api/group/${classId}/quest-json-config`, {
        questJsonConfig: validatedConfig
      });
      
      if (response.data.success) {
        setSaveStatusType('success');
        setSaveStatus(`Saved: ${new Date().toLocaleString()}`);
        console.log('✅ Manual save successful');
        setLastSavedAt(new Date());
        // Clear success status after 3 seconds
        setTimeout(() => {
          setSaveStatusType('');
          setSaveStatus('');
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Manual save failed:', error);
      setSaveStatusType('error');
      setSaveStatus('Save failed');
      // Clear error status after 5 seconds
      setTimeout(() => {
        setSaveStatusType('');
        setSaveStatus('');
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Create custom repositories function
  const handleCreateCustomRepos = async () => {
    if (!classId) {
      console.error('No classId available for handleCreateCustomRepos');
      setRepoCreationStatus('❌ No class ID available');
      return;
    }
    
    if (!githubUsername.trim()) {
      setRepoCreationStatus('❌ Please enter a GitHub username');
      return;
    }

    try {
      setIsCreatingRepos(true);
      setRepoCreationStatus('🔄 Creating custom repositories...');
      console.log('🚀 Creating custom repos for user:', githubUsername);
      console.log('📄 Using JSON configuration:', jsonContent);

      const response = await axios.post(`${baseURL}/api/repo/createCustomRepos`, {
        users: [githubUsername],
        customSequence: jsonContent,
        className: `custom-quest-${Date.now()}`,
        classId: classId
      });

      console.log('📋 Full response from server:', response.data);
      
      if (response.data.results && response.data.results.successful && response.data.results.successful.length > 0) {
        const repoInfo = response.data.results.successful[0];
        const repoUrl = repoInfo.repoUrl;
        setRepoCreationStatus(`✅ Repository created successfully! 
Repository: ${repoUrl}
Student can now start their quest journey!`);
        console.log('✅ Repository creation successful:', response.data);
      } else if (response.data.results && response.data.results.unsuccessful && response.data.results.unsuccessful.length > 0) {
        const error = response.data.results.unsuccessful[0].error;
        setRepoCreationStatus(`❌ Repository creation failed: ${error}`);
        console.error('❌ Repository creation failed:', response.data);
      } else if (response.data.message) {
        setRepoCreationStatus(`✅ ${response.data.message}`);
        console.log('✅ Repository creation completed:', response.data);
      } else {
        setRepoCreationStatus('❌ Unexpected response from server');
        console.error('❌ Unexpected response structure:', response.data);
      }
    } catch (error) {
      console.error('❌ Error creating repositories:', error);
      setRepoCreationStatus(`❌ Error creating repositories: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsCreatingRepos(false);
    }
  };

  // 5. Refactor handleAddQuest to build the quest.tasks object from questFormData.tasks
  const handleAddQuest = () => {
    // Remove questId generation from frontend
    // const questId = `CUSTOM_${questFormData.questId.toUpperCase().replace(/\s+/g, '_')}`;
    const sequenceNumber = editingQuestIndex !== null ? editingQuestIndex : jsonContent.questSequence.length;
    // Build tasks object
    const tasksObj = {};
    questFormData.tasks.forEach((task, idx) => {
      // Build taskData based on type (reuse your existing logic for each type)
      let taskData = {
        desc: task.taskDesc,
        points: parseInt(task.points),
        xp: parseInt(task.points),
        hints: [],
        detailedHints: task.detailedHints || []
      };
      if (task.taskType === 'multiple-choice') {
        // Store question and options separately, but combine for display
        let acceptText = task.acceptText || '';
        if (task.question) {
          acceptText = `**Question:** ${task.question}\n\n`;
          task.options.forEach(opt => {
            if (opt.value) acceptText += `${opt.label}) ${opt.value}\n`;
          });
          acceptText += `\n**Instructions:** Select the correct answer.`;
        }
        taskData = {
          ...taskData,
          type: 'multiple-choice',
          accept: acceptText,
          success: task.successText.replace('{points}', task.points),
          error: task.errorText,
          answer: task.correctAnswer,
          question: task.question,
          options: task.options
        };
      } else if (task.taskType === 'quiz') {
        // Build complete quiz content for the accept field
        let quizContent = `### 🧠 Quiz\n\n`;
        quizContent += `Quest: ${questFormData.title}\n\n`;
        quizContent += `Description: ${questFormData.description}\n\n`;
        quizContent += `Instructions: Answer all questions and submit your answers in the format [a,b,c,d,e] where each letter corresponds to your answer for each question.\n\n`;
        quizContent += `Example: If you think the answers are A, C, B, D, E, type: [a,c,b,d,e]\n\n`;
        
        task.questions.forEach((q, index) => {
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
          .replace('{points}', task.points)
          .replace('[X]', '{correctCount}')
          .replace('[Y]', task.questions.length);
        taskData = {
          ...taskData,
          type: 'quiz',
          questions: task.questions.filter(q => q.question),
          accept: quizContent,
          success: successText,
          error: task.errorText,
          answer: ''
        };
      } else if (task.taskType === 'get-issue-count' || task.taskType === 'get-pr-count' || task.taskType === 'get-top-contributor' || task.taskType === 'get-open-issue') {
        taskData = {
          ...taskData,
          type: task.taskType,
          ossRepository: task.repository,
          accept: task.acceptText,
          success: task.successText.replace('{points}', task.points),
          error: task.errorText,
          answer: '',
          // per-user save (supported for get-issue-count)
          ...(task.taskType === 'get-issue-count' ? {
            saveValidatedData: Boolean(task.saveValidatedData),
            savedDataName: task.savedDataName || ''
          } : {})
        };
      } else if (task.taskType === 'get-issue-title') {
        taskData = {
          ...taskData,
          type: 'get-issue-title',
          ossRepository: task.repository,
          issueNumber: task.issueNumber,
          accept: task.acceptText,
          success: task.successText.replace('{points}', task.points),
          error: task.errorText,
          answer: '',
          useStoredKey: Boolean(task.useStoredKey),
          selectedStoredKey: task.selectedStoredKey || ''
        };
      } else if (task.taskType === 'issue-no') {
        taskData = {
          ...taskData,
          type: 'issue-no',
          repository: task.repository,
          accept: task.acceptText,
          success: task.successText.replace('{points}', task.points),
          error: task.errorText,
          answer: '',
          saveValidatedData: Boolean(task.saveValidatedData),
          savedDataName: task.savedDataName || ''
        };
      } else if (task.taskType === 'custom-api-call') {
        taskData = {
          ...taskData,
          type: 'custom-api-call',
          apiEndpoint: task.apiEndpoint,
          responsePath: task.responsePath,
          expectedAnswerType: task.expectedAnswerType,
          repository: task.repository,
          enableTolerance: task.enableTolerance || false,
          toleranceRange: task.toleranceRange || 10,
          accept: task.acceptText,
          success: task.successText.replace('{points}', task.points),
          error: task.errorText,
          answer: '',
          saveValidatedData: Boolean(task.saveValidatedData),
          savedDataName: task.savedDataName || ''
        };
      } else if (task.taskType === 'llm-text-validation') {
        taskData = {
          ...taskData,
          type: 'llm-text-validation',
          llmTextValidation: {
            question: task.llmTextValidation?.question || '',
            validationParameters: task.llmTextValidation?.validationParameters || [],
            temperature: task.llmTextValidation?.temperature || 0.1,
            enableDetailedFeedback: task.llmTextValidation?.enableDetailedFeedback || false
          },
          accept: task.acceptText,
          success: task.successText.replace('{points}', task.points),
          error: task.errorText,
          answer: ''
        };
      }
      tasksObj[`T${idx + 1}`] = taskData;
    });
    // Create new quest with temporary ID (will be updated by updateQuestIds)
    const newQuest = {
      questId: `TEMP_${Date.now()}`, // Temporary ID, will be replaced
      title: questFormData.title,
      isQ0: false,
      questType: 'custom',
      sequenceNumber: sequenceNumber,
      metadata: {
        title: questFormData.title,
        description: questFormData.description,
        prerequisite: null, // Will be set by updateQuestIds
        type: 'custom'
      },
      badgeDescription: "Custom Quest 🎯",
      tasks: tasksObj
    };
    
    setJsonContent(prev => {
      let newSequence = [...prev.questSequence];
      if (editingQuestIndex !== null) {
        newSequence[editingQuestIndex] = newQuest;
      } else {
        newSequence = [...newSequence, newQuest];
      }
      // Update quest IDs to be sequential
      const updatedSequence = updateQuestIds(newSequence);
      
      // Save the updated quest to Quest Bank with correct ID
      const updatedQuest = updatedSequence[editingQuestIndex !== null ? editingQuestIndex : updatedSequence.length - 1];
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
        desc: task.taskDesc || task.desc || '',
        points: typeof task.points === 'number' ? task.points : (parseInt(task.points, 10) || 20),
        xp: typeof task.xp === 'number' ? task.xp : (parseInt(task.xp, 10) || parseInt(task.points, 10) || 20),
        responses: {
            accept: task.accept || task.responses?.accept || defaultTexts.acceptText,
            error: task.error || task.responses?.error || defaultTexts.errorText,
            success: task.success || task.responses?.success || defaultTexts.successText
          },
          answerType: task.answerType || (task.taskType === 'custom-api-call' ? 'custom' : 
                                         task.taskType === 'multiple-choice' ? 'singleAnswer' : 
                                         task.taskType === 'quiz' ? 'multipleAnswers' : 
                                         task.taskType === 'llm-text-validation' ? 'llm-validation' : 'metric'),
        answer: task.answer || '',
          type: task.taskType || task.type,
          // Custom API call fields
          apiEndpoint: task.apiEndpoint || '',
          responsePath: task.responsePath || '',
          expectedAnswerType: task.expectedAnswerType || 'Number',
          repository: task.repository || '',
          issueNumber: task.issueNumber || '',
          saveValidatedData: Boolean(task.saveValidatedData),
          savedDataName: task.savedDataName || '',
          // Tolerance fields
          enableTolerance: task.enableTolerance || false,
          toleranceRange: task.toleranceRange || 10,
          // LLM Text Validation fields (ensure required fields when used)
          llmTextValidation: {
            question: (task.llmTextValidation?.question || task.accept || task.responses?.accept || defaultTexts.acceptText || 'Answer the question'),
            validationParameters: task.llmTextValidation?.validationParameters || [],
            temperature: (typeof task.llmTextValidation?.temperature === 'number' ? task.llmTextValidation.temperature : 0.1),
            enableDetailedFeedback: Boolean(task.llmTextValidation?.enableDetailedFeedback)
          },
          // Hints
          detailedHints: task.detailedHints || [],
        // Optionally include other fields as needed
        ...task
        };
      });
      const questBankPayload = {
        ...updatedQuest,
        professorId: authUser?._id,
        questTitle: updatedQuest.title,
        tasks: tasksArray
      };
      console.log('Saving to Quest Bank:', questBankPayload);
      saveQuestToBank(questBankPayload);
      
      return { ...prev, questSequence: updatedSequence };
    });
    // Reset form and close modal
    setQuestFormData({ title: '', description: '', tasks: [] });
    setShowAddQuestModal(false);
    setEditingQuestIndex(null);
  };

  // Quiz helper functions
  const addQuestion = () => {
    setQuestFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'a',
        explanation: ''
      }]
    }));
  };

  const removeQuestion = (taskIdx, qIdx) => {
    setQuestFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, tIdx) => {
        if (tIdx !== taskIdx) return task;
        return {
          ...task,
          questions: task.questions.filter((_, i) => i !== qIdx)
        };
      })
    }));
  };

  const updateQuestion = (taskIdx, qIdx, field, value) => {
    setQuestFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, tIdx) => {
        if (tIdx !== taskIdx) return task;
        return {
          ...task,
          questions: task.questions.map((q, i) =>
            i === qIdx ? { ...q, [field]: value } : q
          )
        };
      })
    }));
  };

  // README handling functions
  const handleReadmeFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setReadmeContent(content);
        setShowReadmeModal(true);
      };
      reader.readAsText(file);
    } else {
      alert('Please select a .md file');
    }
    // Reset the input
    event.target.value = '';
  };

  const handleReadmeSave = () => {
    setJsonContent(prev => ({
      ...prev,
      readme: readmeContent
    }));
    setShowReadmeModal(false);
  };

  const handleReadmeRemove = () => {
    setJsonContent(prev => {
      const newContent = { ...prev };
      delete newContent.readme;
      return newContent;
    });
    setReadmeContent('');
  };

  // Quest management functions
  const moveQuest = (questIndex, direction) => {
    const newIndex = direction === 'up' ? questIndex - 1 : questIndex + 1;
    if (newIndex < 0 || newIndex >= jsonContent.questSequence.length) return;

    setJsonContent(prev => {
      const newQuestSequence = [...prev.questSequence];
      const [movedQuest] = newQuestSequence.splice(questIndex, 1);
      newQuestSequence.splice(newIndex, 0, movedQuest);
      
      // Update quest IDs to be sequential based on new positions
      return { ...prev, questSequence: updateQuestIds(newQuestSequence) };
    });
  };

  // 2. Update editQuest to open modal with quest data
  const editQuest = (questIndex) => {
    const quest = jsonContent.questSequence[questIndex];
    console.log('🔍 [editQuest] Loading quest:', quest);
    const tasksArr = Object.entries(quest.tasks).map(([taskId, task]) => {
      // Map all possible fields for all task types
      const baseTask = {
        ...task,
        taskType: task.type,
        taskDesc: task.desc || '',
        points: task.points ?? 0,
        acceptText: task.accept || task.responses?.accept || '',
        successText: task.success || task.responses?.success || '',
        errorText: task.error || task.responses?.error || '',
        answer: task.answer || '',
        answerType: task.answerType || '',
        repository: task.repository || task.ossRepository || '',
        issueNumber: task.issueNumber || '',
        options: Array.isArray(task.options) ? task.options : [
          { label: 'A', value: task.optionA || '' },
          { label: 'B', value: task.optionB || '' },
          ...(task.optionC ? [{ label: 'C', value: task.optionC }] : []),
          ...(task.optionD ? [{ label: 'D', value: task.optionD }] : []),
          ...(task.optionE ? [{ label: 'E', value: task.optionE }] : [])
        ],
        correctAnswer: task.correctAnswer || task.answer || '',
        question: task.question || '',
        questions: Array.isArray(task.questions) ? task.questions : [],
        hints: Array.isArray(task.hints) ? task.hints : [],
        detailedHints: Array.isArray(task.detailedHints) ? task.detailedHints : [],
        // Tolerance fields
        enableTolerance: task.enableTolerance || false,
        toleranceRange: task.toleranceRange || 10,
      };
      // Fallbacks for MCQ
      if (baseTask.taskType === 'multiple-choice') {
        // Try to recover options and correct answer if missing
        if ((!baseTask.options || baseTask.options.length < 2) && baseTask.acceptText) {
          // More robust regex: tolerate extra spaces/line breaks
          const optionRegex = /^\s*([A-E])\)\s+(.+)$/gm;
          let match;
          const options = [];
          while ((match = optionRegex.exec(baseTask.acceptText)) !== null) {
            options.push({ label: match[1], value: match[2].trim() });
          }
          if (options.length >= 2) baseTask.options = options;
        }
        if (!baseTask.options || baseTask.options.length < 2) {
          baseTask.options = [
            { label: 'A', value: '' },
            { label: 'B', value: '' }
          ];
        }
        // Always set correctAnswer from answer if present
        if (typeof task.answer === 'string' && task.answer.length === 1) {
          baseTask.correctAnswer = task.answer.toUpperCase();
        }
        if (!baseTask.correctAnswer) baseTask.correctAnswer = 'A';
        if (!baseTask.question && baseTask.acceptText) {
          const questionMatch = baseTask.acceptText.match(/\*\*Question:\*\* ([\s\S]+?)(?=\n\n|$)/);
          if (questionMatch) {
            baseTask.question = questionMatch[1].trim();
          }
        }
      }
      // Fallbacks for quiz
      if (baseTask.taskType === 'quiz') {
        if (!baseTask.questions || !Array.isArray(baseTask.questions)) {
          baseTask.questions = [];
        }
        // Always set each question's correctAnswer from the question object, or from a global answer array if present
        baseTask.questions = baseTask.questions.map((q, idx) => ({
          question: q.question || '',
          optionA: q.optionA || '',
          optionB: q.optionB || '',
          optionC: q.optionC || '',
          optionD: q.optionD || '',
          correctAnswer: q.correctAnswer || (Array.isArray(task.answer) ? task.answer[idx] : ''),
          explanation: q.explanation || ''
        }));
      }
      // Fallbacks for repo analysis
      if ([
        'get-issue-count',
        'get-pr-count',
        'get-top-contributor',
        'get-open-issue',
        'get-issue-title'
      ].includes(baseTask.taskType)) {
        if (!baseTask.repository) baseTask.repository = '';

      }
      if (baseTask.taskType === 'get-issue-title' && !baseTask.issueNumber) {
        baseTask.issueNumber = '';
      }
      
      // Fallbacks for comment validation tasks
      if (baseTask.taskType === 'comment') {
        console.log('🔍 [editQuest] Processing comment task:', baseTask);
        // Map repository field from various possible sources
        baseTask.repository = baseTask.repository || baseTask.ossRepository || '';
        // Map issue number field
        baseTask.issueNumber = baseTask.issueNumber || '';
        // Ensure accept, success, and error texts are preserved from various sources
        baseTask.acceptText = baseTask.acceptText || baseTask.accept || baseTask.responses?.accept || '';
        baseTask.successText = baseTask.successText || baseTask.success || baseTask.responses?.success || '';
        baseTask.errorText = baseTask.errorText || baseTask.error || baseTask.responses?.error || '';
        // Ensure taskType is preserved
        baseTask.taskType = baseTask.taskType || baseTask.type || 'comment';
        console.log('🔍 [editQuest] Comment task after processing:', baseTask);
      }
      return baseTask;
    });
    console.log('🔍 [editQuest] Final questFormData:', {
      title: quest.title,
      description: quest.metadata?.description || '',
      tasks: tasksArr
    });
    setQuestFormData({
      title: quest.title,
      description: quest.metadata?.description || '',
      tasks: tasksArr
    });
    setEditingQuestIndex(questIndex);
    setShowAddQuestModal(true);
  };

  const deleteQuest = (questIndex) => {
    setJsonContent(prev => {
      const newQuestSequence = prev.questSequence.filter((_, index) => index !== questIndex);
      
      // Update quest IDs to be sequential based on new positions
      return { ...prev, questSequence: updateQuestIds(newQuestSequence) };
    });
  };

  const moveTask = (questIndex, taskId, direction) => {
    setJsonContent(prev => {
      const newQuestSequence = [...prev.questSequence];
      const quest = newQuestSequence[questIndex];
      const taskEntries = Object.entries(quest.tasks);
      const currentIndex = taskEntries.findIndex(([key]) => key === taskId);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= taskEntries.length) return prev;
      
      // Swap the tasks in the array
      [taskEntries[currentIndex], taskEntries[newIndex]] = [taskEntries[newIndex], taskEntries[currentIndex]];
      
      // Rebuild tasks object with new ordering but keeping T1, T2, T3... keys
      const newTasks = {};
      taskEntries.forEach(([_, taskData], index) => {
        newTasks[`T${index + 1}`] = taskData;
      });
      
      quest.tasks = newTasks;
      return { ...prev, questSequence: newQuestSequence };
    });
  };

  const editTask = (questIndex, taskId) => {
    // TODO: Implement task editing
    console.log('Edit task', questIndex, taskId);
  };

  const deleteTask = (questIndex, taskId) => {
    setJsonContent(prev => {
      const newQuestSequence = [...prev.questSequence];
      const quest = newQuestSequence[questIndex];
      delete quest.tasks[taskId];
      
      // Renumber remaining tasks
      const taskEntries = Object.entries(quest.tasks);
      quest.tasks = {};
      taskEntries.forEach(([_, taskData], index) => {
        quest.tasks[`T${index + 1}`] = taskData;
      });
      
      return { ...prev, questSequence: newQuestSequence };
    });
  };

  const generateDefaultTexts = (taskType, repository, issueNumber) => {
    const defaults = {
      acceptText: '',
      successText: '',
      errorText: ''
    };

    switch (taskType) {
      case 'multiple-choice':
        defaults.acceptText = `**Instructions:** Select the correct answer.`;
        defaults.successText = `✅ **Correct!**\n\nExcellent! You've answered correctly.\n\n**Points earned:** {points}\n\nGreat work! 🎉`;
        defaults.errorText = `❌ **Incorrect Answer**\n\nThat's not the right answer. Please review the question and try again.\n\n**Hint:** Think carefully about the options.\n\nYou can type "help" for additional guidance.`;
        break;

      case 'quiz':
        defaults.acceptText = `**Multi-Question Quiz**\n\n**Instructions:** Answer all questions and submit your answers in the format [a,b,c] where each letter corresponds to your answer for each question.\n\n**Example:** If you think the answers are A, C, B, type: [a,c,b]\n\n[Quiz questions will be displayed here]`;
        defaults.successText = `✅ **Quiz Completed!**\n\nExcellent work! You've completed the quiz.\n\n**Points earned:** {points}\n\nYou correctly answered [X] out of [Y] questions! ��`;
        defaults.errorText = `❌ **Quiz Submission Error**\n\nPlease check your answer format and try again.\n\n**Required format:** [a,b,c] where each letter is your answer choice.\n\n**Example:** [a,c,b,d]\n\nYou can type "help" for additional guidance.`;
        break;

      case 'get-issue-count':
        defaults.acceptText = `**Task:** Go to the repository https://github.com/${repository || '[repository]'} and count the number of open issues. Reply with the number.\n\n**Help:** Look for the 'Issues' tab on the repository page. Make sure you're counting issues, not pull requests.`;
        defaults.successText = `✅ **Correct Answer!**\n\nGreat job! You've successfully analyzed the repository and counted the open issues.\n\n**What you learned:** Repository issue tracking is essential for project management.\n\n**Points earned:** {points}\n\nExcellent research skills! 🔍`;
        defaults.errorText = `❌ **Incorrect Answer**\n\nThat's not the right number of open issues. Please check the repository again.\n\n**Hint:** Make sure you're looking at the 'Issues' tab, not 'Pull requests'.\n\nYou can type "help" for additional hints.`;
        break;

      case 'get-pr-count':
        defaults.acceptText = `**Task:** Go to the repository https://github.com/${repository || '[repository]'} and count the number of open pull requests. Reply with the number.\n\n**Help:** Look for the 'Pull requests' tab on the repository page. Count only the open pull requests.`;
        defaults.successText = `✅ **Correct Answer!**\n\nExcellent! You've successfully analyzed the repository and counted the open pull requests.\n\n**What you learned:** Pull requests indicate active development and community contributions.\n\n**Points earned:** {points}\n\nGreat analysis skills! 🚀`;
        defaults.errorText = `❌ **Incorrect Answer**\n\nThat's not the right number of open pull requests. Please check the repository again.\n\n**Hint:** Make sure you're looking at the 'Pull requests' tab, not 'Issues'.\n\nYou can type "help" for additional hints.`;
        break;

      case 'get-top-contributor':
        defaults.acceptText = `**Task:** Go to the repository https://github.com/${repository || '[repository]'} and find the top contributor (user with the most commits). Reply with their GitHub username.\n\n**Help:** Look at the 'Insights' tab, then 'Contributors' to see commit statistics.`;
        defaults.successText = `✅ **Correct Answer!**\n\nOutstanding! You've successfully identified the top contributor to this repository.\n\n**What you learned:** Understanding contributor patterns helps identify key maintainers in open source projects.\n\n**Points earned:** {points}\n\nExcellent detective work! 🕵️`;
        defaults.errorText = `❌ **Incorrect Answer**\n\nThat's not the top contributor. Please check the repository again.\n\n**Hint:** Go to Insights → Contributors and look for the user with the most commits.\n\nYou can type "help" for additional hints.`;
        break;

      case 'get-issue-title':
        defaults.acceptText = `**Task:** Go to the repository https://github.com/${repository || '[repository]'} and find issue #${issueNumber || '[issue-number]'}. Reply with the exact title of that issue.\n\n**Help:** Navigate to the Issues tab and look for the specific issue number.`;
        defaults.successText = `✅ **Correct Answer!**\n\nPerfect! You've successfully found and identified the issue title.\n\n**What you learned:** Issue titles provide quick context about problems and discussions in projects.\n\n**Points earned:** {points}\n\nGreat attention to detail! 📋`;
        defaults.errorText = `❌ **Incorrect Answer**\n\nThat's not the correct issue title. Please check the repository again.\n\n**Hint:** Make sure you're looking at the right issue number and copying the title exactly.\n\nYou can type "help" for additional hints.`;
        break;

      case 'get-open-issue':
        defaults.acceptText = `**Task:** Go to the repository https://github.com/${repository || '[repository]'} and count the number of open issues. Reply with the number.\n\n**Help:** Look for the 'Issues' tab on the repository page. Count only the open issues, not closed ones.`;
        defaults.successText = `✅ **Correct Count!**\n\nExcellent! You've successfully counted the open issues in the repository.\n\n**What you learned:** Understanding issue counts helps assess project activity and maintenance needs.\n\n**Points earned:** {points}\n\nGreat attention to detail! 📊`;
        defaults.errorText = `❌ **Incorrect Count**\n\nThat's not the right number of open issues. Please check the repository again.\n\n**Hint:** Make sure you're looking at the 'Issues' tab and counting only open issues.\n\nYou can type "help" for additional hints.`;
        break;

      case 'assigned':
        defaults.acceptText = `### 🎯 Assignment Validation Task\n\n**Task:** You must find who is assigned to issue #${issueNumber || '[issue-number]'} in the repository https://github.com/${repository || '[repository]'}.\n\n**Instructions:** Go to the issue and find the assigned user, then type their GitHub username in the comment box below.\n\n**Help:** If you need assistance, type "help" in the comment box to receive hints, but remember, each hint will cost you 5 points from your total score.`;
        defaults.successText = `### 🌟 Congratulations! You Successfully Identified the Assigned User!\n\nGreat job! You've demonstrated an important skill in open-source collaboration: tracking issue ownership. This ensures clarity, accountability, and smooth teamwork in any project.\n\n**Points earned:** 25\n\n🏆 **Current Progress:** With this achievement, you've earned 25 points, bringing you 75 points closer to Level 2!\n\n🎯 **Quest Advancement:** You're mastering the fundamentals of GitHub issue management. Understanding who is responsible for which task is key to contributing effectively and ensuring the project moves forward efficiently.\n\n💡 Keep up the great work! Your next challenge is just around the corner—let's continue this journey together! 🚀`;
        defaults.errorText = `### ❌ Incorrect Username\n\nThe username you provided is not assigned to issue #88 in the probot-test-org/test-repo repository.\n\n**Please ensure:**\n1. You're looking at the correct issue (#88)\n2. You're checking the right repository\n3. You're typing the exact username of the person assigned to the issue\n\n[Click here to view the issue](https://github.com/probot-test-org/test-repo/issues/88)`;
        break;

      case 'issue-no':
        defaults.acceptText = `### 🎯 Task: Choose an Issue to Work On\n\n**Task:** Go to the GitHub repository using the link below, find an issue that you would like to work on, and type its issue number in the comment box below.\n\n**Outcome:** By selecting an issue to work on, you are taking the first step towards contributing to the project and becoming part of the OSS community. This task helps you engage with the project's needs actively and lays the groundwork for your upcoming contributions.\n\n**Help:** If you need help with this task, type "help" in the comment box to get hints, but it will cost you 5 points from your total score.`;
        defaults.successText = `### 🌟 Congratulations! You've Selected Your First Issue!\n\nBy choosing an issue to focus on, you've taken a significant step in your journey of contribution to our project. Your willingness to engage and make a difference showcases your commitment to the community and project advancement.\n\n**Points earned:** {points}\n\n🌟 🌟 🌟\n\n🏆 **Current Progress:** Good work! You currently have {points} points and you've started your journey towards achieving greater milestones.\n\n🎯 **Quest Advancement:** This task not only brings you closer to mastering the collaboration process within GitHub but also highlights your growing role within our community.\n\n🌟 🌟 🌟\n\nFantastic effort! You're proving to be an essential part of our journey towards developing a project that we can all be proud of. 🌟`;
        defaults.errorText = `### ❌ Issue Not Found\n\nThe issue number you provided does not exist in the ${repository || '[repository]'} repository.\n\n**Please ensure:**\n1. You're checking the right repository\n2. You're typing a valid issue number\n3. The issue actually exists\n\n[Click here to view all issues](https://github.com/${repository || '[repository]'}/issues)`;
        break;

      case 'custom-api-call':
        defaults.acceptText = `### 🔍 Custom API Call Task\n\n**Task:** This task will call a GitHub API to retrieve information about the repository. Please provide your answer based on the question below.\n\n**Repository:** ${repository || '[repository]'}\n\n**Question:** [Question will be displayed here]\n\n**Help:** If you need help with this task, type "help" in the comment box to get hints, but it will cost you 5 points from your total score.`;
        defaults.successText = `### 🌟 Congratulations! API Call Successful!\n\nExcellent work! You've successfully answered the question based on the GitHub API data.\n\n**What you learned:** Working with APIs helps you understand how to programmatically access and analyze repository information.\n\n**Points earned:** {points}\n\nGreat analytical skills! 🔍`;
        defaults.errorText = `### ❌ Incorrect Answer\n\nThat's not the correct answer based on the GitHub API data. Please check your response and try again.\n\n**Hint:** Make sure you're providing the exact information requested by the question.\n\nYou can type "help" for additional hints.`;
        break;

      case 'comment':
        defaults.acceptText = `### 🎯 Task: Post a Comment in the Issue\n\n**Objective:** Engagement and communication are vital elements of collaborative work in Open Source Software projects. Your mission is to post a comment in the specified issue to demonstrate your ability to engage with the community.\n\n**Task:** Using the link below, go to issue #${issueNumber || '[issue-number]'} in the repository ${repository || '[repository]'}, post a **brief comment** introducing yourself or sharing your thoughts, and then type **"done"** in the comment box below.\n\n**Outcome:** By posting a comment in the issue, you are taking an important step toward becoming an active part of the project's community. This fosters an environment of openness and collaboration, making it easier for other contributors to offer support, guidance, and feedback.\n\n**Help:** If you need help with this task, type "help" in the comment box to get hints, but it will cost you 5 points from your total score.\n\n[Click here to view the issue](https://github.com/${repository || '[repository]'}/issues/${issueNumber || '[issue-number]'})`;
        defaults.successText = `### 🌟 Congratulations! You've Successfully Posted a Comment!\n\nExcellent work! You've successfully engaged with the community by posting a comment in the issue. This demonstrates your willingness to communicate and collaborate effectively in open-source projects.\n\n**What you learned:** Community engagement is crucial for successful open-source collaboration. Your comment helps build connections and fosters a supportive environment for future contributions.\n\n**Points earned:** {points}\n\n🏆 **Current Progress:** With this achievement, you've earned {points} points!\n\n🎯 **Quest Advancement:** You're mastering the fundamentals of GitHub community engagement. Understanding how to communicate effectively in issue threads is key to contributing successfully to any project.\n\n💡 Keep up the great work! Your next challenge is just around the corner—let's continue this journey together! 🚀`;
        defaults.errorText = `### ❌ Comment Not Found\n\nIt looks like you haven't posted a comment in issue #${issueNumber || '[issue-number]'} yet, or you didn't type "done" after posting your comment.\n\n**Please ensure:**\n1. You've actually posted a comment in the issue\n2. You've typed "done" in the comment box below after posting your comment\n3. You're looking at the correct issue (#${issueNumber || '[issue-number]'})\n4. You're checking the right repository\n\n**Steps to complete:**\n1. Go to the issue using the link below\n2. Scroll down to the comment section\n3. Post your comment\n4. Return here and type "done"\n\n[Click here to view the issue](https://github.com/${repository || '[repository]'}/issues/${issueNumber || '[issue-number]'})`;
        break;

      default:
        break;
    }

    return defaults;
  };

  const handleFormChange = (field, value) => {
    setQuestFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Auto-generate default texts when task type, repository, or issue number changes
      if (field === 'taskType' || field === 'repository' || field === 'issueNumber') {
        const defaults = generateDefaultTexts(
          field === 'taskType' ? value : prev.taskType,
          field === 'repository' ? value : prev.repository,
          field === 'issueNumber' ? value : prev.issueNumber
        );
        
        // Only update if the current text is empty or still the default
        if (!prev.acceptText || prev.acceptText === generateDefaultTexts(prev.taskType, prev.repository, prev.issueNumber).acceptText) {
          updated.acceptText = defaults.acceptText;
        }
        if (!prev.successText || prev.successText === generateDefaultTexts(prev.taskType, prev.repository, prev.issueNumber).successText) {
          updated.successText = defaults.successText;
        }
        if (!prev.errorText || prev.errorText === generateDefaultTexts(prev.taskType, prev.repository, prev.issueNumber).errorText) {
          updated.errorText = defaults.errorText;
        }
      }

      return updated;
    });
  };

  const handleDownloadJson = () => {
    try {
      const dataStr = JSON.stringify(jsonContent, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'reshape1.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setDownloadStatus('✅ JSON file downloaded successfully!');
      setTimeout(() => setDownloadStatus(''), 3000);
    } catch (error) {
      setDownloadStatus('❌ Error downloading JSON file');
      setTimeout(() => setDownloadStatus(''), 3000);
    }
  };

  const questCount = jsonContent.questSequence.length;
  const totalTasks = jsonContent.questSequence.reduce((total, quest) => {
    return total + Object.keys(quest.tasks).length;
  }, 0);

  // Show loading state
  if (isLoading) {
    return (
      <div>
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
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
    setQuestFormData(prev => {
      const updatedTasks = prev.tasks.map((task, idx) => {
        if (idx !== taskIdx) return task;
        if (task.options.length >= 5) return task;
        const nextLabel = String.fromCharCode(65 + task.options.length); // 'C', 'D', 'E'
        return { ...task, options: [...task.options, { label: nextLabel, value: '' }] };
      });
      return { ...prev, tasks: updatedTasks };
    });
  };
  const handleRemoveOption = (taskIdx, optionIdx) => {
    setQuestFormData(prev => {
      const updatedTasks = prev.tasks.map((task, idx) => {
        if (idx !== taskIdx) return task;
        if (optionIdx < 2) return task; // Don't allow removing A or B
        const newOptions = task.options.filter((_, i) => i !== optionIdx);
        // If correctAnswer is now out of range, reset to 'a'
        let correctAnswer = task.correctAnswer;
        if (optionIdx === task.options.findIndex(opt => opt.label.toLowerCase() === correctAnswer)) {
          correctAnswer = 'a';
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
        await axios.put(`/api/generatejson/quest/${questData._id}`, questData);
      } else {
        await axios.post('/api/generatejson/quest', questData);
      }
      fetchLibraryQuests();
    } catch (err) {
      console.error('Failed to save quest to bank', err);
    }
  };

  // Add this before the return statement in GenerateJson:
  const isAddQuestDisabled =
    !questFormData.title.trim() ||
    questFormData.tasks.length === 0 ||
    questFormData.tasks.some(task => {
      if (task.taskType === 'multiple-choice') {
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
    content: '',
    image: '',
    video: null,
    sequence: 1,
    penalty: 5
  });

  const handleAddHint = (questIdx, taskIdx) => {
    // In the dialog context, we're always working with questFormData
    setQuestFormData(prev => {
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
    setQuestFormData(prev => {
      const updated = { ...prev };
      if (!updated.tasks[taskIdx]) {
        return prev;
      }
      if (!updated.tasks[taskIdx].detailedHints) {
        updated.tasks[taskIdx].detailedHints = [];
      }
      if (updated.tasks[taskIdx].detailedHints[hintIdx]) {
        updated.tasks[taskIdx].detailedHints[hintIdx][field] = field === 'penalty' ? Number(value) : value;
      }
      return updated;
    });
  };

  const handleRemoveHint = (questIdx, taskIdx, hintIdx) => {
    // In the dialog context, we're always working with questFormData
    setQuestFormData(prev => {
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
      const res = await axios.get(`${baseURL}/api/group/${classId}/stored-values`);
      const keys = res.data?.data?.keys || [];
      const valuesByUser = res.data?.data?.valuesByUser || {};
      setStoredKeys(keys);
      setStoredValuesByUser(valuesByUser);
    } catch (e) {
      console.error('Failed to load stored data:', e);
    }
  }

  return (
    <div>
      <Container maxWidth="lg" sx={{ py: 4, width: '100%', textAlign: 'left' }}>
        {/* Page Title */}
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
            Manage Class Quests
          </Typography>
          {/* Save Status and Controls */}
        <Box mb={4} p={3} sx={{ 
          bgcolor: 'white', 
          borderRadius: 4, 
          boxShadow: 'none', 
          border: '1px solid #e0e0e0',
          ...(saveStatusType === 'success' && {
            borderColor: '#4caf50',
            bgcolor: '#f1f8e9'
          }),
          ...(saveStatusType === 'error' && {
            borderColor: '#f44336',
            bgcolor: '#ffebee'
          }),
          ...(saveStatusType === 'saving' && {
            borderColor: '#ff9800',
            bgcolor: '#fff3e0'
          })
        }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" spacing={2}>
              <Box>
              {saveStatusType === 'saving' ? (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  <CircularProgress size={16} sx={{ color: '#ff9800' }} />
                  <Typography variant="body2" sx={{ ml: 1, color: '#ff9800', fontWeight: 500 }}>
                  {saveStatus}
                      </Typography>
                    </Box>
              ) : saveStatusType === 'success' ? (
                <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 500 }}>
                  {saveStatus}
                </Typography>
              ) : saveStatusType === 'error' ? (
                <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 500 }}>
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
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 4,
              height: 150,
              fontWeight: 500,
              minWidth: 120,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 1 }}>
              Quests
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '2.5rem' }}>
              {questCount}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: '#ff5722',
              color: 'white',
              borderRadius: 4,
              height: 150,
              fontWeight: 500,
              minWidth: 120,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 1 }}>
              Total Tasks
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '2.5rem' }}>
              {totalTasks}
            </Typography>
          </Box>
            </Stack>

        {/* JSON Preview Card */}
        <Card sx={{ mb: 4, borderRadius: 4, boxShadow: 'none' }}>
          <Box p={3}>
            {/* README and Quest Management Buttons */}
            <Box mb={3}>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {/* README Upload */}
                <Box>
                  {!jsonContent.readme ? (
                    <>
                  <input
                    accept=".md"
                    style={{ display: 'none' }}
                    id="readme-upload"
                    type="file"
                    onChange={handleReadmeFileUpload}
                  />
                  <label htmlFor="readme-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<DescriptionIcon />}
                      sx={{
                        borderColor: '#2196f3',
                        color: '#2196f3',
                            borderRadius: 4,
                        '&:hover': {
                          borderColor: '#1976d2',
                          backgroundColor: '#e3f2fd'
                        }
                      }}
                    >
                      Add README (.md)
                    </Button>
                  </label>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<DescriptionIcon />}
                      onClick={() => {
                        setReadmeContent(jsonContent.readme);
                        setShowReadmeModal(true);
                      }}
                          sx={{ 
                        borderColor: '#2196f3',
                        color: '#2196f3',
                        borderRadius: 4,
                        '&:hover': {
                          borderColor: '#1976d2',
                          backgroundColor: '#e3f2fd'
                        }
                      }}
                    >
                      README Added
                    </Button>
                  )}
                </Box>

                {/* Add Quest Button */}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddQuestModal(true)}
                  sx={{
                    borderColor: '#4caf50',
                    color: '#4caf50',
                    borderRadius: 4,
                    '&:hover': {
                      borderColor: '#388e3c',
                      backgroundColor: '#f1f8e9'
                    }
                  }}
                >
                  Add New Quest
                </Button>

                {/* Quest Bank Button */}
                <Button
                  variant="outlined"
                  startIcon={<LibraryBooksIcon />}
                  onClick={handleOpenLibrary}
                  sx={{
                    borderColor: '#ff9800',
                    color: '#ff9800',
                    borderRadius: 4,
                    '&:hover': {
                      borderColor: '#f57c00',
                      backgroundColor: '#fff3e0'
                    }
                  }}
                >
                  Quest Bank
                </Button>
              </Stack>
            </Box>

            {/* Close top section Card */}
          </Box>
        </Card>

        {/* Quest Sequence Builder Section */}
        <Card sx={{ mb: 4, borderRadius: 4, boxShadow: 'none' }}>
          <Box p={3}>
            {/* Quest Blocks Interface */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" component="h3" sx={{ fontWeight: 700, mb: 1 }}>
                Quest Sequence Builder
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use arrows to reorder quests. Tasks can be reordered within their quest.
              </Typography>
              
              {jsonContent.questSequence.map((quest, questIndex) => (
                <QuestBlock
                  key={quest.questId}
                  quest={quest}
                  questIndex={questIndex}
                  totalQuests={jsonContent.questSequence.length}
                  onMoveQuest={moveQuest}
                  onEditQuest={editQuest}
                  onDeleteQuest={deleteQuest}
                  onMoveTask={moveTask}
                  onEditTask={editTask}
                  onDeleteTask={deleteTask}
                />
              ))}
            </Box>

            {/* Toggle JSON View */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                sx={{ borderRadius: 4 }}
              >
                {showJsonPreview ? 'Hide JSON Preview' : 'Show JSON Preview'}
              </Button>
            </Box>

            {/* Collapsible JSON Preview */}
            {showJsonPreview && (
              <Paper 
                sx={{ 
                  mt: 2,
                  p: 2, 
                  bgcolor: '#f8f9fa', 
                  maxHeight: '400px', 
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  borderRadius: 4,
                  border: '1px solid #e0e0e0'
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(jsonContent, null, 2)}
                </pre>
              </Paper>
            )}
          </Box>
        </Card>

        {/* Add Quest Modal */}
        <Dialog 
          open={showAddQuestModal} 
          onClose={() => {
          setShowAddQuestModal(false);
          setEditingQuestIndex(null);
          setQuestFormData({ title: '', description: '', tasks: [] });
          }} 
          maxWidth="lg" 
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
              {editingQuestIndex !== null ? 'Edit Quest' : 'Add New Quest'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={4}>
              {/* Quest Basic Info */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                  Quest Information
                </Typography>
              
              <TextField
                label="Quest Title"
                value={questFormData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="e.g., Python Programming Basics"
                fullWidth
                  sx={{ mb: 2 }}
              />
              
              <TextField
                label="Quest Description"
                value={questFormData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Brief description of what students will learn"
                fullWidth
                multiline
                  rows={3}
              />
              </Box>

              <Divider />

              {/* Task Configuration */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                  Tasks ({questFormData.tasks.length})
                </Typography>
              
              {questFormData.tasks.map((task, taskIdx) => {
                console.log(`🔍 [Form Render] Task ${taskIdx}:`, task);
                return (
                  <Card 
                    key={taskIdx} 
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      borderRadius: 4,
                      boxShadow: 'none',
                      p: 3,
                      mb: 2,
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: '#f8f9fa'
                      }
                    }}
                  >
                    <Stack spacing={3}>
                      {/* Task Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Task {taskIdx + 1}
                      </Typography>
                      {questFormData.tasks.length > 1 && (
                          <Stack direction="row" spacing={1}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                border: '1px solid #f44336',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: '#ffebee',
                                  borderColor: '#d32f2f'
                                }
                              }}
                            onClick={() => handleDeleteTask(taskIdx)}
                          >
                              <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 40,
                                height: 40,
                                borderRadius: 4,
                                border: '1px solid #2196f3',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                opacity: taskIdx === 0 ? 0.5 : 1,
                                '&:hover': {
                                  backgroundColor: taskIdx === 0 ? 'white' : '#e3f2fd',
                                  borderColor: taskIdx === 0 ? '#e0e0e0' : '#1976d2'
                                }
                              }}
                              onClick={() => taskIdx !== 0 && handleMoveTask(taskIdx, 'up')}
                            >
                              <ArrowUpwardIcon fontSize="small" sx={{ color: '#2196f3' }} />
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 40,
                                height: 40,
                                borderRadius: 4,
                                border: '1px solid #2196f3',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                opacity: taskIdx === questFormData.tasks.length - 1 ? 0.5 : 1,
                                '&:hover': {
                                  backgroundColor: taskIdx === questFormData.tasks.length - 1 ? 'white' : '#e3f2fd',
                                  borderColor: taskIdx === questFormData.tasks.length - 1 ? '#e0e0e0' : '#1976d2'
                                }
                              }}
                              onClick={() => taskIdx !== questFormData.tasks.length - 1 && handleMoveTask(taskIdx, 'down')}
                            >
                              <ArrowDownwardIcon fontSize="small" sx={{ color: '#2196f3' }} />
                            </Box>
                          </Stack>
                      )}
                    </Box>
                    
                      {/* Task Type Selection */}
                    <FormControl fullWidth>
                      <InputLabel>Task Type</InputLabel>
                      <Select
                        value={task.taskType}
                        onChange={(e) => handleTaskChange(taskIdx, 'taskType', e.target.value)}
                        label="Task Type"
                          sx={{ borderRadius: 2 }}
                        >
                          {/* Custom API Call - Most Prominent */}
                          <MenuItem 
                            value="custom-api-call"
                            sx={{
                              backgroundColor: '#e3f2fd',
                              fontWeight: 'bold',
                              borderBottom: '2px solid #2196f3',
                              '&:hover': {
                                backgroundColor: '#bbdefb'
                              }
                            }}
                          >
                            Custom API Call
                          </MenuItem>
                          
                          <Divider />
                          
                          {/* Default Task Types */}
                          <ListSubheader sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', color: '#666' }}>
                            Default Task Types
                          </ListSubheader>
                          
                        <MenuItem value="multiple-choice">Multiple Choice Question (MCQ)</MenuItem>
                        <MenuItem value="quiz">Multi-Question Quiz</MenuItem>
                        <MenuItem value="get-issue-count">Get Issue Count</MenuItem>
                        <MenuItem value="get-pr-count">Get Pull Request Count</MenuItem>
                        <MenuItem value="get-top-contributor">Get Top Contributor</MenuItem>
                        <MenuItem value="get-issue-title">Get Issue Title</MenuItem>
                        <MenuItem value="get-open-issue">Get Open Issue Count</MenuItem>
                        <MenuItem value="assigned">Assignment Validation</MenuItem>
                        <MenuItem value="issue-no">Issue Number Validation</MenuItem>
                          <MenuItem value="comment">Comment Validation</MenuItem>
                          
                          <Divider />
                          
                          {/* AI-Powered Task Types */}
                          <ListSubheader sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', color: '#666' }}>
                            AI-Powered Task Types
                          </ListSubheader>
                          
                          <MenuItem 
                            value="llm-text-validation"
                            sx={{
                              backgroundColor: '#fff3e0',
                              fontWeight: 'bold',
                              borderBottom: '2px solid #ff9800',
                              '&:hover': {
                                backgroundColor: '#ffe0b2'
                              }
                            }}
                          >
                            LLM Text Validation
                          </MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Task Description"
                      value={task.taskDesc}
                      onChange={(e) => handleTaskChange(taskIdx, 'taskDesc', e.target.value)}
                      placeholder="Brief description of the task"
                      fullWidth
                        sx={{ borderRadius: 2 }}
                    />

                    <TextField
                      label="Points/XP"
                      type="number"
                      value={task.points}
                      onChange={(e) => handleTaskChange(taskIdx, 'points', e.target.value)}
                      fullWidth
                        sx={{ borderRadius: 2 }}
                    />

                    <Divider />

                    {/* Question Text Field */}
                    {task.taskType !== 'multiple-choice' && (
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                            Question Text
                          </Typography>
                          <TextEditor
                          value={task.acceptText}
                            onChange={(value) => handleTaskChange(taskIdx, 'acceptText', value)}
                            label="Question Text"
                          placeholder="This text appears when the task is first presented to students"
                            helperText="This is the main question text. You can type directly or upload a text file."
                            acceptFileTypes=".txt,.md,.markdown,text/plain,text/markdown"
                          />
                        </Box>
                    )}

                    {/* Conditional Fields based on Task Type */}
                    {task.taskType === 'multiple-choice' && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
                            Multiple Choice Question
                          </Typography>
                        <TextField
                          label="Question"
                          value={task.question || ''}
                          onChange={(e) => handleTaskChange(taskIdx, 'question', e.target.value)}
                          placeholder="Enter your question here"
                          fullWidth
                          multiline
                          rows={2}
                          helperText="The actual question that will be displayed to students"
                            sx={{ mb: 2 }}
                        />
                        {task.options.map((opt, optIdx) => (
                            <Box key={opt.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <TextField
                              label={`Option ${opt.label}`}
                              value={opt.value}
                              onChange={(e) => handleTaskChange(taskIdx, `option-${optIdx}`, e.target.value)}
                              fullWidth
                                sx={{ borderRadius: 2 }}
                            />
                            {optIdx >= 2 && (
                                <IconButton 
                                  color="error" 
                                  onClick={() => handleRemoveOption(taskIdx, optIdx)} 
                                  disabled={task.options.length <= 2}
                                  sx={{ borderRadius: 2 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                            )}
                          </Box>
                        ))}
                        {task.options.length < 5 && (
                            <Button 
                              onClick={() => handleAddOption(taskIdx)} 
                              sx={{ mt: 1, borderRadius: 4 }}
                            >
                            Add Option
                          </Button>
                        )}
                        <FormControl fullWidth sx={{ mt: 2 }}>
                          <InputLabel>Correct Answer</InputLabel>
                          <Select
                            value={task.correctAnswer}
                            onChange={(e) => handleTaskChange(taskIdx, 'correctAnswer', e.target.value)}
                            label="Correct Answer"
                              sx={{ borderRadius: 2 }}
                          >
                            {task.options.map((opt, idx) => (
                              <MenuItem key={opt.label} value={opt.label.toLowerCase()}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        </Box>
                    )}

                    {task.taskType === 'quiz' && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
                            Multi-Question Quiz
                          </Typography>
                        
                        {task.questions.map((question, qIdx) => (
                            <Card 
                              key={qIdx} 
                              sx={{ 
                                border: '1px solid #e0e0e0',
                                borderRadius: 4,
                                boxShadow: 'none',
                                p: 2, 
                                mb: 2,
                                backgroundColor: '#f8f9fa'
                              }}
                            >
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  Question {qIdx + 1}
                                </Typography>
                                {task.questions.length > 1 && (
                                    <IconButton 
                                    size="small" 
                                    color="error" 
                                    onClick={() => removeQuestion(taskIdx, qIdx)}
                                      sx={{ borderRadius: 2 }}
                                  >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                )}
                              </Box>
                              
                              <TextField
                                label="Question"
                                value={question.question}
                                onChange={(e) => updateQuestion(taskIdx, qIdx, 'question', e.target.value)}
                                placeholder="Enter your question here"
                                fullWidth
                                multiline
                                rows={2}
                                  sx={{ borderRadius: 2 }}
                              />
                              
                              <TextField
                                label="Option A"
                                value={question.optionA}
                                onChange={(e) => updateQuestion(taskIdx, qIdx, 'optionA', e.target.value)}
                                fullWidth
                                  sx={{ borderRadius: 2 }}
                              />
                              
                              <TextField
                                label="Option B"
                                value={question.optionB}
                                onChange={(e) => updateQuestion(taskIdx, qIdx, 'optionB', e.target.value)}
                                fullWidth
                                  sx={{ borderRadius: 2 }}
                              />
                              
                              <TextField
                                label="Option C"
                                value={question.optionC}
                                onChange={(e) => updateQuestion(taskIdx, qIdx, 'optionC', e.target.value)}
                                fullWidth
                                  sx={{ borderRadius: 2 }}
                              />
                              
                              <TextField
                                label="Option D"
                                value={question.optionD}
                                onChange={(e) => updateQuestion(taskIdx, qIdx, 'optionD', e.target.value)}
                                fullWidth
                                  sx={{ borderRadius: 2 }}
                              />
                              
                              <FormControl fullWidth>
                                <InputLabel>Correct Answer</InputLabel>
                                <Select
                                  value={question.correctAnswer}
                                  onChange={(e) => updateQuestion(taskIdx, qIdx, 'correctAnswer', e.target.value)}
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
                                onChange={(e) => updateQuestion(taskIdx, qIdx, 'explanation', e.target.value)}
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

                    {(task.taskType === 'get-issue-count' || 
                      task.taskType === 'get-pr-count' || 
                      task.taskType === 'get-top-contributor' || 
                      task.taskType === 'get-open-issue') && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
                          {task.taskType === 'get-issue-count' && 'Issue Count Task'}
                          {task.taskType === 'get-pr-count' && 'Pull Request Count Task'}
                          {task.taskType === 'get-top-contributor' && 'Top Contributor Task'}
                          {task.taskType === 'get-open-issue' && 'Open Issue Count Task'}
                        </Typography>
                        
                        <TextField
                          label="Repository (owner/repo)"
                          value={task.repository}
                          onChange={(e) => handleTaskChange(taskIdx, 'repository', e.target.value)}
                          placeholder="e.g., microsoft/vscode"
                          fullWidth
                          helperText="Format: owner/repository-name"
                            sx={{ borderRadius: 2 }}
                          />

                          {task.taskType === 'get-issue-count' && (
                            <Box sx={{ mt: 2 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={task.saveValidatedData || false}
                                    onChange={(e) => handleTaskChange(taskIdx, 'saveValidatedData', e.target.checked)}
                                    sx={{
                                      '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#1976d2',
                                        '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                                      },
                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1976d2' }
                                    }}
                                  />
                                }
                                label="Save validated data per user"
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem', fontWeight: 500, color: '#374151' } }}
                              />
                              {task.saveValidatedData && (
                                <>
                                  <TextField
                                    label="Data Name"
                                    value={task.savedDataName || ''}
                                    onChange={(e) => handleTaskChange(taskIdx, 'savedDataName', e.target.value)}
                                    placeholder="e.g., repo_issue_count"
                                    fullWidth
                                    helperText="Key used to store this value in each student's data."
                                    sx={{ mt: 1, borderRadius: 2 }}
                                  />
                                  <Alert severity="info" sx={{ mt: 1, borderRadius: 4, '& .MuiAlert-icon': { display: 'none' } }}>
                                    <AlertTitle>Per-user Storage</AlertTitle>
                                    When enabled, the validated answer is saved for each student separately. The value is stored as a number.
                                  </Alert>
                                </>
                              )}
                            </Box>
                          )}
                        </Box>
                    )}

                    {task.taskType === 'get-issue-title' && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
                            Issue Title Task
                          </Typography>
                        
                        <TextField
                          label="Repository (owner/repo)"
                          value={task.repository}
                          onChange={(e) => handleTaskChange(taskIdx, 'repository', e.target.value)}
                          placeholder="e.g., microsoft/vscode"
                          fullWidth
                          helperText="Format: owner/repository-name"
                            sx={{ mb: 2, borderRadius: 2 }}
                        />
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={task.useStoredKey || false}
                                onChange={(e) => handleTaskChange(taskIdx, 'useStoredKey', e.target.checked)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#1976d2',
                                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1976d2' }
                                }}
                              />
                            }
                            label="Use stored data for Issue Number"
                          />
                          <FormControl sx={{ minWidth: 240 }} disabled={!task.useStoredKey || (storedKeys || []).length === 0}>
                            <InputLabel>Stored Data</InputLabel>
                            <Select
                              label="Stored Data"
                              value={task.selectedStoredKey || ''}
                              onChange={(e) => handleTaskChange(taskIdx, 'selectedStoredKey', e.target.value)}
                            >
                              <MenuItem value="">Set number manually</MenuItem>
                              {(storedKeys || []).map((k, i) => (
                                <MenuItem key={`${k.dataName}-${i}`} value={k.dataName}>
                                  {k.dataName}
                                </MenuItem>
                              ))}
                            </Select>
                            <FormHelperText>
                              {((storedKeys || []).length === 0) ? 'No stored keys available yet' : 'Choose a previously saved value'}
                            </FormHelperText>
                          </FormControl>
                        </Box>
                        
                        <TextField
                          label="Issue Number"
                          type="number"
                          value={task.issueNumber}
                          onChange={(e) => handleTaskChange(taskIdx, 'issueNumber', e.target.value)}
                          placeholder="e.g., 123"
                          fullWidth
                          helperText={task.useStoredKey ? 'Using stored data; manual input disabled' : 'The specific issue number students should find'}
                            sx={{ borderRadius: 2 }}
                          disabled={Boolean(task.useStoredKey)}
                          />
                        </Box>
                    )}

                    {task.taskType === 'assigned' && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
                            Assignment Validation Task
                          </Typography>
                        
                        <TextField
                          label="Repository (owner/repo)"
                          value={task.repository}
                          onChange={(e) => handleTaskChange(taskIdx, 'repository', e.target.value)}
                          placeholder="e.g., microsoft/vscode"
                          fullWidth
                          helperText="Format: owner/repository-name"
                            sx={{ mb: 2, borderRadius: 2 }}
                        />
                        
                        <TextField
                          label="Issue Number"
                          type="number"
                          value={task.issueNumber}
                          onChange={(e) => handleTaskChange(taskIdx, 'issueNumber', e.target.value)}
                          placeholder="e.g., 123"
                          fullWidth
                          helperText="The specific issue number students must be assigned to"
                            sx={{ borderRadius: 2 }}
                          />
                        </Box>
                      )}

                      {task.taskType === 'issue-no' && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
                            Issue Number Validation Task
                          </Typography>
                        
                        <TextField
                            label="Repository (owner/repo)"
                            value={task.repository}
                            onChange={(e) => handleTaskChange(taskIdx, 'repository', e.target.value)}
                            placeholder="e.g., microsoft/vscode"
                          fullWidth
                            helperText="Format: owner/repository-name"
                            sx={{ borderRadius: 2 }}
                          />

                          <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={task.saveValidatedData || false}
                                  onChange={(e) => handleTaskChange(taskIdx, 'saveValidatedData', e.target.checked)}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: '#1976d2',
                                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1976d2' }
                                  }}
                                />
                              }
                              label="Save validated data per user"
                              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem', fontWeight: 500, color: '#374151' } }}
                            />
                            {task.saveValidatedData && (
                              <>
                                <TextField
                                  label="Data Name"
                                  value={task.savedDataName || ''}
                                  onChange={(e) => handleTaskChange(taskIdx, 'savedDataName', e.target.value)}
                                  placeholder="e.g., provided_issue_number"
                                  fullWidth
                                  helperText="Key used to store this value in each student's data."
                                  sx={{ mt: 1, borderRadius: 2 }}
                                />
                                <Alert severity="info" sx={{ mt: 1, borderRadius: 4, '& .MuiAlert-icon': { display: 'none' } }}>
                                  <AlertTitle>Per-user Storage</AlertTitle>
                                  When enabled, the student-provided issue number is saved for each student separately. The value is stored as a number.
                                </Alert>
                              </>
                            )}
                          </Box>
                        </Box>
                      )}

                      {task.taskType === 'comment' && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
                            Comment Validation Task
                          </Typography>
                        
                        <TextField
                          label="Repository (owner/repo)"
                          value={task.repository}
                          onChange={(e) => handleTaskChange(taskIdx, 'repository', e.target.value)}
                          placeholder="e.g., microsoft/vscode"
                          fullWidth
                          helperText="Format: owner/repository-name"
                            sx={{ mb: 2, borderRadius: 2 }}
                        />
                        
                        <TextField
                            label="Issue Number"
                            type="number"
                            value={task.issueNumber}
                            onChange={(e) => handleTaskChange(taskIdx, 'issueNumber', e.target.value)}
                            placeholder="e.g., 123"
                          fullWidth
                            helperText="The specific issue number where students should post a comment"
                            sx={{ borderRadius: 2 }}
                          />
                        </Box>
                      )}

                      {task.taskType === 'custom-api-call' && (
                        <Box>
                          <Divider sx={{ mb: 2 }} />
                          <Box sx={{ 
                            backgroundColor: '#e3f2fd', 
                            p: 3, 
                            borderRadius: 4, 
                            border: '2px solid #2196f3',
                            mb: 2
                          }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                              Custom API Call Task
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Create dynamic tasks that call GitHub APIs to retrieve real-time data
                            </Typography>
                          </Box>
                          
                          <TextField
                            label="Repository (owner/repo)"
                            value={task.repository}
                            onChange={(e) => handleTaskChange(taskIdx, 'repository', e.target.value)}
                            placeholder="JabRef/jabref"
                            fullWidth
                            helperText="Repository to analyze (e.g., JabRef/jabref) - leave empty to use student's assigned repo"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />
                          
                          <TextField
                            label="API Endpoint"
                            value={task.apiEndpoint}
                            onChange={(e) => handleTaskChange(taskIdx, 'apiEndpoint', e.target.value)}
                            placeholder="/repos/{owner}/{repo}/stargazers"
                            fullWidth
                            helperText="GitHub API endpoint with {owner} and {repo} placeholders"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />
                          
                          <TextField
                            label="Response Path"
                            value={task.responsePath}
                            onChange={(e) => handleTaskChange(taskIdx, 'responsePath', e.target.value)}
                            placeholder="length, language, description"
                            fullWidth
                            helperText="JSON path to extract the answer from API response"
                            sx={{ mb: 2, borderRadius: 2 }}
                          />
                          
                          <FormControl fullWidth>
                            <InputLabel>Expected Answer Type</InputLabel>
                            <Select
                              value={task.expectedAnswerType || 'Number'}
                              onChange={(e) => handleTaskChange(taskIdx, 'expectedAnswerType', e.target.value)}
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
                                <Switch
                                  checked={task.saveValidatedData || false}
                                  onChange={(e) => handleTaskChange(taskIdx, 'saveValidatedData', e.target.checked)}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: '#1976d2',
                                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1976d2' }
                                  }}
                                />
                              }
                              label="Save validated data per user"
                              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem', fontWeight: 500, color: '#374151' } }}
                            />
                            {task.saveValidatedData && (
                              <>
                                <TextField
                                  label="Data Name"
                                  value={task.savedDataName || ''}
                                  onChange={(e) => handleTaskChange(taskIdx, 'savedDataName', e.target.value)}
                                  placeholder="e.g., repo_issue_count"
                                  fullWidth
                                  helperText="Key used to store this value in each student's data."
                                  sx={{ mt: 1, borderRadius: 2 }}
                                />
                                <Alert severity="info" sx={{ mt: 1, borderRadius: 4, '& .MuiAlert-icon': { display: 'none' } }}>
                                  <AlertTitle>Per-user Storage</AlertTitle>
                                  When enabled, the validated answer is saved for each student separately. The value is automatically stored as a number or text based on the expected answer type.
                                </Alert>
                              </>
                            )}
                          </Box>
                          
                          {/* Additional options for Number type */}
                          {task.expectedAnswerType === 'Number' && (
                            <Box sx={{ mt: 2 }}>
                              {/* Info box for number visibility */}
                              <Alert 
                                severity="info" 
                                sx={{ 
                                  mb: 2,
                                  borderRadius: 4,
                                  '& .MuiAlert-icon': {
                                    display: 'none'
                                  }
                                }}
                              >
                                <AlertTitle>Number Visibility</AlertTitle>
                                Ensure the number can be seen by students in the GitHub repository. 
                                For example, if asking for issue count, make sure students can access 
                                the repository and see the issues tab.
                              </Alert>
                              
                              {/* Tolerance fields in a row */}
                              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                {/* Tolerance checkbox box */}
                                <Card 
                                  sx={{ 
                                    flex: 1,
                                    p: 2,
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 4,
                                    boxShadow: 'none',
                                    backgroundColor: '#f9f9fa'
                                  }}
                                >
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={task.enableTolerance || false}
                                        onChange={(e) => handleTaskChange(taskIdx, 'enableTolerance', e.target.checked)}
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
                                      border: '1px solid #e0e0e0',
                                      borderRadius: 4,
                                      boxShadow: 'none',
                                      backgroundColor: '#f9f9fa'
                                    }}
                                  >
                                    <TextField
                                      fullWidth
                                      label="Tolerance Range"
                                      type="number"
                                      value={task.toleranceRange || 10}
                                      onChange={(e) => handleTaskChange(taskIdx, 'toleranceRange', parseInt(e.target.value) || 10)}
                                      helperText="Fixed number tolerance (e.g., 10 means ±10 from expected answer)"
                                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                  </Card>
                                )}
                              </Stack>
                            </Box>
                          )}
                        </Box>
                    )}

                    {task.taskType === 'llm-text-validation' && (
                      <Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ 
                          backgroundColor: '#fff3e0', 
                          p: 3, 
                          borderRadius: 4, 
                          border: '2px solid #ff9800',
                          mb: 2
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                            LLM Text Validation Task
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Create AI-powered tasks that validate student text answers using GPT-4o
                          </Typography>
                        </Box>
                        
                        {/* Criteria for Evaluation */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Criteria for Evaluation
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Define the criteria that the AI will use to evaluate student answers. Students must address all criteria to pass.
                          </Typography>
                          
                          {/* Existing Parameters */}
                          {(task.llmTextValidation?.validationParameters || []).map((param, paramIdx) => (
                            <Box key={paramIdx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                              <TextField
                                fullWidth
                                label={`Parameter ${paramIdx + 1}`}
                                value={param}
                                onChange={(e) => {
                                  const newParams = [...(task.llmTextValidation?.validationParameters || [])];
                                  newParams[paramIdx] = e.target.value;
                                  handleTaskChange(taskIdx, 'llmTextValidation', { 
                                    ...task.llmTextValidation, 
                                    validationParameters: newParams 
                                  });
                                }}
                                placeholder="e.g., Provide 3 examples, Explain the concept clearly, Include code snippets"
                                sx={{ borderRadius: 2 }}
                              />
                              <IconButton
                                onClick={() => {
                                  const newParams = (task.llmTextValidation?.validationParameters || []).filter((_, idx) => idx !== paramIdx);
                                  handleTaskChange(taskIdx, 'llmTextValidation', { 
                                    ...task.llmTextValidation, 
                                    validationParameters: newParams 
                                  });
                                }}
                                sx={{ 
                                  color: '#f44336',
                                  '&:hover': { backgroundColor: '#ffebee' }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          ))}
                          
                          {/* Add Parameter Button */}
                          <Button
                            variant="outlined"
                            onClick={() => {
                              const newParams = [...(task.llmTextValidation?.validationParameters || []), ''];
                              handleTaskChange(taskIdx, 'llmTextValidation', { 
                                ...task.llmTextValidation, 
                                validationParameters: newParams 
                              });
                            }}
                            startIcon={<AddIcon />}
                            sx={{ mt: 1, borderRadius: 2 }}
                          >
                            Add Parameter
                          </Button>
                        </Box>
                        
                        {/* Advanced Settings */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Advanced Settings (Optional)
                          </Typography>
                          
                          <TextField
                            label="Temperature"
                            type="number"
                            value={task.llmTextValidation?.temperature || 0.1}
                            onChange={(e) => handleTaskChange(taskIdx, 'llmTextValidation', { 
                              ...task.llmTextValidation, 
                              temperature: parseFloat(e.target.value) || 0.1 
                            })}
                            helperText="AI creativity level (0.0-1.0)"
                            inputProps={{ min: 0, max: 1, step: 0.1 }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        
                          {/* Info box for temperature */}
                        <Alert 
                          severity="info" 
                          sx={{ 
                              mt: 1,
                              mb: 2,
                            borderRadius: 4,
                            '& .MuiAlert-icon': {
                              display: 'none'
                            }
                          }}
                        >
                            <AlertTitle>Temperature Control</AlertTitle>
                            Controls how creative vs. consistent the AI is when evaluating answers. Lower values (0.0-0.3) make responses more consistent and focused. Higher values (0.7-1.0) allow more creative interpretation but may be less predictable.
                        </Alert>

                          {/* Detailed Feedback Toggle */}
                          <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={task.llmTextValidation?.enableDetailedFeedback || false}
                                  onChange={(e) => handleTaskChange(taskIdx, 'llmTextValidation', { 
                                    ...task.llmTextValidation, 
                                    enableDetailedFeedback: e.target.checked 
                                  })}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: '#1976d2',
                                      '&:hover': {
                                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                      },
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      backgroundColor: '#1976d2',
                                    },
                                  }}
                                />
                              }
                              label="Enable detailed feedback"
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  fontSize: '0.95rem',
                                  fontWeight: 500,
                                  color: '#374151'
                                }
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 4 }}>
                              When enabled, students receive specific feedback about what they got wrong instead of generic error messages.
                            </Typography>
                          </Box>
                        </Box>


                      </Box>
                    )}

                    <Divider />

                    {/* Success and Error Text Fields */}
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                          Response Text
                        </Typography>
                    
                    <TextField
                      label="Success Text (Correct Answer Response)"
                      value={task.successText}
                      onChange={(e) => handleTaskChange(taskIdx, 'successText', e.target.value)}
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
                      onChange={(e) => handleTaskChange(taskIdx, 'errorText', e.target.value)}
                      placeholder="This text appears when students answer incorrectly"
                      fullWidth
                      multiline
                      rows={3}
                      helperText="Should provide helpful hints and guidance"
                          sx={{ borderRadius: 2 }}
                        />
                      </Box>

                      <Divider />

                      {/* Hints Section */}
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                          Hints
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Add progressive hints that students can access by typing "help" in issue comments. Each hint costs points.
                        </Typography>
                        
                        {(task.detailedHints || []).map((hint, hintIdx) => (
                          <Card 
                            key={hintIdx} 
                            sx={{ 
                              border: '1px solid #e0e0e0',
                              borderRadius: 4,
                              boxShadow: 'none',
                              p: 2, 
                              mb: 2, 
                              backgroundColor: '#f9f9fa'
                            }}
                          >
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  Hint {hintIdx + 1}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => handleRemoveHint(editingQuestIndex || 0, taskIdx, hintIdx)}
                                  sx={{ borderRadius: 2 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              
                              <TextField
                                label="Hint Content"
                                value={hint.content || ''}
                                onChange={(e) => handleUpdateHint(editingQuestIndex || 0, taskIdx, hintIdx, 'content', e.target.value)}
                                placeholder="Enter the hint content that will be shown to students"
                                fullWidth
                                multiline
                                rows={3}
                                helperText="This is the text that will be displayed when students request this hint"
                                sx={{ borderRadius: 2 }}
                              />
                              
                              <TextField
                                label="Image URL (Optional)"
                                value={hint.image || ''}
                                onChange={(e) => handleUpdateHint(editingQuestIndex || 0, taskIdx, hintIdx, 'image', e.target.value)}
                                placeholder="https://example.com/image.png"
                                fullWidth
                                helperText="Optional image URL to accompany the hint"
                                sx={{ borderRadius: 2 }}
                              />
                              
                              <TextField
                                label="Penalty (Points)"
                                type="number"
                                value={hint.penalty || 5}
                                onChange={(e) => handleUpdateHint(editingQuestIndex || 0, taskIdx, hintIdx, 'penalty', e.target.value)}
                                sx={{ width: 150, borderRadius: 2 }}
                                helperText="Points deducted when this hint is used"
                    />
                  </Stack>
                          </Card>
                        ))}
                        
                        <Button
                          variant="outlined"
                          startIcon={<AddCircleOutlineIcon />}
                          onClick={() => handleAddHint(editingQuestIndex || 0, taskIdx)}
                          sx={{ mt: 1, mr: 1, borderRadius: 4, borderColor: 'primary.main' }}
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
                                llmTextValidation: task.llmTextValidation
                              };
                              const { data } = await axios.post(`${baseURL}/api/group/${classId}/ai/generate-hint`, payload, { headers: { 'Content-Type': 'application/json' } });
                              const aiHint = (data && data.data && data.data.hint) ? data.data.hint : 'Try focusing on the key requirement and the relevant tab in the repository.';
                              handleAddHint(editingQuestIndex || 0, taskIdx);
                              const newIdx = (task.detailedHints?.length || 0);
                              handleUpdateHint(editingQuestIndex || 0, taskIdx, newIdx - 1, 'content', aiHint);
                            } catch (e) {
                              console.error('AI hint generation failed:', e);
                              alert('Failed to generate hint. Please try again.');
                            }
                          }}
                          sx={{ mt: 1, borderRadius: 4, backgroundColor: 'white', color: '#ff5722', border: '1px solid #ff5722', '&:hover': { backgroundColor: '#fff3e0', borderColor: '#e64a19' }, boxShadow: 'none' }}
                        >
                          Generate hint with AI
                        </Button>
                </Box>
                    </Stack>
                  </Card>
                );
              })}
              
                {/* Add Task Button - Moved to bottom */}
              <Button 
                variant="outlined" 
                onClick={handleAddTaskToQuest}
                startIcon={<AddIcon />}
                  sx={{ 
                    borderRadius: 4, 
                    fontWeight: 'bold',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: '#e3f2fd'
                    }
                  }}
                >
                  Add Task
              </Button>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => setShowAddQuestModal(false)} 
              sx={{ 
                borderRadius: 4, 
                fontWeight: 'bold', 
                px: 3, 
                py: 1 
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddQuest} 
              variant="contained"
              disabled={isAddQuestDisabled}
              sx={{
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#388e3c' },
                fontWeight: 'bold',
                px: 4,
                borderRadius: 4,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' }
              }}
            >
              {editingQuestIndex !== null ? 'Save Changes' : 'Add New Quest'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* README Preview/Edit Modal */}
        <Dialog 
          open={showReadmeModal} 
          onClose={() => setShowReadmeModal(false)} 
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
              README File Preview & Edit
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Preview and edit your README content before adding it to the quest configuration.
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
                💡 Tip: Use standard Markdown formatting. This content will be created as README.md in each student repository.
              </Typography>
            </Box>

          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            {/* Hidden input for uploading new README */}
            <input
              accept=".md"
              style={{ display: 'none' }}
              id="readme-replace-upload"
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.name.endsWith('.md')) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    setReadmeContent(evt.target.result);
                  };
                  reader.readAsText(file);
                }
                e.target.value = '';
              }}
            />
            {/* Save first */}
            <Button 
              onClick={handleReadmeSave} 
              variant="contained"
              disabled={!readmeContent.trim()}
              sx={{
                bgcolor: '#2196f3',
                borderRadius: 4,
                fontWeight: 'bold',
                px: 3,
                py: 1,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#1976d2', boxShadow: 'none' }
              }}
            >
              Save README
            </Button>
            {/* New README File upload */}
            <label htmlFor="readme-replace-upload">
              <Button variant="outlined" sx={{ textTransform: 'none', borderRadius: 4, fontWeight: 'bold', px: 3, py: 1, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}>
                New README File
              </Button>
            </label>
            {jsonContent.readme && (
              <Button
                color="error"
                variant="outlined"
                onClick={() => {
                  handleReadmeRemove();
                  setShowReadmeModal(false);
                }}
                sx={{ borderRadius: 4, fontWeight: 'bold', px: 3, py: 1, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
              >
                Remove README
              </Button>
            )}
            {/* Cancel last */}
            <Button onClick={() => setShowReadmeModal(false)} sx={{ borderRadius: 4, fontWeight: 'bold', px: 3, py: 1 }}>Cancel</Button>
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
              Quest Library
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {isLibraryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress size={40} />
                <Typography sx={{ ml: 2 }}>Loading quests...</Typography>
              </Box>
            ) : libraryError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {libraryError}
              </Alert>
            ) : libraryQuests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LibraryBooksIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No quests in your library yet
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Create your first quest to get started with the quest library.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {libraryQuests.map(quest => (
                  <Card 
                    key={quest._id} 
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      borderRadius: 4,
                      boxShadow: 'none',
                      p: 3,
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: '#f8f9fa'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1, mr: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                          {quest.questTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {quest.description || ''}
                        </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={`${(quest.tasks || []).length} tasks`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ borderRadius: 2 }}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          size="small" 
                          onClick={() => handleAddLibraryQuest(quest)}
                          sx={{ 
                            borderRadius: 4, 
                            fontWeight: 'bold', 
                            px: 2, 
                            py: 1, 
                            boxShadow: 'none',
                            '&:hover': { boxShadow: 'none' }
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
                            fontWeight: 'bold', 
                            px: 2, 
                            py: 1,
                            borderColor: '#f44336',
                            color: '#f44336',
                            '&:hover': {
                              borderColor: '#d32f2f',
                              backgroundColor: '#ffebee'
                            }
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
          <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={handleCloseLibrary} 
              sx={{ 
                borderRadius: 4, 
                fontWeight: 'bold', 
                px: 3, 
                py: 1 
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Stored Data Overview */}
        <Card sx={{ mb: 4, borderRadius: 4, boxShadow: 'none' }}>
          <Box p={3}>
            <Typography variant="h5" component="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Stored Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This section lists keys configured to save validated answers per student, and shows stored values when available.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" size="small" onClick={loadStoredValues} sx={{ borderRadius: 3 }}>Refresh</Button>
            </Box>

            {/* Keys List */}
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#1976d2' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Data Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Quest</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Task</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Expected Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(storedKeys || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ py: 3, textAlign: 'center' }}>No stored data keys configured.</TableCell>
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

            {/* Per-user values placeholder */}
            <Box sx={{ mt: 3 }}>
              {storedKeys && storedKeys.length > 0 ? (
                storedKeys.map((k, idx) => (
                  <Box key={`${k.dataName}-${idx}`} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {k.dataName} ({k.questId}.{k.taskId}) — Saved by {Object.entries(storedValuesByUser || {}).filter(([_, v]) => v && v[k.dataName] !== undefined).length} {Object.entries(storedValuesByUser || {}).filter(([_, v]) => v && v[k.dataName] !== undefined).length === 1 ? 'student' : 'students'}
                    </Typography>
                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#1976d2' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Student</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.keys(storedValuesByUser).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} sx={{ py: 2, textAlign: 'center' }}>No values recorded yet.</TableCell>
                            </TableRow>
                          ) : (
                            Object.entries(storedValuesByUser).map(([username, values]) => (
                              <TableRow key={`${username}-${k.dataName}`}>
                                <TableCell>{username}</TableCell>
                                <TableCell>{values && values[k.dataName] !== undefined ? String(values[k.dataName]) : '—'}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))
              ) : (
                <Alert severity="info" sx={{ borderRadius: 3, '& .MuiAlert-icon': { display: 'none' } }}>
                  <AlertTitle>Per-student Values</AlertTitle>
                  Values are recorded by the bot at runtime per student and will appear here when available.
                </Alert>
              )}
            </Box>
          </Box>
        </Card>
      </Container>
    </div>
  );
};

// Move these to parent scope so both QuestBlock and TaskBlock can use them
const getTaskTypeColor = (taskType) => {
  switch (taskType) {
    case 'multiple-choice': return '#2196f3';
    case 'quiz': return '#9c27b0';
    case 'get-issue-count': return '#ff9800';
    case 'get-pr-count': return '#f44336';
    case 'get-top-contributor': return '#4caf50';
    case 'get-issue-title': return '#607d8b';
    case 'get-open-issue': return '#795548';
    case 'custom-api-call': return '#1976d2';
    case 'assigned': return '#e91e63';
    case 'issue-no': return '#ff5722';
    case 'comment': return '#00bcd4';
    case 'llm-text-validation': return '#ff9800';
    default: return '#757575';
  }
};

const getTaskTypeLabel = (taskType) => {
  switch (taskType) {
    case 'multiple-choice': return 'MCQ';
    case 'quiz': return 'Quiz';
    case 'get-issue-count': return 'Issue Count';
    case 'get-pr-count': return 'PR Count';
    case 'get-top-contributor': return 'Top Contributor';
    case 'get-issue-title': return 'Issue Title';
    case 'get-open-issue': return 'Open Issues';
    case 'custom-api-call': return 'Custom API';
    case 'assigned': return 'Assignment';
    case 'issue-no': return 'Issue Number';
    case 'comment': return 'Comment';
    case 'llm-text-validation': return 'LLM Text';
    default: return 'Unknown';
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
  onMoveTask, 
  onEditTask, 
  onDeleteTask 
}) => {
  const [expanded, setExpanded] = useState(false);
  const taskEntries = Object.entries(quest.tasks);
  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)} sx={{ mb: 2, bgcolor: quest.isQ0 ? '#f8f9fa' : 'white', borderRadius: 4, boxShadow: 'none' }}>
      <AccordionSummary>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              <Typography component="span" sx={{ 
                color: '#f57c00', 
                fontWeight: 700, 
                mr: 1, 
                fontSize: '0.9em',
                backgroundColor: '#fff3e0',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #ffcc02'
              }}>
                Q{questIndex}
              </Typography>
              {quest.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {taskEntries.length} tasks
            </Typography>
            <Stack direction="row" spacing={1} mt={1}>
              
            </Stack>
          </Box>
          {/* Rearrangement Arrows */}
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5, minWidth: 'fit-content' }}>
            <button
              className="btn btn-outline-secondary btn-sm"
              title="Move Up"
              onClick={e => { e.stopPropagation(); onMoveQuest(questIndex, 'up'); }}
              disabled={questIndex === 0}
              style={{ marginRight: 2, borderRadius: 4, padding: '4px 8px', fontSize: 16, opacity: questIndex === 0 ? 0.3 : 1, border: '1px solid #1976d2', backgroundColor: '#1976d2', color: 'white' }}
            >
              ↑
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              title="Move Down"
              onClick={e => { e.stopPropagation(); onMoveQuest(questIndex, 'down'); }}
              disabled={questIndex === totalQuests - 1}
              style={{ marginRight: 6, borderRadius: 4, padding: '4px 8px', fontSize: 16, opacity: questIndex === totalQuests - 1 ? 0.3 : 1, border: '1px solid #1976d2', backgroundColor: '#1976d2', color: 'white' }}
            >
              ↓
            </button>
            <Tooltip title="Edit Quest">
              <span>
                <IconButton
                  size="small"
                  onClick={e => { e.stopPropagation(); onEditQuest(questIndex); }}
                  sx={{ border: '1px solid #4caf50', borderRadius: 4, ml: 0, backgroundColor: '#4caf50', color: 'white', '&:hover': { backgroundColor: '#388e3c' } }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete Quest">
              <span>
                <IconButton
                  size="small"
                  onClick={e => { e.stopPropagation(); onDeleteQuest(questIndex); }}
                  sx={{ border: '1px solid #f44336', borderRadius: 4, ml: 0.5, backgroundColor: '#f44336', color: 'white', '&:hover': { backgroundColor: '#d32f2f' } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {/* Tasks header inside details */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Tasks</Typography>
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
                onDeleteTask={onDeleteTask}
                getTaskTypeColor={getTaskTypeColor}
                getTaskTypeLabel={getTaskTypeLabel}
              />
            ))}
          </Box>
        )}
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
  getTaskTypeLabel
}) => {
  return (
    <Card sx={{ 
      mb: 2, 
      borderRadius: 4, 
      boxShadow: 'none',
      border: '1px solid #e0e0e0',
      '&:hover': {
        borderColor: 'primary.main',
        backgroundColor: '#f8f9fa'
      }
    }}>
      <Box sx={{ p: 3 }}>
        {/* Task Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {task.desc || taskId}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Task {taskIndex + 1} of {totalTasks}
            </Typography>
          </Box>
        </Box>

        {/* Task Details Row */}
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5, mb: 1, justifyContent: 'flex-start', flexWrap: 'nowrap' }}>
          <Chip
            label={getTaskTypeLabel(task.type)}
            color="info"
            size="small"
            sx={{ borderRadius: 2, width: 'auto', flexShrink: 0 }}
          />
          <Chip 
            label={`XP: ${task.xp ?? 0}`} 
            color="default" 
            size="small" 
            sx={{ bgcolor: '#e0e0e0', color: '#333', borderRadius: 2, width: 'auto', flexShrink: 0 }} 
          />
          <Chip 
            label={`Points: ${task.points ?? 0}`} 
            color="default" 
            size="small" 
            sx={{ bgcolor: '#e0e0e0', color: '#333', borderRadius: 2, width: 'auto', flexShrink: 0 }} 
          />
        </Box>

        {/* Action Buttons Row */}
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5, mb: 2 }}>
        <Tooltip title="Move Up">
          <span>
            <IconButton
              size="small"
              onClick={() => onMoveTask(questIndex, taskId, 'up')}
              disabled={taskIndex === 0}
                sx={{ 
                  border: '1px solid #1976d2', 
                  borderRadius: 4, 
                  backgroundColor: '#1976d2', 
                  color: 'white', 
                  '&:hover': { backgroundColor: '#1565c0' }, 
                  '&:disabled': { opacity: 0.3, backgroundColor: '#e0e0e0', color: '#666' } 
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
              onClick={() => onMoveTask(questIndex, taskId, 'down')}
              disabled={taskIndex === totalTasks - 1}
                sx={{ 
                  border: '1px solid #1976d2', 
                  borderRadius: 4, 
                  backgroundColor: '#1976d2', 
                  color: 'white', 
                  '&:hover': { backgroundColor: '#1565c0' }, 
                  '&:disabled': { opacity: 0.3, backgroundColor: '#e0e0e0', color: '#666' } 
                }}
            >
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
          <Tooltip title="Delete Task">
            <span>
              <IconButton
          size="small"
                onClick={() => onDeleteTask(questIndex, taskId)}
                sx={{ 
                  border: '1px solid #f44336', 
                  borderRadius: 4, 
                  backgroundColor: '#f44336', 
                  color: 'white', 
                  '&:hover': { backgroundColor: '#d32f2f' } 
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
      </Box>
    </Box>
    </Card>
  );
};

export default GenerateJson;