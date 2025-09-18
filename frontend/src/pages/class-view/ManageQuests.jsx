import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthContext } from "../../context/AuthContext";
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  Grid,
  Chip,
  IconButton,
  FormControlLabel,
  Checkbox,
  AlertTitle,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import TextEditor from "../../components/TextEditor";
import { API_BASE_URL } from "../../config/api";

let baseURL = API_BASE_URL;

const ManageQuests = () => {
  const { classId } = useParams();
  const { authUser } = useAuthContext();
  const navigate = useNavigate();

  // --- State ---
  const [classInfo, setClassInfo] = useState({});
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showReadmeModal, setShowReadmeModal] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [questFormData, setQuestFormData] = useState({
    title: "",
    type: "Q1",
    description: "",
    descriptionImage: null,
    // New fields for JSON format compatibility
    questId: "",
    badgeDescription: "",
    isQ0: false,
    questType: "custom",
    metadata: {
      title: "",
      description: "",
      prerequisite: null,
      type: "custom",
    },
    tasks: [
      {
        type: "multiple-choice",
        title: "",

        description: "",
        outcome: "",
        helpText: "",
        points: 100,
        xp: 100,
        descriptionImage: null,
        config: {
          correctAnswer: "a",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
        },
        // New fields for JSON format compatibility
        desc: "",
        accept: "",
        success: "",
        error: "",
        answer: "a",
      },
    ],
    hints: {
      enabled: false,
      penalty: 0,
      hints: [],
    },
    dueDate: "",
  });
  const [editingQuest, setEditingQuest] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploadingQuest, setIsUploadingQuest] = useState(false);
  const [uploadQuestStatus, setUploadQuestStatus] = useState("");
  const [myQuests, setMyQuests] = useState([]);
  const [isLoadingQuests, setIsLoadingQuests] = useState(false);
  const [unifiedQuestOrder, setUnifiedQuestOrder] = useState([]);
  const [isSavingQuestOrder, setIsSavingQuestOrder] = useState(false);
  const [questOrderSaveStatus, setQuestOrderSaveStatus] = useState("");
  const [saveQuestOrderTimeout, setSaveQuestOrderTimeout] = useState(null);
  const [reuploadStatus, setReuploadStatus] = useState("");
  const [readmeFile, setReadmeFile] = useState(null);
  const [readmeContent, setReadmeContent] = useState("");
  const [existingReadme, setExistingReadme] = useState(null);

  // --- Fetch class info and quests ---
  useEffect(() => {
    if (authUser) {
      fetchClassInfo();
      loadQuestOrderFromDatabase();
      loadMyQuests();
      fetchExistingReadme();
    }
    // eslint-disable-next-line
  }, [authUser]);

  const fetchClassInfo = async () => {
    if (!classId) {
      console.error("No classId available for fetchClassInfo");
      return;
    }

    try {
      const response = await axios.get(`${baseURL}/api/group/class/${classId}`);
      setClassInfo(response.data);
    } catch (error) {
      setClassInfo({});
    }
  };

  const fetchExistingReadme = async () => {
    if (!classId) {
      console.error("No classId available for fetchExistingReadme");
      return;
    }

    try {
      const response = await axios.get(
        `${baseURL}/api/group/${classId}/readme`
      );
      if (response.data && response.data.readme) {
        setExistingReadme(response.data.readme);
      }
    } catch (error) {
      setExistingReadme(null);
    }
  };

  // --- Quest management handlers (move, edit, delete, etc.) ---
  const loadQuestOrderFromDatabase = async () => {
    if (!classId) {
      console.error("No classId available for loadQuestOrderFromDatabase");
      return;
    }

    try {
      console.log("🔍 [DEBUG] Loading quest order from database...");

      // Step 1: Get the quest order (sequence and basic info)
      const orderResponse = await axios.get(
        `${baseURL}/api/group/${classId}/quest-order`
      );
      console.log("🔍 [DEBUG] Quest order response:", orderResponse.data);

      if (orderResponse.data.questOrder) {
        // Step 2: Get full quest data with tasks populated
        const questsResponse = await axios.get(
          `${baseURL}/api/quest/professor/${authUser._id}`
        );
        console.log(
          "🔍 [DEBUG] Full quests data response:",
          questsResponse.data
        );

        if (questsResponse.data.success) {
          // Step 3: Create a map of quest ID to full quest data
          const fullQuestDataMap = new Map();
          questsResponse.data.data.forEach((quest) => {
            fullQuestDataMap.set(quest._id, quest);
            console.log(`🔍 [DEBUG] Mapped quest ${quest._id}:`, {
              questTitle: quest.questTitle,
              taskCount: quest.tasks?.length || 0,
            });
          });

          // Step 4: Merge quest order with full quest data
          const questOrderFromDB = orderResponse.data.questOrder.map(
            (questOrder) => {
              console.log(
                `🔍 [DEBUG] Processing quest order item:`,
                questOrder
              );

              if (questOrder.questType === "custom") {
                // For custom quests, get full data from the map
                const fullQuestData = fullQuestDataMap.get(questOrder.questId);
                console.log(
                  `🔍 [DEBUG] Found full data for custom quest ${questOrder.questId}:`,
                  {
                    found: !!fullQuestData,
                    taskCount: fullQuestData?.tasks?.length || 0,
                  }
                );

                return {
                  id: questOrder.questId,
                  _id: questOrder.questId,
                  title: questOrder.title,
                  questTitle: questOrder.title,
                  content: questOrder.title,
                  type: questOrder.questType,
                  isQ0: questOrder.isQ0,
                  tasks: fullQuestData?.tasks || [], // Include the actual task data!
                  professor: fullQuestData?.professor,
                  createdAt: fullQuestData?.createdAt,
                  updatedAt: fullQuestData?.updatedAt,
                };
              } else {
                // For fixed quests, just use the order data
                return {
                  id: questOrder.questId,
                  _id:
                    questOrder.questType === "custom"
                      ? questOrder.questId
                      : null,
                  title: questOrder.title,
                  questTitle: questOrder.title,
                  content: questOrder.title,
                  type: questOrder.questType,
                  isQ0: questOrder.isQ0,
                };
              }
            }
          );

          console.log("🔍 [DEBUG] Final merged quest order:", questOrderFromDB);
          setUnifiedQuestOrder(questOrderFromDB);
        } else {
          console.log(
            "⚠️ [DEBUG] Failed to get full quest data, using basic order"
          );
          // Fallback to basic quest order conversion
          const basicQuestOrder = orderResponse.data.questOrder.map(
            (quest) => ({
              id: quest.questId,
              _id: quest.questType === "custom" ? quest.questId : null,
              title: quest.title,
              questTitle: quest.title,
              content: quest.title,
              type: quest.questType,
              isQ0: quest.isQ0,
            })
          );
          setUnifiedQuestOrder(basicQuestOrder);
        }
      } else {
        console.log(
          "⚠️ [DEBUG] No quest order found, loading default with full data"
        );
        await loadQuestsForOutline();
      }
    } catch (error) {
      console.error("❌ [DEBUG] Error loading quest order:", error);
      await loadQuestsForOutline();
    }
  };

  const loadQuestsForOutline = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/api/quest/professor/${authUser._id}`
      );
      if (response.data.success) {
        console.log("🔍 [DEBUG] Raw quest data from API:", response.data.data);

        const customQuests = response.data.data.map((quest) => {
          console.log(`🔍 [DEBUG] Processing quest ${quest._id}:`, {
            questTitle: quest.questTitle,
            tasks: quest.tasks,
            taskCount: quest.tasks?.length || 0,
            taskTypes: quest.tasks?.map((t) => typeof t) || [],
          });

          return {
            _id: quest._id,
            id: quest._id,
            title: quest.questTitle, // Use questTitle from the Quest model
            questTitle: quest.questTitle,
            content: quest.questTitle,
            type: "custom",
            isQ0: false,
            tasks: quest.tasks, // Keep tasks for display
            professor: quest.professor,
            createdAt: quest.createdAt,
            updatedAt: quest.updatedAt,
          };
        });
        const newUnifiedOrder = [
          {
            id: "Q0",
            title: "Q0: Introduction to Open Source",
            content: "Introduction to Open Source Software",
            type: "fixed",
            isQ0: true,
          },
          {
            id: "Q1",
            title: "Q1",
            content: "Understanding OSS Projects and GitHub Basics",
            type: "fixed",
          },
          {
            id: "Q2",
            title: "Q2",
            content: "Forking and Contributing to Repositories",
            type: "fixed",
          },
          {
            id: "Q3",
            title: "Q3",
            content: "Creating Pull Requests and Code Reviews",
            type: "fixed",
          },
        ];
        newUnifiedOrder.push(...customQuests);
        setUnifiedQuestOrder(newUnifiedOrder);
        // setQuestOrder(customQuests); // This line was removed from the new_code, so it's removed here.
        if (customQuests.length > 0) {
          // saveQuestOrderToDatabase(newUnifiedOrder); // This line was removed from the new_code, so it's removed here.
        }
      }
    } catch (error) {
      // fallback
    }
  };

  const loadMyQuests = async () => {
    setIsLoadingQuests(true);
    try {
      const response = await axios.get(
        `${baseURL}/api/quest/professor/${authUser._id}`
      );
      if (response.data.success) {
        setMyQuests(response.data.data);
      }
    } catch (error) {
      // fallback
    } finally {
      setIsLoadingQuests(false);
    }
  };

  const handleViewMyQuests = async () => {
    await loadMyQuests();
    setShowQuestsModal(true);
  };

  const resetQuestOrderToDefault = async () => {
    if (!classId) {
      console.error("No classId available for resetQuestOrderToDefault");
      setQuestOrderSaveStatus("No class ID available");
      return;
    }

    try {
      setQuestOrderSaveStatus("Resetting quest order to default...");
      const response = await axios.post(
        `${baseURL}/api/group/${classId}/quest-order/reset`
      );
      if (response.data && response.data.message) {
        setQuestOrderSaveStatus("Quest order reset to default successfully!");
        setTimeout(() => setQuestOrderSaveStatus(""), 3000);
        await loadQuestOrderFromDatabase();
      }
    } catch (error) {
      console.error("Error resetting quest order:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unknown error occurred";
      setQuestOrderSaveStatus(`Error resetting quest order: ${errorMessage}`);
      setTimeout(() => setQuestOrderSaveStatus(""), 5000);
    }
  };

  // Remove Q1-Q3 from current quest order and add them to default quests library
  const removeDefaultQuests = () => {
    setUnifiedQuestOrder((prevOrder) => {
      const newOrder = prevOrder.filter(
        (quest) => !["Q1", "Q2", "Q3"].includes(quest.id)
      );
      debouncedSaveQuestOrder(newOrder);
      return newOrder;
    });
    setQuestOrderSaveStatus(
      "Q1, Q2, Q3 removed from quest order. They are now available in the quest library."
    );
    setTimeout(() => setQuestOrderSaveStatus(""), 3000);
  };

  // Add a default quest back to the class
  const addDefaultQuestToClass = (questId) => {
    const defaultQuest = {
      id: questId,
      title: questId,
      questTitle: questId,
      content:
        questId === "Q1"
          ? "Understanding OSS Projects and GitHub Basics"
          : questId === "Q2"
          ? "Forking and Contributing to Repositories"
          : "Creating Pull Requests and Code Reviews",
      type: "fixed",
      isQ0: false,
    };

    setUnifiedQuestOrder((prevOrder) => {
      const newOrder = [...prevOrder, defaultQuest];
      debouncedSaveQuestOrder(newOrder);
      return newOrder;
    });
    setQuestOrderSaveStatus(`${questId} added back to quest order.`);
    setTimeout(() => setQuestOrderSaveStatus(""), 3000);
  };

  const moveFixedQuestUp = (questId) => {
    setUnifiedQuestOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      const currentIndex = newOrder.findIndex((q) => q.id === questId);
      if (currentIndex > 1) {
        const temp = newOrder[currentIndex];
        newOrder[currentIndex] = newOrder[currentIndex - 1];
        newOrder[currentIndex - 1] = temp;
        debouncedSaveQuestOrder(newOrder);
      }
      return newOrder;
    });
  };

  const moveQuestUp = (questId) => {
    setUnifiedQuestOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      const currentIndex = newOrder.findIndex(
        (q) => q._id === questId || q.id === questId
      );
      if (currentIndex > 1) {
        const temp = newOrder[currentIndex];
        newOrder[currentIndex] = newOrder[currentIndex - 1];
        newOrder[currentIndex - 1] = temp;
        debouncedSaveQuestOrder(newOrder);
        
        // Schedule auto-centering after the state update and DOM re-render
        setTimeout(() => {
          const questElement = document.querySelector(`[data-quest-id="${questId}"]`);
          if (questElement) {
            questElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          }
        }, 100); // Small delay to ensure DOM has updated
      }
      return newOrder;
    });
  };

  const moveFixedQuestDown = (questId) => {
    setUnifiedQuestOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      const currentIndex = newOrder.findIndex((q) => q.id === questId);
      if (currentIndex < newOrder.length - 1) {
        const temp = newOrder[currentIndex];
        newOrder[currentIndex] = newOrder[currentIndex + 1];
        newOrder[currentIndex + 1] = temp;
        debouncedSaveQuestOrder(newOrder);
      }
      return newOrder;
    });
  };

  const moveQuestDown = (questId) => {
    setUnifiedQuestOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      const currentIndex = newOrder.findIndex(
        (q) => q._id === questId || q.id === questId
      );
      if (currentIndex < newOrder.length - 1) {
        const temp = newOrder[currentIndex];
        newOrder[currentIndex] = newOrder[currentIndex + 1];
        newOrder[currentIndex + 1] = temp;
        debouncedSaveQuestOrder(newOrder);
        
        // Schedule auto-centering after the state update and DOM re-render
        setTimeout(() => {
          const questElement = document.querySelector(`[data-quest-id="${questId}"]`);
          if (questElement) {
            questElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          }
        }, 100); // Small delay to ensure DOM has updated
      }
      return newOrder;
    });
  };

  const handleEditQuest = (quest) => {
    console.log("Editing quest:", quest); // Debug log

    const questData = {
      title: quest.questTitle || quest.title,
      type: "Q1",
      description: quest.description || "",
      descriptionImage: null,
      // Populate new fields for JSON format compatibility
      questId: quest.questId || quest._id || "",
      badgeDescription: quest.badgeDescription || "",
      isQ0: quest.isQ0 || false,
      questType: quest.questType || "custom",
      metadata: {
        title: quest.questTitle || quest.title || "",
        description: quest.description || "",
        prerequisite: quest.metadata?.prerequisite || null,
        type: "custom",
      },
      tasks: quest.tasks
        ? quest.tasks.map((task) => {
            console.log("Processing task:", task); // Debug log

            // Handle different task data structures
            const taskData = {
              type: task.type || "multiple-choice",
              title: task.taskTitle || task.title || "",
              objective: task.objective || "",
              description: task.desc || task.description || "",
              outcome: task.outcome || "",
              helpText: task.helpText || "",
              points: task.points || 100,
              xp: task.xp || task.points || 100,
              descriptionImage: null,
              // JSON format fields
              desc:
                task.desc ||
                task.description ||
                task.taskTitle ||
                task.title ||
                "",
              accept: task.responses?.accept || task.accept || "",
              success: task.responses?.success || task.success || "",
              error: task.responses?.error || task.error || "",
              answer: task.answer || task.correctAnswer || "a",
              config: {},
            };

            // Handle multiple choice options
            if (task.type === "multiple-choice" || !task.type) {
              if (task.options && Array.isArray(task.options)) {
                taskData.config = {
                  correctAnswer: task.correctAnswer || task.answer || "a",
                  optionA: task.options[0] || "",
                  optionB: task.options[1] || "",
                  optionC: task.options[2] || "",
                  optionD: task.options[3] || "",
                };
              } else {
                // Fallback for tasks without options array
                taskData.config = {
                  correctAnswer: task.correctAnswer || task.answer || "a",
                  optionA: "",
                  optionB: "",
                  optionC: "",
                  optionD: "",
                };
              }
            } else if (
              task.type === "get-issue-count" ||
              task.type === "get-pr-count" ||
              task.type === "get-open-issue" ||
              task.type === "get-top-contributor"
            ) {
              taskData.config = {
                ossRepository: "",
              };
              taskData.answer = "";
            } else if (task.type === "get-issue-title") {
              taskData.config = {
                ossRepository: "",
                issueNumber: "",
              };
              taskData.answer = "";
            } else if (task.type === "text-input") {
              taskData.config = {
                expectedAnswer: "",
              };
              taskData.answer = "";
            } else if (task.type === "quiz") {
              taskData.config = {
                questionCount: 5,
                correctAnswers: "",
              };
              taskData.answer = "";
            } else if (task.type === "custom-api-call") {
              taskData.config = {
                apiEndpoint: "",
                responsePath: "",
                expectedAnswerType: "Number",
              };
              taskData.answer = "";
            } else if (
              task.type === "issue-selection" ||
              task.type === "pr-creation"
            ) {
              taskData.config = {};
              taskData.answer = "";
            }

            return taskData;
          })
        : [
            {
              type: "multiple-choice",
              title: "",
              objective: "",
              description: "",
              outcome: "",
              helpText: "",
              points: 100,
              xp: 100,
              descriptionImage: null,
              config: {
                correctAnswer: "a",
                optionA: "",
                optionB: "",
                optionC: "",
                optionD: "",
              },
              desc: "",
              accept: "",
              success: "",
              error: "",
              answer: "a",
            },
          ],
      hints: {
        enabled: quest.hints && quest.hints.length > 0,
        penalty: quest.hints?.[0]?.penalty || 0,
        hints: quest.hints ? quest.hints.map((hint) => hint.content || "") : [],
      },
      dueDate: "",
    };

    console.log("Populated quest data:", questData); // Debug log
    setQuestFormData(questData);
    setEditingQuest(quest);
    setIsEditMode(true);
    setShowQuestModal(true);
  };

  const handleDeleteQuest = async (quest) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the quest "${quest.questTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const response = await axios.delete(`${baseURL}/api/quest/${quest._id}`);
      if (response.data.success) {
        // Remove from myQuests list
        setMyQuests((prevQuests) =>
          prevQuests.filter((q) => q._id !== quest._id)
        );

        // Remove from current class's quest order
        setUnifiedQuestOrder((prevOrder) => {
          const newOrder = prevOrder.filter((q) => q._id !== quest._id);
          // Save the updated order to database
          saveQuestOrderToDatabase(newOrder);
          return newOrder;
        });

        alert(
          `Quest "${quest.questTitle}" has been deleted permanently from the database!`
        );
      }
    } catch (error) {
      console.error("Error deleting quest:", error);
      alert("Error deleting quest. Please try again.");
    }
  };

  const handleRemoveQuestFromClass = (quest) => {
    if (
      !window.confirm(
        `Are you sure you want to remove "${quest.questTitle}" from this class? The quest will remain in your quest library.`
      )
    ) {
      return;
    }

    // Remove from current class's quest order only
    setUnifiedQuestOrder((prevOrder) => {
      const newOrder = prevOrder.filter((q) => q._id !== quest._id);
      // Save the updated order to database
      saveQuestOrderToDatabase(newOrder);
      return newOrder;
    });

    alert(`Quest "${quest.questTitle}" has been removed from this class!`);
  };

  const handleAddQuestToClass = async (quest) => {
    try {
      // Check if quest is already in the current class
      const isAlreadyInClass = unifiedQuestOrder.some(
        (q) => q._id === quest._id
      );
      if (isAlreadyInClass) {
        alert(
          `Quest "${quest.questTitle}" is already in this class's quest order.`
        );
        return;
      }

      // Add the quest to the unified quest order
      const newQuest = {
        _id: quest._id,
        questTitle: quest.questTitle,
        title: quest.questTitle,
        type: "custom",
        content: quest.description || questFormData.title,
        isQ0: false,
        tasks: quest.tasks,
      };

      setUnifiedQuestOrder((prevOrder) => {
        const newOrder = [...prevOrder, newQuest];
        // Save the updated order to database
        saveQuestOrderToDatabase(newOrder);
        return newOrder;
      });

      alert(
        `Quest "${quest.questTitle}" has been added to this class's quest order!`
      );
    } catch (error) {
      console.error("Error adding quest to class:", error);
      alert("Error adding quest to class. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setShowQuestModal(false);
    setEditingQuest(null);
    setIsEditMode(false);
    setUploadQuestStatus("");
    setQuestFormData({
      title: "",
      type: "Q1",
      description: "",
      descriptionImage: null,
      tasks: [
        {
          type: "multiple-choice",
          title: "",
          objective: "",
          description: "",
          outcome: "",
          helpText: "",
          points: 100,
          xp: 100,
          descriptionImage: null,
          config: {
            correctAnswer: "a",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
          },
          desc: "",
          accept: "",
          success: "",
          error: "",
          answer: "a",
        },
      ],
      hints: {
        enabled: false,
        penalty: 0,
        hints: [],
      },
      dueDate: "",
    });
  };

  const handleUploadMCQQuest = async () => {
    if (!questFormData.title.trim()) {
      alert("Please fill in the quest title.");
      return;
    }
    if (questFormData.tasks.length === 0) {
      alert("Please add at least one task.");
      return;
    }

    // Check if all tasks have meaningful content
    const validTasks = questFormData.tasks.filter(
      (task) => task.title.trim() && task.desc.trim() && task.description.trim()
    );

    if (validTasks.length === 0) {
      alert(
        "Please add at least one task with a title, description, and quest notes."
      );
      return;
    }

    if (validTasks.length !== questFormData.tasks.length) {
      alert(
        "Some tasks are missing required fields. Please fill in all task information."
      );
      return;
    }

    for (let i = 0; i < questFormData.tasks.length; i++) {
      const task = questFormData.tasks[i];
      if (!task.title.trim()) {
        alert(`Task ${i + 1} is missing a title.`);
        return;
      }
      if (!task.desc.trim()) {
        alert(`Task ${i + 1} is missing quest notes.`);
        return;
      }
      if (!task.description.trim()) {
        alert(`Task ${i + 1} is missing a description.`);
        return;
      }

      if (!task.outcome.trim()) {
        alert(`Task ${i + 1} is missing an outcome.`);
        return;
      }
      if (!task.helpText.trim()) {
        alert(`Task ${i + 1} is missing help text.`);
        return;
      }

      // Validate based on task type
      if (task.type === "multiple-choice" || !task.type) {
        if (!task.config?.correctAnswer) {
          alert(`Task ${i + 1} is missing a correct answer.`);
          return;
        }
        if (!task.config?.optionA?.trim()) {
          alert(`Task ${i + 1} is missing option A.`);
          return;
        }
        if (!task.config?.optionB?.trim()) {
          alert(`Task ${i + 1} is missing option B.`);
          return;
        }
        if (!task.config?.optionC?.trim()) {
          alert(`Task ${i + 1} is missing option C.`);
          return;
        }
        if (!task.config?.optionD?.trim()) {
          alert(`Task ${i + 1} is missing option D.`);
          return;
        }
      } else if (
        task.type === "get-issue-count" ||
        task.type === "get-pr-count" ||
        task.type === "get-open-issue" ||
        task.type === "get-top-contributor"
      ) {
        if (!task.config?.ossRepository?.trim()) {
          alert(`Task ${i + 1} is missing an OSS repository.`);
          return;
        }
      } else if (task.type === "get-issue-title") {
        if (!task.config?.ossRepository?.trim()) {
          alert(`Task ${i + 1} is missing an OSS repository.`);
          return;
        }
        if (!task.config?.issueNumber) {
          alert(
            `Task ${
              i + 1
            } is missing an issue number for the issue-title API call.`
          );
          return;
        }
      } else if (task.type === "text-input") {
        if (!task.config?.expectedAnswer?.trim()) {
          alert(`Task ${i + 1} is missing an expected answer.`);
          return;
        }
      } else if (task.type === "quiz") {
        if (!task.config?.questionCount || task.config.questionCount < 1) {
          alert(`Task ${i + 1} is missing a valid number of questions.`);
          return;
        }
        if (!task.config?.correctAnswers?.trim()) {
          alert(`Task ${i + 1} is missing correct answers.`);
          return;
        }
      } else if (task.type === "custom-api-call") {
        if (!task.config?.apiEndpoint?.trim()) {
          alert(`Task ${i + 1} is missing an API endpoint.`);
          return;
        }
        if (!task.config?.responsePath?.trim()) {
          alert(`Task ${i + 1} is missing a response path.`);
          return;
        }
        if (!task.config?.expectedAnswerType?.trim()) {
          alert(`Task ${i + 1} is missing an expected answer type.`);
          return;
        }
      } else if (
        task.type === "issue-selection" ||
        task.type === "pr-creation"
      ) {
        if (!task.answer?.trim()) {
          alert(`Task ${i + 1} is missing an expected response.`);
          return;
        }
      }
    }
    setIsUploadingQuest(true);
    setUploadQuestStatus("");
    try {
      const questData = {
        questTitle: questFormData.title,
        questId: questFormData.questId || `quest_${Date.now()}`, // Auto-generate if not provided
        badgeDescription: questFormData.badgeDescription,
        isQ0: questFormData.isQ0,
        questType: questFormData.questType,
        metadata: {
          title: questFormData.title, // Auto-set from quest title
          description: questFormData.description, // Auto-set from quest description
          prerequisite: null, // Will be set automatically in download
          type: "custom",
        },
        professorId: authUser._id,
        tasks: questFormData.tasks.map((task, index) => {
          // Simplified task structure for better saving
          const baseTask = {
            taskTitle: task.title,
            title: task.title,
            desc: task.desc || task.description,
            description: task.description,

            outcome: task.outcome,
            helpText: task.helpText,
            points: task.points || 0,
            xp: task.xp || task.points || 0,
            type: task.type || "multiple-choice",
            responses: {
              accept: task.accept || "",
              success: task.success || "",
              error: task.error || "",
            },
            hints:
              task.hints && task.hints.length > 0
                ? task.hints.map((hint, hintIndex) => ({
                    sequence: hint.sequence || hintIndex + 1,
                    content: hint.content || "",
                    penalty: hint.penalty || 0,
                  }))
                : [],
          };

          if (task.type === "multiple-choice" || !task.type) {
            return {
              ...baseTask,
              correctAnswer: task.config?.correctAnswer || "a",
              options: [
                task.config?.optionA || "",
                task.config?.optionB || "",
                task.config?.optionC || "",
                task.config?.optionD || "",
              ],
              answer: task.answer || "a",
              answerType: "singleAnswer",
            };
          } else if (
            task.type === "get-issue-count" ||
            task.type === "get-pr-count" ||
            task.type === "get-open-issue" ||
            task.type === "get-top-contributor"
          ) {
            return {
              ...baseTask,
              type: task.type,
              ossRepository: task.config?.ossRepository || "",
              answer: "",
              answerType: "metric",
            };
          } else if (task.type === "get-issue-title") {
            return {
              ...baseTask,
              type: task.type,
              ossRepository: task.config?.ossRepository || "",
              issueNumber: task.config?.issueNumber || "",
              answer: "",
              answerType: "metric",
            };
          } else if (task.type === "text-input") {
            return {
              ...baseTask,
              expectedAnswer: task.config?.expectedAnswer,
              answer: task.answer || "",
              answerType: "singleAnswer",
            };
          } else if (task.type === "quiz") {
            return {
              ...baseTask,
              questionCount: task.config?.questionCount,
              correctAnswers: task.config?.correctAnswers,
              answer: task.answer || "",
              answerType: "multipleAnswers",
            };
          } else if (task.type === "custom-api-call") {
            return {
              ...baseTask,
              apiEndpoint: task.config?.apiEndpoint || "",
              responsePath: task.config?.responsePath || "",
              expectedAnswerType: task.config?.expectedAnswerType || "Number",
              repository: task.config?.repository || "",
              enableTolerance: task.config?.enableTolerance || false,
              tolerancePercentage: task.config?.tolerancePercentage || 10,
              answer: task.answer || "",
              answerType: "custom",
            };
          } else if (
            task.type === "issue-selection" ||
            task.type === "pr-creation"
          ) {
            return {
              ...baseTask,
              answer: task.answer,
            };
          }
          return baseTask;
        }),
      };
      let response;
      if (isEditMode && editingQuest) {
        response = await axios.put(
          `${baseURL}/api/quest/${editingQuest._id}`,
          questData
        );
      } else {
        response = await axios.post(
          `${baseURL}/api/quest/upload-mcq`,
          questData
        );
      }
      if (response.data.success) {
        setUploadQuestStatus(
          `✅ Quest "${questFormData.title}" ${
            isEditMode ? "updated" : "uploaded"
          } successfully! Quest ID: ${
            response.data.data.questId || editingQuest._id
          }`
        );
        setShowQuestModal(false);
        if (!isEditMode) {
          const newQuestId =
            response.data.data.questId || response.data.data._id;
          const newQuest = {
            _id: newQuestId,
            questTitle: questFormData.title,
            title: questFormData.title,
            type: "custom",
            content: questFormData.description || questFormData.title,
            isQ0: false,
          };
          setUnifiedQuestOrder((prevOrder) => {
            const newOrder = [...prevOrder, newQuest];
            saveQuestOrderToDatabase(newOrder);
            return newOrder;
          });
        }
        setQuestFormData({
          title: "",
          type: "Q1",
          description: "",
          descriptionImage: null,
          tasks: [
            {
              type: "multiple-choice",
              title: "",
              objective: "",
              description: "",
              outcome: "",
              helpText: "",
              points: 100,
              xp: 100,
              descriptionImage: null,
              config: {
                correctAnswer: "a",
                optionA: "",
                optionB: "",
                optionC: "",
                optionD: "",
              },
              desc: "",
              accept: "",
              success: "",
              error: "",
              answer: "a",
            },
          ],
          hints: {
            enabled: false,
            penalty: 0,
            hints: [],
          },
          dueDate: "",
        });
        setEditingQuest(null);
        setIsEditMode(false);
        loadQuestOrderFromDatabase();
        loadMyQuests(); // Reload quest library to show new quest
      } else {
        setUploadQuestStatus(`❌ Error: ${response.data.message}`);
      }
    } catch (error) {
      setUploadQuestStatus(
        `❌ Error uploading quest: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsUploadingQuest(false);
    }
  };

  // Helper function to determine quest type based on tasks
  const getQuestTypeInfo = () => {
    if (questFormData.tasks.length === 0) {
      return {
        type: "mixed",
        label: "Upload Quest to Database",
        hasMultipleChoice: false,
        hasMetric: false,
        hasOther: false,
      };
    }

    const mcqTypes = ["multiple-choice"];
    const metricTypes = [
      "get-issue-count",
      "get-pr-count",
      "get-open-issue",
      "get-top-contributor",
      "get-issue-title",
    ];
    const otherTypes = ["text-input", "quiz", "issue-selection", "pr-creation"];

    const hasMultipleChoice = questFormData.tasks.some(
      (task) => mcqTypes.includes(task.type) || !task.type
    );
    const hasMetric = questFormData.tasks.some((task) =>
      metricTypes.includes(task.type)
    );
    const hasOther = questFormData.tasks.some((task) =>
      otherTypes.includes(task.type)
    );

    const typeCount = [hasMultipleChoice, hasMetric, hasOther].filter(
      Boolean
    ).length;

    if (typeCount > 1) {
      return {
        type: "mixed",
        label: "Upload Mixed Quest to Database",
        hasMultipleChoice,
        hasMetric,
        hasOther,
      };
    } else if (hasMultipleChoice) {
      return {
        type: "mcq",
        label: "Upload MCQ Quest to Database",
        hasMultipleChoice,
        hasMetric,
        hasOther,
      };
    } else if (hasMetric) {
      return {
        type: "metric",
        label: "Upload Metric Quest to Database",
        hasMultipleChoice,
        hasMetric,
        hasOther,
      };
    } else if (hasOther) {
      return {
        type: "other",
        label: "Upload Quest to Database",
        hasMultipleChoice,
        hasMetric,
        hasOther,
      };
    } else {
      return {
        type: "mixed",
        label: "Upload Quest to Database",
        hasMultipleChoice,
        hasMetric,
        hasOther,
      };
    }
  };

  // --- UI ---
  const debouncedSaveQuestOrder = (questOrder) => {
    if (saveQuestOrderTimeout) {
      clearTimeout(saveQuestOrderTimeout);
    }
    const timeout = setTimeout(() => {
      saveQuestOrderToDatabase(questOrder);
    }, 500);
    setSaveQuestOrderTimeout(timeout);
  };

  const saveQuestOrderToDatabase = async (questOrder, retryCount = 0) => {
    if (!classId) {
      console.error("No classId available for saveQuestOrderToDatabase");
      setQuestOrderSaveStatus("No class ID available");
      return false;
    }

    setIsSavingQuestOrder(true);
    setQuestOrderSaveStatus("Saving quest order and prerequisites...");
    try {
      const questOrderForDB = questOrder.map((quest, index) => ({
        questId: quest._id || quest.id,
        questType: quest.type || "custom",
        sequenceNumber: index,
        title: quest.title || quest.questTitle || quest.content,
        isQ0: quest.isQ0 || false,
      }));
      const response = await axios.post(
        `${baseURL}/api/group/${classId}/quest-order`,
        {
          questOrder: questOrderForDB,
        }
      );
      setQuestOrderSaveStatus(
        "Quest order and prerequisites saved successfully!"
      );
      setTimeout(() => setQuestOrderSaveStatus(""), 3000);
      return true;
    } catch (error) {
      setQuestOrderSaveStatus("Error saving quest order");
      setTimeout(() => setQuestOrderSaveStatus(""), 5000);
      return false;
    } finally {
      if (retryCount === 0) {
        setIsSavingQuestOrder(false);
      }
    }
  };

  // Download JSON functionality
  const handleDownloadJSON = () => {
    try {
      // Create the JSON structure
      const questConfig = {
        map_repo_link:
          "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map",
        questSequence: unifiedQuestOrder.map((quest, index) => {
          const questData = {
            questId: quest.id || quest._id,
            title: quest.title || quest.questTitle,
            isQ0: quest.isQ0 || false,
            questType: quest.type || "custom",
            sequenceNumber: index,
            metadata: {
              title: quest.title || quest.questTitle,
              description: quest.content || quest.description || "",
              prerequisite: null, // Will be set based on sequence
              type: quest.type === "fixed" ? "general" : "custom",
            },
          };

          // Set prerequisites based on sequence (automatic generation)
          if (index > 0) {
            const previousQuest = unifiedQuestOrder[index - 1];
            questData.metadata.prerequisite =
              previousQuest.id || previousQuest._id;
          }

          // Add badge description for fixed quests
          if (quest.type === "fixed") {
            if (quest.id === "Q0") {
              questData.badgeDescription = "Configurator ⚙️";
            } else if (quest.id === "Q1") {
              questData.badgeDescription = "Explorer 🚀";
            } else if (quest.id === "Q2") {
              questData.badgeDescription = "Builder 🏗️";
            } else if (quest.id === "Q3") {
              questData.badgeDescription = "Contributor 🥇";
            }
          }

          // For custom quests, try to get more details from myQuests
          if (quest.type === "custom" && quest._id) {
            const customQuest = myQuests.find((q) => q._id === quest._id);
            if (customQuest) {
              questData.badgeDescription =
                customQuest.badgeDescription || "Custom Quest 🎯";
              questData.metadata.title = quest.title || quest.questTitle;
              questData.metadata.description =
                quest.content ||
                quest.description ||
                customQuest.description ||
                "";
              if (customQuest.tasks && Array.isArray(customQuest.tasks)) {
                const formattedTasks = {};
                customQuest.tasks.forEach((task, taskIndex) => {
                  const taskKey = `T${taskIndex + 1}`;
                  formattedTasks[taskKey] = {
                    desc: task.desc || task.taskTitle || task.title || "",
                    points: task.points || 100,
                    xp: task.xp || task.points || 100,
                    type: task.type || "multiple-choice",
                    accept: task.responses?.accept || task.accept || "",
                    success: task.responses?.success || task.success || "",
                    error: task.responses?.error || task.error || "",
                    answer: task.answer || task.correctAnswer || "a",
                    hints: task.hints || [],
                  };
                });
                questData.tasks = formattedTasks;
              } else {
                // Fallback only when no tasks found
                questData.tasks = {
                  T1: {
                    desc: "Task description",
                    points: 20,
                    xp: 20,
                    type: "general",
                    accept: "Task description",
                    success: "Task completed successfully!",
                    error: "Incorrect answer, please try again.",
                    answer: "a",
                    hints: [],
                  },
                };
              }
            } else {
              // Fallback when custom quest not found in myQuests
              questData.badgeDescription = "Custom Quest 🎯";
              questData.metadata.title = quest.title || quest.questTitle;
              questData.metadata.description =
                quest.content || quest.description || "";
              questData.tasks = {
                T1: {
                  desc: "Task description",
                  points: 20,
                  xp: 20,
                  type: "general",
                  accept: "Task description",
                  success: "Task completed successfully!",
                  error: "Incorrect answer, please try again.",
                  answer: "a",
                  hints: [],
                },
              };
            }
          } else if (quest.type === "fixed") {
            // For fixed quests, use detailed task content based on quest ID
            if (quest.id === "Q0") {
              questData.tasks = {
                T1: {
                  desc: "Environment Preferences",
                  points: 0,
                  xp: 0,
                  type: "general",
                  accept:
                    "## Choosing Your Environment 🌟\n\nWelcome, adventurer! Before diving into the project, you get to customize your experience. Choose how you want to see your progress:\n\n**Options:**\n**A) Show Rank, Not Map** - Only keep track of your ranking, leaving the map a mystery. ✨\n**B) Show Map, Not Rank** - See where you're going, but let your rank remain a surprise! 🗺️\n**C) Show Both** - Get the best of both worlds! See your rank and the map as you go. 🌍\n**D) Show Neither** - For the thrill-seekers: navigate and rank without a guide! 🤫\n\nType the letter of your choice in the comment box, and let the adventure begin! 🎉",
                  error:
                    "Q0T1 answer incorrect, please input a valid multi choice answer, only a single letter",
                  success:
                    "### 🌟 Congratulations! Your environment preferences have been saved.\n\n",
                  answer: "a",
                  hints: [],
                },
              };
            } else if (quest.id === "Q1") {
              questData.tasks = {
                T1: {
                  desc: "Explore the issue tracker",
                  points: 20,
                  xp: 20,
                  type: "general",
                  accept:
                    '### 🎯 Task 1: Find the Issue Tracker\n\n**Objective:** The issue tracker is the hub for project discussions, bug reports, and feature requests. Your goal is to find the issue tracker within our GitHub repository.\n\n**Task:** Visit the GitHub repository in the link below and **COUNT** the number of open issues and provide that number in the comment box to complete the task.\n\n**Outcome:** This task will help you become familiar with how issues are reported, discussed, and tracked. Understanding the volume of discussions is crucial for grasping the project\'s activity level and areas that might need your contribution.\n\n**Help:** If you need help with this task, type "help" in the comment box to get hints, but it will cost you 5 points from your total score.',
                  error:
                    "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the number you've provided doesn't match the current count of **OPEN** issues in our project. \n\nNo worries, though! Mistakes are just stepping stones on the path to learning.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nEach issue represents a story, a problem to solve, or a feature to improve. Finding the correct number is just the start of understanding the broader narrative of our project.\n\nReady for another try? Your correct answer awaits just a click away!",
                  success:
                    "### 🌟 Congratulations! You Nailed It!\n\nYou've successfully identified the correct number of issues in our project, displaying keen attention to detail and dedication. As a reward for your sharp observation skills, you've earned **${experiencePoints} experience points!**\n\n> 🌟 🌟 🌟\n\n🏆 **Current Progress:** You now have **${currentPoints} points**, edging closer to the next level. Remember, you need a total of **100 points to level up**, meaning you're just **${pointsRemaining} points away** from achieving that milestone.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate, to successfully complete the entire quest, you need to reach an 100% completion rate. Every task you accomplish brings you closer to mastering the GitHub realm and unlocking new levels of collaboration and contribution.\n\n> 🌟 🌟 🌟\n\nKeep up the great work! Your journey through the quest is shaping up to be an exciting one. \n\nReady for the next challenge? More experiences and rewards await!\n\nA new task has appeared in the issues tab.\n\nYour adventure awaits! 🌟\n\n",
                  answer: "a",
                  hints: [],
                },
              };
            } else if (quest.id === "Q2") {
              questData.tasks = {
                T1: {
                  desc: "Identify the assigned user for the issue",
                  points: 25,
                  xp: 25,
                  type: "general",
                  accept:
                    '### 🎯 Task 1: Identify the Assigned User for the Issue\n\n**Objective:** In open-source collaboration, tracking issue ownership is crucial for effective project management. Your mission is to **find the assigned user** for the following issue and confirm their GitHub username.\n\n **Issue Number:** 91 \n\n**Task:** Type the assigned user\'s GitHub username (e.g., `your-username`) in the comment box below.\n\n**Outcome:** By identifying the assigned user, you demonstrate your ability to track project ownership and ensure accountability in open-source collaboration. This skill is essential for maintaining clarity and preventing duplicate efforts in a project.\n\n**Help:** Need assistance? Type **"help"** in the comment box to receive hints, but remember, each hint will cost you **5 points** from your total score.',
                  error:
                    "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the username you entered isn't the one assigned to this issue.\n\nNo worries—double-check the issue page, ensure you're looking at the correct issue, and try again!\n\nIf you need help, type **\"help\"** in the comment box, but remember, using hints will deduct **5 points** from your total score.\n\nWhen you're ready, submit the correct **GitHub username** of the assigned user and move forward in your contribution journey!",
                  success:
                    "### 🌟 Congratulations! You Successfully Identified the Assigned User!\n\nGreat job! You've demonstrated an important skill in open-source collaboration: **tracking issue ownership.** This ensures clarity, accountability, and smooth teamwork in any project.\n\n🏆 **Current Progress:** With this achievement, you've earned **${experiencePoints} points**, bringing you **${pointsRemaining} points** closer to Level 2!\n\n🎯 **Quest Advancement:** You're mastering the fundamentals of GitHub issue management. Understanding **who is responsible for which task** is key to contributing effectively and ensuring the project moves forward efficiently.\n\n💡 Keep up the great work! Your next challenge is just around the corner—let's continue this journey together! 🚀",
                  answer: "a",
                  hints: [],
                },
              };
            } else if (quest.id === "Q3") {
              questData.tasks = {
                T1: {
                  desc: "Solve the issue (upload a file/make commit)",
                  points: 50,
                  xp: 50,
                  type: "general",
                  accept:
                    "### 🛠️ Task 1 - Solve the Issue (Non-Code Contribution) and Submit a Pull Request\n\n**Objective:** Your mission involves two key stages: identifying and resolving a non-code issue in our GitHub repository and submitting your solution through a pull request (PR). This task focuses on improving the project's quality and accessibility without writing code, such as enhancing documentation, designing graphics, or organizing content.\n\n**Task:** Using the link below, **complete** the task in the issue assigned to you, **submit** a pull request, and choose the correct file in the options and comment it below.\n\nWhich file did you have to interact with to solve the issue?\n\nA) CONTRIBUTING.md\nB) LICENSE\nC) README.md\nD) CHANGELOG.md\n\n**Outcome:** By identifying and resolving a non-code issue and submitting a pull request, you contribute to the project's improvement. This task demonstrates your initiative and commitment to enhancing the project, deepening your understanding of open-source collaboration, and supporting the project's growth.\n\n**Help:** If you need help with this task, type \"help\" in the comment box to get hints, but it will cost you 5 points from your total score.",
                  error:
                    "### 🚨 Oops, That's Not Quite Right!\n\nIt seems the file you've chosen doesn't match the one we were looking for to solve the non-code issue. \n\nRemember, each non-code contribution plays a crucial role in enhancing the project's quality and accessibility. Whether it's documentation, graphics, or organization, every aspect is important.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nThis task is a bit like detective work 🔍.\n\nSolving a non-code issue by interacting with the right project file demonstrates your ability to contribute to and navigate the project effectively. It's an essential skill in open-source collaboration, showing that you're ready to contribute in a variety of ways.\n\nReady for another try? The correct file and solution to the issue are just a thought process away!\n\nPlease select the correct answer from the options below based on the issue you're addressing:\n\nA) README.md\nB) LICENSE\nC) CONTRIBUTING.md\nD) CHANGELOG.md\n\nType the letter in the comment box to complete this task.",
                  success:
                    "### 🌟 Congratulations! You've Made Your First Contribution!\n\nBy solving a non-code issue within our project, you've demonstrated your ability to contribute to our community in diverse and meaningful ways. Your effort enhances the project's quality and accessibility, proving that contributions extend far beyond just code.\n\nFor your dedication and successful contribution, you've been awarded **${experiencePoints} experience points!**\n\n>🌟 🌟 🌟\n\n🏆 **Current Progress:** These ${experiencePoints} points boost your total to **${currentPoints} points**, solidifying your status at Level 2. This achievement is a direct reflection of your commitment, learning, and active participation in our project.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate. To successfully complete the entire quest, you need to reach a 100% completion rate. Each contribution brings you closer to this next significant milestone.\n\n> 🌟 🌟 🌟\n\nFantastic work! Your journey through the project vividly illustrates your growth and the impact of your contributions.\n\nAre you ready to tackle the next challenge? More adventures and rewards are on the horizon!\n\nThe adventure continues! 🌟\n\n",
                  answer: "a",
                  hints: [],
                },
              };
            } else {
              // Fallback for other fixed quests
              questData.tasks = {
                T1: {
                  desc: "Complete the quest task",
                  points: 20,
                  xp: 20,
                  type: "general",
                  accept:
                    "Complete this quest task to progress in your learning journey.",
                  success:
                    "Great job! You've completed this quest task successfully!",
                  error: "Not quite right. Please try again!",
                  answer: "a",
                  hints: [],
                },
              };
            }
          }

          return questData;
        }),
        metadata: {
          version: "2.0",
          description: `Quest configuration for ${
            classInfo.groupName || "Class"
          }`,
          lastUpdated: new Date().toISOString(),
          totalQuests: unifiedQuestOrder.length,
          customQuests: unifiedQuestOrder.filter((q) => q.type === "custom")
            .length,
          fixedQuests: unifiedQuestOrder.filter((q) => q.type === "fixed")
            .length,
        },
      };

      // Create and download the file
      const dataStr = JSON.stringify(questConfig, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quest-config-${classInfo.groupName || "class"}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setQuestOrderSaveStatus("Quest configuration downloaded successfully!");
      setTimeout(() => setQuestOrderSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error downloading JSON:", error);
      setQuestOrderSaveStatus("Error downloading quest configuration");
      setTimeout(() => setQuestOrderSaveStatus(""), 5000);
    }
  };

  const questConfig = {
    map_repo_link:
      "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map",
    questSequence: unifiedQuestOrder.map((quest, index) => {
      const questData = {
        questId: quest.id || quest._id,
        title: quest.title || quest.questTitle,
        isQ0: quest.isQ0 || false,
        questType: quest.type || "custom",
        sequenceNumber: index,
        metadata: {
          title: quest.title || quest.questTitle,
          description: quest.content || quest.description || "",
          prerequisite: null, // Will be set based on sequence
          type: quest.type === "fixed" ? "general" : "custom",
        },
      };
      if (index > 0) {
        const previousQuest = unifiedQuestOrder[index - 1];
        questData.metadata.prerequisite = previousQuest.id || previousQuest._id;
      }
      if (quest.type === "fixed") {
        if (quest.id === "Q0") {
          questData.badgeDescription = "Configurator ⚙️";
        } else if (quest.id === "Q1") {
          questData.badgeDescription = "Explorer 🚀";
        } else if (quest.id === "Q2") {
          questData.badgeDescription = "Builder 🏗️";
        } else if (quest.id === "Q3") {
          questData.badgeDescription = "Contributor 🥇";
        }
      }
      if (quest.type === "custom" && quest._id) {
        const customQuest = myQuests.find((q) => q._id === quest._id);
        if (customQuest) {
          questData.badgeDescription =
            customQuest.badgeDescription || "Custom Quest 🎯";
          questData.metadata.title = quest.title || quest.questTitle;
          questData.metadata.description =
            quest.content || quest.description || customQuest.description || "";
          if (customQuest.tasks && Array.isArray(customQuest.tasks)) {
            const formattedTasks = {};
            customQuest.tasks.forEach((task, taskIndex) => {
              const taskKey = `T${taskIndex + 1}`;
              formattedTasks[taskKey] = {
                desc: task.desc || task.taskTitle || task.title || "",
                points: task.points || 100,
                xp: task.xp || task.points || 100,
                type: task.type || "multiple-choice",
                accept: task.responses?.accept || task.accept || "",
                success: task.responses?.success || task.success || "",
                error: task.responses?.error || task.error || "",
                answer: task.answer || task.correctAnswer || "a",
                hints: task.hints || [],
              };
            });
            questData.tasks = formattedTasks;
          } else {
            // Fallback only when no tasks found
            questData.tasks = {
              T1: {
                desc: "Task description",
                points: 20,
                xp: 20,
                type: "general",
                accept: "Task description",
                success: "Task completed successfully!",
                error: "Incorrect answer, please try again.",
                answer: "a",
                hints: [],
              },
            };
          }
        } else {
          // Fallback when custom quest not found in myQuests
          questData.badgeDescription = "Custom Quest 🎯";
          questData.metadata.title = quest.title || quest.questTitle;
          questData.metadata.description =
            quest.content || quest.description || "";
          questData.tasks = {
            T1: {
              desc: "Task description",
              points: 20,
              xp: 20,
              type: "general",
              accept: "Task description",
              success: "Task completed successfully!",
              error: "Incorrect answer, please try again.",
              answer: "a",
              hints: [],
            },
          };
        }
      } else if (quest.type === "fixed") {
        // For fixed quests, use detailed task content based on quest ID
        if (quest.id === "Q0") {
          questData.tasks = {
            T1: {
              desc: "Environment Preferences",
              points: 0,
              xp: 0,
              type: "general",
              accept:
                "## Choosing Your Environment 🌟\n\nWelcome, adventurer! Before diving into the project, you get to customize your experience. Choose how you want to see your progress:\n\n**Options:**\n**A) Show Rank, Not Map** - Only keep track of your ranking, leaving the map a mystery. ✨\n**B) Show Map, Not Rank** - See where you're going, but let your rank remain a surprise! 🗺️\n**C) Show Both** - Get the best of both worlds! See your rank and the map as you go. 🌍\n**D) Show Neither** - For the thrill-seekers: navigate and rank without a guide! 🤫\n\nType the letter of your choice in the comment box, and let the adventure begin! 🎉",
              error:
                "Q0T1 answer incorrect, please input a valid multi choice answer, only a single letter",
              success:
                "### 🌟 Congratulations! Your environment preferences have been saved.\n\n",
              answer: "a",
              hints: [],
            },
          };
        } else if (quest.id === "Q1") {
          questData.tasks = {
            T1: {
              desc: "Explore the issue tracker",
              points: 20,
              xp: 20,
              type: "general",
              accept:
                '### 🎯 Task 1: Find the Issue Tracker\n\n**Objective:** The issue tracker is the hub for project discussions, bug reports, and feature requests. Your goal is to find the issue tracker within our GitHub repository.\n\n**Task:** Visit the GitHub repository in the link below and **COUNT** the number of open issues and provide that number in the comment box to complete the task.\n\n**Outcome:** This task will help you become familiar with how issues are reported, discussed, and tracked. Understanding the volume of discussions is crucial for grasping the project\'s activity level and areas that might need your contribution.\n\n**Help:** If you need help with this task, type "help" in the comment box to get hints, but it will cost you 5 points from your total score.',
              error:
                "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the number you've provided doesn't match the current count of **OPEN** issues in our project. \n\nNo worries, though! Mistakes are just stepping stones on the path to learning.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nEach issue represents a story, a problem to solve, or a feature to improve. Finding the correct number is just the start of understanding the broader narrative of our project.\n\nReady for another try? Your correct answer awaits just a click away!",
              success:
                "### 🌟 Congratulations! You Nailed It!\n\nYou've successfully identified the correct number of issues in our project, displaying keen attention to detail and dedication. As a reward for your sharp observation skills, you've earned **${experiencePoints} experience points!**\n\n> 🌟 🌟 🌟\n\n🏆 **Current Progress:** You now have **${currentPoints} points**, edging closer to the next level. Remember, you need a total of **100 points to level up**, meaning you're just **${pointsRemaining} points away** from achieving that milestone.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate, to successfully complete the entire quest, you need to reach an 100% completion rate. Every task you accomplish brings you closer to mastering the GitHub realm and unlocking new levels of collaboration and contribution.\n\n> 🌟 🌟 🌟\n\nKeep up the great work! Your journey through the quest is shaping up to be an exciting one. \n\nReady for the next challenge? More experiences and rewards await!\n\nA new task has appeared in the issues tab.\n\nYour adventure awaits! 🌟\n\n",
              answer: "a",
              hints: [],
            },
          };
        } else if (quest.id === "Q2") {
          questData.tasks = {
            T1: {
              desc: "Identify the assigned user for the issue",
              points: 25,
              xp: 25,
              type: "general",
              accept:
                '### 🎯 Task 1: Identify the Assigned User for the Issue\n\n**Objective:** In open-source collaboration, tracking issue ownership is crucial for effective project management. Your mission is to **find the assigned user** for the following issue and confirm their GitHub username.\n\n **Issue Number:** 91 \n\n**Task:** Type the assigned user\'s GitHub username (e.g., `your-username`) in the comment box below.\n\n**Outcome:** By identifying the assigned user, you demonstrate your ability to track project ownership and ensure accountability in open-source collaboration. This skill is essential for maintaining clarity and preventing duplicate efforts in a project.\n\n**Help:** Need assistance? Type **"help"** in the comment box to receive hints, but remember, each hint will cost you **5 points** from your total score.',
              error:
                "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the username you entered isn't the one assigned to this issue.\n\nNo worries—double-check the issue page, ensure you're looking at the correct issue, and try again!\n\nIf you need help, type **\"help\"** in the comment box, but remember, using hints will deduct **5 points** from your total score.\n\nWhen you're ready, submit the correct **GitHub username** of the assigned user and move forward in your contribution journey!",
              success:
                "### 🌟 Congratulations! You Successfully Identified the Assigned User!\n\nGreat job! You've demonstrated an important skill in open-source collaboration: **tracking issue ownership.** This ensures clarity, accountability, and smooth teamwork in any project.\n\n🏆 **Current Progress:** With this achievement, you've earned **${experiencePoints} points**, bringing you **${pointsRemaining} points** closer to Level 2!\n\n🎯 **Quest Advancement:** You're mastering the fundamentals of GitHub issue management. Understanding **who is responsible for which task** is key to contributing effectively and ensuring the project moves forward efficiently.\n\n💡 Keep up the great work! Your next challenge is just around the corner—let's continue this journey together! 🚀",
              answer: "a",
              hints: [],
            },
          };
        } else if (quest.id === "Q3") {
          questData.tasks = {
            T1: {
              desc: "Solve the issue (upload a file/make commit)",
              points: 50,
              xp: 50,
              type: "general",
              accept:
                "### 🛠️ Task 1 - Solve the Issue (Non-Code Contribution) and Submit a Pull Request\n\n**Objective:** Your mission involves two key stages: identifying and resolving a non-code issue in our GitHub repository and submitting your solution through a pull request (PR). This task focuses on improving the project's quality and accessibility without writing code, such as enhancing documentation, designing graphics, or organizing content.\n\n**Task:** Using the link below, **complete** the task in the issue assigned to you, **submit** a pull request, and choose the correct file in the options and comment it below.\n\nWhich file did you have to interact with to solve the issue?\n\nA) CONTRIBUTING.md\nB) LICENSE\nC) README.md\nD) CHANGELOG.md\n\n**Outcome:** By identifying and resolving a non-code issue and submitting a pull request, you contribute to the project's improvement. This task demonstrates your initiative and commitment to enhancing the project, deepening your understanding of open-source collaboration, and supporting the project's growth.\n\n**Help:** If you need help with this task, type \"help\" in the comment box to get hints, but it will cost you 5 points from your total score.",
              error:
                "### 🚨 Oops, That's Not Quite Right!\n\nIt seems the file you've chosen doesn't match the one we were looking for to solve the non-code issue. \n\nRemember, each non-code contribution plays a crucial role in enhancing the project's quality and accessibility. Whether it's documentation, graphics, or organization, every aspect is important.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nThis task is a bit like detective work 🔍.\n\nSolving a non-code issue by interacting with the right project file demonstrates your ability to contribute to and navigate the project effectively. It's an essential skill in open-source collaboration, showing that you're ready to contribute in a variety of ways.\n\nReady for another try? The correct file and solution to the issue are just a thought process away!\n\nPlease select the correct answer from the options below based on the issue you're addressing:\n\nA) README.md\nB) LICENSE\nC) CONTRIBUTING.md\nD) CHANGELOG.md\n\nType the letter in the comment box to complete this task.",
              success:
                "### 🌟 Congratulations! You've Made Your First Contribution!\n\nBy solving a non-code issue within our project, you've demonstrated your ability to contribute to our community in diverse and meaningful ways. Your effort enhances the project's quality and accessibility, proving that contributions extend far beyond just code.\n\nFor your dedication and successful contribution, you've been awarded **${experiencePoints} experience points!**\n\n>🌟 🌟 🌟\n\n🏆 **Current Progress:** These ${experiencePoints} points boost your total to **${currentPoints} points**, solidifying your status at Level 2. This achievement is a direct reflection of your commitment, learning, and active participation in our project.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate. To successfully complete the entire quest, you need to reach a 100% completion rate. Each contribution brings you closer to this next significant milestone.\n\n> 🌟 🌟 🌟\n\nFantastic work! Your journey through the project vividly illustrates your growth and the impact of your contributions.\n\nAre you ready to tackle the next challenge? More adventures and rewards are on the horizon!\n\nThe adventure continues! 🌟\n\n",
              answer: "a",
              hints: [],
            },
          };
        } else {
          // Fallback for other fixed quests
          questData.tasks = {
            T1: {
              desc: "Complete the quest task",
              points: 20,
              xp: 20,
              type: "general",
              accept:
                "Complete this quest task to progress in your learning journey.",
              success:
                "Great job! You've completed this quest task successfully!",
              error: "Not quite right. Please try again!",
              answer: "a",
              hints: [],
            },
          };
        }
      }
      return questData;
    }),
    metadata: {
      version: "2.0",
      description: `Quest configuration for ${classInfo.groupName || "Class"}`,
      lastUpdated: new Date().toISOString(),
      totalQuests: unifiedQuestOrder.length,
      customQuests: unifiedQuestOrder.filter((q) => q.type === "custom").length,
      fixedQuests: unifiedQuestOrder.filter((q) => q.type === "fixed").length,
    },
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Manage Quests for {classInfo.groupName || "..."}
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          sx={{ mb: 2 }}
          onClick={() => navigate(-1)}
        >
          ← Back to Class
        </Button>
      </Box>
      {/* Quest Management Actions */}
      <Stack direction="row" spacing={2} mb={4}>
        <Button
          variant="contained"
          sx={{ bgcolor: "#fb5233", "&:hover": { bgcolor: "#e04a2e" } }}
          onClick={() => setShowQuestModal(true)}
        >
          Create Quest
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleViewMyQuests}
          disabled={isLoadingQuests}
        >
          {isLoadingQuests ? "Loading..." : "View Quest Library"}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={resetQuestOrderToDefault}
          disabled={isSavingQuestOrder}
        >
          {isSavingQuestOrder ? "Saving..." : "Reset Quest Order"}
        </Button>
      </Stack>
      {/* Status Messages */}
      <Box sx={{ minHeight: 60, mb: 3, display: "flex", alignItems: "center" }}>
        {questOrderSaveStatus && (
          <Alert
            severity={
              questOrderSaveStatus.includes("Error")
                ? "error"
                : questOrderSaveStatus.includes("successfully")
                ? "success"
                : "info"
            }
            sx={{ width: "100%" }}
          >
            {questOrderSaveStatus}
          </Alert>
        )}
      </Box>
      {/* Quest List */}
      <Box>
        {unifiedQuestOrder.map((quest, index) => (
          <Card
            key={quest._id || quest.id}
            data-quest-id={quest._id || quest.id}
            sx={{
              mb: 2,
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: quest.isQ0 ? "#f5f5f5" : "white",
            }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {quest.title || quest.questTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(() => {
                  console.log(
                    `🔍 [DEBUG] Rendering quest ${quest._id || quest.id}:`,
                    {
                      type: quest.type,
                      tasks: quest.tasks,
                      taskCount: quest.tasks
                        ? Array.isArray(quest.tasks)
                          ? quest.tasks.length
                          : Object.keys(quest.tasks).length
                        : 0,
                      hasTasks: !!quest.tasks,
                    }
                  );

                  if (quest.type === "fixed") {
                    return quest.content;
                  } else {
                    return quest.tasks
                      ? `${
                          Array.isArray(quest.tasks)
                            ? quest.tasks.length
                            : Object.keys(quest.tasks).length
                        } tasks`
                      : "No tasks";
                  }
                })()}
              </Typography>
              <Stack direction="row" spacing={1} mt={1}>
                {quest.type === "custom" && (
                  <Chip label="Custom Quest" color="primary" size="small" />
                )}
              </Stack>
              {/* Render tasks if present */}
              {quest.tasks && (
                <Box sx={{ ml: 4, mt: 2 }}>
                  {Array.isArray(quest.tasks)
                    ? quest.tasks.map((task, tIdx) => (
                        <Stack
                          key={tIdx}
                          direction="row"
                          alignItems="center"
                          spacing={2}
                          sx={{ mb: 1 }}
                        >
                          <Chip
                            label={
                              task.type === "multiple-choice"
                                ? "Multiple Choice"
                                : task.type === "get-issue-count" &&
                                  task.ossRepository
                                ? "Get Issue Count"
                                : task.type === "get-pr-count" &&
                                  task.ossRepository
                                ? "Get PR Count"
                                : task.type === "get-open-issue" &&
                                  task.ossRepository
                                ? "Get Open Issue"
                                : task.type === "get-top-contributor" &&
                                  task.ossRepository
                                ? "Get Top Contributor"
                                : task.type === "get-issue-title" &&
                                  task.ossRepository
                                ? "Get Issue Title"
                                : task.type === "quiz"
                                ? "Quiz"
                                : task.type === "issue-selection"
                                ? "Issue Selection"
                                : task.type === "pr-creation"
                                ? "Pull Request Creation"
                                : task.type === "text-input"
                                ? "Text Input"
                                : task.type === "custom-api-call"
                                ? "Custom API Call"
                                : task.type === "assigned"
                                ? "Assignment Validation"
                                : task.type === "issue-no"
                                ? "Issue Number Validation"
                                : task.type === "comment"
                                ? "Comment Validation"
                                : task.type || "Task"
                            }
                            color="info"
                            size="small"
                            sx={{ minWidth: 120 }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ flex: 1 }}
                          >
                            {task.title || task.desc || `Task ${tIdx + 1}`}
                          </Typography>
                          <Chip
                            label={`XP: ${task.xp ?? 0}`}
                            color="success"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={`Points: ${task.points ?? 0}`}
                            color="primary"
                            size="small"
                          />
                        </Stack>
                      ))
                    : Object.entries(quest.tasks).map(([taskKey, task]) => (
                        <Stack
                          key={taskKey}
                          direction="row"
                          alignItems="center"
                          spacing={2}
                          sx={{ mb: 1 }}
                        >
                          <Chip
                            label={
                              task.type === "multiple-choice"
                                ? "Multiple Choice"
                                : task.type === "get-issue-count" &&
                                  task.ossRepository
                                ? "Get Issue Count"
                                : task.type === "get-pr-count" &&
                                  task.ossRepository
                                ? "Get PR Count"
                                : task.type === "get-open-issue" &&
                                  task.ossRepository
                                ? "Get Open Issue"
                                : task.type === "get-top-contributor" &&
                                  task.ossRepository
                                ? "Get Top Contributor"
                                : task.type === "get-issue-title" &&
                                  task.ossRepository
                                ? "Get Issue Title"
                                : task.type === "quiz"
                                ? "Quiz"
                                : task.type === "issue-selection"
                                ? "Issue Selection"
                                : task.type === "pr-creation"
                                ? "Pull Request Creation"
                                : task.type === "text-input"
                                ? "Text Input"
                                : task.type === "custom-api-call"
                                ? "Custom API Call"
                                : task.type === "assigned"
                                ? "Assignment Validation"
                                : task.type === "issue-no"
                                ? "Issue Number Validation"
                                : task.type === "comment"
                                ? "Comment Validation"
                                : task.type || "Task"
                            }
                            color="info"
                            size="small"
                            sx={{ minWidth: 120 }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ flex: 1 }}
                          >
                            {task.title || task.desc || taskKey}
                          </Typography>
                          <Chip
                            label={`XP: ${task.xp ?? 0}`}
                            color="success"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={`Points: ${task.points ?? 0}`}
                            color="primary"
                            size="small"
                          />
                        </Stack>
                      ))}
                </Box>
              )}
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {!quest.isQ0 && (
                <>
                  {/* Up/Down arrows remain as plain buttons */}
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    title="Move Up"
                    onClick={() =>
                      quest.type === "fixed"
                        ? moveFixedQuestUp(quest.id)
                        : moveQuestUp(quest._id)
                    }
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    title="Move Down"
                    onClick={() =>
                      quest.type === "fixed"
                        ? moveFixedQuestDown(quest.id)
                        : moveQuestDown(quest._id)
                    }
                  >
                    ↓
                  </button>
                  {quest.type === "custom" && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={() => handleEditQuest(quest)}
                    >
                      ✏️ Edit
                    </Button>
                  )}
                  {quest.type === "custom" && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveQuestFromClass(quest)}
                    >
                      🗑️ Remove from Class
                    </Button>
                  )}
                  {quest.type === "fixed" && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        setUnifiedQuestOrder((prevOrder) => {
                          const newOrder = prevOrder.filter(
                            (q) => q.id !== quest.id
                          );
                          debouncedSaveQuestOrder(newOrder);
                          return newOrder;
                        });
                        setQuestOrderSaveStatus(
                          `${quest.id} removed from quest order. It's available in the quest library.`
                        );
                        setTimeout(() => setQuestOrderSaveStatus(""), 3000);
                      }}
                    >
                      🗑️ Remove from Class
                    </Button>
                  )}
                </>
              )}
              {quest.isQ0 && (
                <Typography variant="caption" color="secondary" sx={{ ml: 1 }}>
                  Fixed
                </Typography>
              )}
            </Stack>
          </Card>
        ))}
        {unifiedQuestOrder.filter((q) => q.type === "custom").length === 0 && (
          <Card sx={{ p: 3, mt: 2, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No custom quests added to this class
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add quests from your quest library or create new ones
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                sx={{ bgcolor: "#fb5233", "&:hover": { bgcolor: "#e04a2e" } }}
                onClick={() => setShowQuestModal(true)}
              >
                Create Custom Quest
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleViewMyQuests}
                disabled={isLoadingQuests}
              >
                {isLoadingQuests ? "Loading..." : "View Quest Library"}
              </Button>
            </Stack>
          </Card>
        )}
      </Box>

      {/* Download JSON Section */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          bgcolor: "#fafafa",
        }}
      >
        <Typography variant="h6" gutterBottom>
          📥 Export Quest Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Download the current quest order and configuration as a JSON file.
          This includes all quests in their current order, metadata, and task
          information.
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownloadJSON}
            startIcon={<span>📄</span>}
          >
            Download Quest Configuration JSON
          </Button>
          <Typography variant="caption" color="text.secondary">
            {unifiedQuestOrder.length} quests •{" "}
            {unifiedQuestOrder.filter((q) => q.type === "custom").length} custom
            • {unifiedQuestOrder.filter((q) => q.type === "fixed").length}{" "}
            default
          </Typography>
        </Stack>
      </Box>

      {/* Quest Creation/Edit Modal */}
      <Dialog
        open={showQuestModal}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          if (isEditMode) {
            handleCancelEdit();
          } else {
            setShowQuestModal(false);
          }
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? "Edit Quest" : "Add New Class Quest"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            {/* Basic Quest Information */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Basic Quest Information
            </Typography>
            <TextField
              fullWidth
              label="Quest ID (e.g., Module1, Q1, etc.)"
              value={questFormData.questId}
              onChange={(e) =>
                setQuestFormData({ ...questFormData, questId: e.target.value })
              }
              margin="normal"
              helperText="Unique identifier for the quest (optional - will be auto-generated if not provided)"
            />
            <TextField
              fullWidth
              label="Quest Title"
              value={questFormData.title}
              onChange={(e) =>
                setQuestFormData({
                  ...questFormData,
                  title: e.target.value,
                  metadata: {
                    ...questFormData.metadata,
                    title: e.target.value,
                  },
                })
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Quest Description"
              value={questFormData.description}
              onChange={(e) =>
                setQuestFormData({
                  ...questFormData,
                  description: e.target.value,
                  metadata: {
                    ...questFormData.metadata,
                    description: e.target.value,
                  },
                })
              }
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Badge Description"
              value={questFormData.badgeDescription}
              onChange={(e) =>
                setQuestFormData({
                  ...questFormData,
                  badgeDescription: e.target.value,
                })
              }
              margin="normal"
              multiline
              rows={2}
              helperText="Description that appears when the quest badge is earned (e.g., '🎯 Knowledge Seeker - You've demonstrated solid foundational knowledge!')"
            />

            {/* Quest Metadata */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Quest Metadata
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Prerequisites will be automatically generated based on quest order
              when you download the configuration.
            </Typography>

            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Tasks
            </Typography>

            {/* Quest Type Information */}
            {questFormData.tasks.length > 0 && (
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Quest Type:{" "}
                  <strong>
                    {getQuestTypeInfo().type === "mixed"
                      ? "Mixed Types"
                      : getQuestTypeInfo().type.toUpperCase()}
                  </strong>
                </Typography>
                {getQuestTypeInfo().type === "mixed" && (
                  <Typography variant="caption" color="text.secondary">
                    This quest contains multiple task types:
                    {getQuestTypeInfo().hasMultipleChoice && " Multiple Choice"}
                    {getQuestTypeInfo().hasMetric && " • Metric Tasks"}
                    {getQuestTypeInfo().hasOther && " • Other Tasks"}
                  </Typography>
                )}
              </Box>
            )}

            {questFormData.tasks.map((task, taskIndex) => (
              <Card key={taskIndex} sx={{ mb: 3, p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <TextField
                    label="Task Title"
                    value={task.title}
                    onChange={(e) => {
                      const tasks = [...questFormData.tasks];
                      tasks[taskIndex].title = e.target.value;
                      setQuestFormData({ ...questFormData, tasks });
                    }}
                    sx={{ flex: 1 }}
                  />
                  {questFormData.tasks.length > 1 && (
                    <Button
                      color="error"
                      onClick={() => {
                        const tasks = questFormData.tasks.filter(
                          (_, i) => i !== taskIndex
                        );
                        setQuestFormData({ ...questFormData, tasks });
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>

                {/* Task Basic Info */}
                <TextField
                  fullWidth
                  label="Quest Notes (not displayed to student)"
                  value={task.desc}
                  onChange={(e) => {
                    const tasks = [...questFormData.tasks];
                    tasks[taskIndex].desc = e.target.value;
                    setQuestFormData({ ...questFormData, tasks });
                  }}
                  margin="normal"
                  helperText="Notes for task (not shown to students)"
                />

                {/* Task Type Selector */}
                <TextField
                  select
                  fullWidth
                  label="Task Type"
                  value={task.type || "multiple-choice"}
                  onChange={(e) => {
                    const tasks = [...questFormData.tasks];
                    tasks[taskIndex].type = e.target.value;
                    // Reset config and fields based on new type
                    if (e.target.value === "multiple-choice") {
                      tasks[taskIndex].config = {
                        correctAnswer: "a",
                        optionA: "",
                        optionB: "",
                        optionC: "",
                        optionD: "",
                      };
                      tasks[taskIndex].answer = "a";
                      // Remove metric fields
                      delete tasks[taskIndex].ossRepository;
                      delete tasks[taskIndex].issueNumber;
                    } else if (
                      e.target.value === "get-issue-count" ||
                      e.target.value === "get-pr-count" ||
                      e.target.value === "get-open-issue" ||
                      e.target.value === "get-top-contributor"
                    ) {
                      tasks[taskIndex].config = {
                        ossRepository: "",
                      };
                      tasks[taskIndex].ossRepository = "";
                      tasks[taskIndex].answer = "";
                      tasks[taskIndex].answerType = "metric";
                      // Remove MCQ fields
                      delete tasks[taskIndex].correctAnswer;
                      delete tasks[taskIndex].options;
                      delete tasks[taskIndex].issueNumber;
                    } else if (e.target.value === "get-issue-title") {
                      tasks[taskIndex].config = {
                        ossRepository: "",
                        issueNumber: "",
                      };
                      tasks[taskIndex].ossRepository = "";
                      tasks[taskIndex].issueNumber = "";
                      tasks[taskIndex].answer = "";
                      tasks[taskIndex].answerType = "metric";
                      // Remove MCQ fields
                      delete tasks[taskIndex].correctAnswer;
                      delete tasks[taskIndex].options;
                    } else if (e.target.value === "text-input") {
                      tasks[taskIndex].config = {
                        expectedAnswer: "",
                      };
                      tasks[taskIndex].answer = "";
                      tasks[taskIndex].answerType = "singleAnswer";
                      // Remove metric fields
                      delete tasks[taskIndex].ossRepository;
                      delete tasks[taskIndex].issueNumber;
                    } else if (e.target.value === "quiz") {
                      tasks[taskIndex].config = {
                        questionCount: 5,
                        correctAnswers: "",
                      };
                      tasks[taskIndex].answer = "";
                      tasks[taskIndex].answerType = "multipleAnswers";
                      // Remove metric fields
                      delete tasks[taskIndex].ossRepository;
                      delete tasks[taskIndex].issueNumber;
                    } else if (e.target.value === "custom-api-call") {
                      tasks[taskIndex].config = {
                        apiEndpoint: "",
                        responsePath: "",
                        expectedAnswerType: "Number",
                      };
                      tasks[taskIndex].answer = "";
                      tasks[taskIndex].answerType = "custom";
                      // Remove metric fields
                      delete tasks[taskIndex].ossRepository;
                      delete tasks[taskIndex].issueNumber;
                    } else if (
                      e.target.value === "issue-selection" ||
                      e.target.value === "pr-creation"
                    ) {
                      tasks[taskIndex].config = {};
                      tasks[taskIndex].answer = "";
                      // Remove metric fields
                      delete tasks[taskIndex].ossRepository;
                      delete tasks[taskIndex].issueNumber;
                    }
                    setQuestFormData({ ...questFormData, tasks });
                  }}
                  margin="normal"
                  SelectProps={{ native: true }}
                >
                  <option
                    value="custom-api-call"
                    style={{ backgroundColor: "#e3f2fd", fontWeight: "bold" }}
                  >
                    Custom API Call
                  </option>
                  <option
                    disabled
                    style={{
                      backgroundColor: "#f5f5f5",
                      fontWeight: "bold",
                      color: "#666",
                    }}
                  >
                    Default Task Types
                  </option>
                  <option value="multiple-choice">
                    Multiple Choice Question
                  </option>
                  <option value="get-issue-count">Get Issue Count</option>
                  <option value="get-pr-count">Get PR Count</option>
                  <option value="get-open-issue">Get Open Issue</option>
                  <option value="get-issue-title">Get Issue Title</option>
                  <option value="get-top-contributor">
                    Get Top Contributor
                  </option>
                  <option value="text-input">Text Input</option>
                  <option value="quiz">Quiz</option>
                  <option value="issue-selection">Issue Selection</option>
                  <option value="pr-creation">Pull Request Creation</option>
                  <option value="assigned">Assignment Validation</option>
                  <option value="issue-no">Issue Number Validation</option>
                  <option value="comment">Comment Validation</option>
                  <option value="custom-api-call">Custom API Call</option>
                </TextField>

                <TextEditor
                  value={task.description}
                  onChange={(value) => {
                    const tasks = [...questFormData.tasks];
                    tasks[taskIndex].description = value;
                    setQuestFormData({ ...questFormData, tasks });
                  }}
                  label="Task Description"
                  placeholder="Enter the task description here"
                  helperText="This is the main task description that students will see."
                  acceptFileTypes=".txt,.md,.markdown,text/plain,text/markdown"
                />
                <TextField
                  fullWidth
                  label="Outcome"
                  value={task.outcome}
                  onChange={(e) => {
                    const tasks = [...questFormData.tasks];
                    tasks[taskIndex].outcome = e.target.value;
                    setQuestFormData({ ...questFormData, tasks });
                  }}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Help Text"
                  value={task.helpText}
                  onChange={(e) => {
                    const tasks = [...questFormData.tasks];
                    tasks[taskIndex].helpText = e.target.value;
                    setQuestFormData({ ...questFormData, tasks });
                  }}
                  margin="normal"
                />

                {/* Task Points and Settings */}
                <Stack direction="row" spacing={2} mt={2}>
                  <TextField
                    label="Points"
                    type="number"
                    value={task.points || 0}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                      if (value < 0) {
                        // Prevent setting points below 0
                        return;
                      }
                      const tasks = [...questFormData.tasks];
                      tasks[taskIndex].points = value;
                      setQuestFormData({ ...questFormData, tasks });
                    }}
                    inputProps={{ min: 0 }}
                    sx={{ width: 120 }}
                    helperText="Min: 0"
                  />
                  <TextField
                    label="XP Points"
                    type="number"
                    value={task.xp || 0}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                      if (value < 0) {
                        // Prevent setting XP below 0
                        return;
                      }
                      const tasks = [...questFormData.tasks];
                      tasks[taskIndex].xp = value;
                      setQuestFormData({ ...questFormData, tasks });
                    }}
                    inputProps={{ min: 0 }}
                    sx={{ width: 120 }}
                    helperText="Min: 0"
                  />
                </Stack>

                {/* Conditional Fields Based on Task Type */}
                {(task.type === "multiple-choice" || !task.type) && (
                  <>
                    <TextField
                      select
                      label="Correct Answer"
                      value={task.config?.correctAnswer || "a"}
                      onChange={(e) => {
                        const tasks = [...questFormData.tasks];
                        if (!tasks[taskIndex].config)
                          tasks[taskIndex].config = {};
                        tasks[taskIndex].config.correctAnswer = e.target.value;
                        tasks[taskIndex].answer = e.target.value;
                        setQuestFormData({ ...questFormData, tasks });
                      }}
                      SelectProps={{ native: true }}
                      sx={{ width: 180, mt: 2 }}
                    >
                      <option value="a">A</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                    </TextField>

                    {/* Task Options */}
                    <Stack direction="row" spacing={2} mt={2}>
                      <TextField
                        label="Option A"
                        value={task.config?.optionA || ""}
                        onChange={(e) => {
                          const tasks = [...questFormData.tasks];
                          if (!tasks[taskIndex].config)
                            tasks[taskIndex].config = {};
                          tasks[taskIndex].config.optionA = e.target.value;
                          setQuestFormData({ ...questFormData, tasks });
                        }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Option B"
                        value={task.config?.optionB || ""}
                        onChange={(e) => {
                          const tasks = [...questFormData.tasks];
                          if (!tasks[taskIndex].config)
                            tasks[taskIndex].config = {};
                          tasks[taskIndex].config.optionB = e.target.value;
                          setQuestFormData({ ...questFormData, tasks });
                        }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Option C"
                        value={task.config?.optionC || ""}
                        onChange={(e) => {
                          const tasks = [...questFormData.tasks];
                          if (!tasks[taskIndex].config)
                            tasks[taskIndex].config = {};
                          tasks[taskIndex].config.optionC = e.target.value;
                          setQuestFormData({ ...questFormData, tasks });
                        }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Option D"
                        value={task.config?.optionD || ""}
                        onChange={(e) => {
                          const tasks = [...questFormData.tasks];
                          if (!tasks[taskIndex].config)
                            tasks[taskIndex].config = {};
                          tasks[taskIndex].config.optionD = e.target.value;
                          setQuestFormData({ ...questFormData, tasks });
                        }}
                        sx={{ flex: 1 }}
                      />
                    </Stack>
                  </>
                )}

                {(task.type === "get-issue-count" ||
                  task.type === "get-pr-count" ||
                  task.type === "get-open-issue" ||
                  task.type === "get-top-contributor") && (
                  <TextField
                    fullWidth
                    label="OSS Repository"
                    value={task.config?.ossRepository || ""}
                    onChange={(e) => {
                      const tasks = [...questFormData.tasks];
                      if (!tasks[taskIndex].config)
                        tasks[taskIndex].config = {};
                      tasks[taskIndex].config.ossRepository = e.target.value;
                      setQuestFormData({ ...questFormData, tasks });
                    }}
                    margin="normal"
                    placeholder="owner/repo-name"
                    helperText="GitHub repository in format: owner/repo-name"
                  />
                )}

                {task.type === "get-issue-title" && (
                  <>
                    <TextField
                      fullWidth
                      label="OSS Repository"
                      value={task.config?.ossRepository || ""}
                      onChange={(e) => {
                        const tasks = [...questFormData.tasks];
                        if (!tasks[taskIndex].config)
                          tasks[taskIndex].config = {};
                        tasks[taskIndex].config.ossRepository = e.target.value;
                        setQuestFormData({ ...questFormData, tasks });
                      }}
                      margin="normal"
                      placeholder="owner/repo-name"
                      helperText="GitHub repository in format: owner/repo-name"
                    />
                    <TextField
                      fullWidth
                      label="Issue Number"
                      type="number"
                      value={task.config?.issueNumber || ""}
                      onChange={(e) => {
                        const tasks = [...questFormData.tasks];
                        if (!tasks[taskIndex].config)
                          tasks[taskIndex].config = {};
                        tasks[taskIndex].config.issueNumber = e.target.value;
                        setQuestFormData({ ...questFormData, tasks });
                      }}
                      margin="normal"
                      placeholder="123"
                      helperText="The issue number to get the title for"
                    />
                  </>
                )}

                {task.type === "text-input" && (
                  <TextField
                    fullWidth
                    label="Expected Answer"
                    value={task.config?.expectedAnswer || ""}
                    onChange={(e) => {
                      const tasks = [...questFormData.tasks];
                      if (!tasks[taskIndex].config)
                        tasks[taskIndex].config = {};
                      tasks[taskIndex].config.expectedAnswer = e.target.value;
                      setQuestFormData({ ...questFormData, tasks });
                    }}
                    margin="normal"
                    helperText="What the user should type to complete this task"
                  />
                )}

                {task.type === "quiz" && (
                  <Box mt={2}>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Number of Questions"
                        type="number"
                        value={task.config?.questionCount || 5}
                        onChange={(e) => {
                          const tasks = [...questFormData.tasks];
                          if (!tasks[taskIndex].config)
                            tasks[taskIndex].config = {};
                          tasks[taskIndex].config.questionCount =
                            parseInt(e.target.value) || 5;
                          setQuestFormData({ ...questFormData, tasks });
                        }}
                        sx={{ width: 200 }}
                        inputProps={{ min: 1, max: 10 }}
                      />
                      <TextField
                        label="Correct Answers"
                        value={task.config?.correctAnswers || ""}
                        onChange={(e) => {
                          const tasks = [...questFormData.tasks];
                          if (!tasks[taskIndex].config)
                            tasks[taskIndex].config = {};
                          tasks[taskIndex].config.correctAnswers =
                            e.target.value;
                          setQuestFormData({ ...questFormData, tasks });
                        }}
                        sx={{ flex: 1 }}
                        placeholder="a,b,c,d,e"
                        helperText="Comma-separated answers (e.g., a,b,c,d,e)"
                      />
                    </Stack>
                  </Box>
                )}

                {task.type === "custom-api-call" && (
                  <Box mt={2}>
                    <Box
                      sx={{
                        backgroundColor: "#e3f2fd",
                        p: 2,
                        borderRadius: 1,
                        border: "2px solid #2196f3",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        Custom API Call Task
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        Create dynamic tasks that call GitHub APIs to retrieve
                        real-time data
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      label="Repository"
                      value={task.config?.repository || ""}
                      onChange={(e) => {
                        const tasks = [...questFormData.tasks];
                        if (!tasks[taskIndex].config)
                          tasks[taskIndex].config = {};
                        tasks[taskIndex].config.repository = e.target.value;
                        setQuestFormData({ ...questFormData, tasks });
                      }}
                      margin="normal"
                      placeholder="JabRef/jabref"
                      helperText="Repository to analyze (e.g., JabRef/jabref) - leave empty to use student's assigned repo"
                    />
                    <TextField
                      fullWidth
                      label="API Endpoint"
                      value={task.config?.apiEndpoint || ""}
                      onChange={(e) => {
                        const tasks = [...questFormData.tasks];
                        if (!tasks[taskIndex].config)
                          tasks[taskIndex].config = {};
                        tasks[taskIndex].config.apiEndpoint = e.target.value;
                        setQuestFormData({ ...questFormData, tasks });
                      }}
                      margin="normal"
                      placeholder="/repos/{owner}/{repo}/stargazers"
                      helperText="GitHub API endpoint with {owner} and {repo} placeholders"
                    />
                    <TextField
                      fullWidth
                      label="Response Path"
                      value={task.config?.responsePath || ""}
                      onChange={(e) => {
                        const tasks = [...questFormData.tasks];
                        if (!tasks[taskIndex].config)
                          tasks[taskIndex].config = {};
                        tasks[taskIndex].config.responsePath = e.target.value;
                        setQuestFormData({ ...questFormData, tasks });
                      }}
                      margin="normal"
                      placeholder="length, language, description"
                      helperText="JSON path to extract the answer from API response"
                    />
                    <TextField
                      select
                      fullWidth
                      label="Expected Answer Type"
                      value={task.config?.expectedAnswerType || "Number"}
                      onChange={(e) => {
                        const tasks = [...questFormData.tasks];
                        if (!tasks[taskIndex].config)
                          tasks[taskIndex].config = {};
                        tasks[taskIndex].config.expectedAnswerType =
                          e.target.value;
                        setQuestFormData({ ...questFormData, tasks });
                      }}
                      margin="normal"
                      SelectProps={{ native: true }}
                    >
                      <option value="Number">Number</option>
                      <option value="Text">Text</option>
                    </TextField>

                    {/* Additional options for Number type */}
                    {(task.config?.expectedAnswerType === "Number" ||
                      (task.type === "custom-api-call" &&
                        (!task.config?.expectedAnswerType ||
                          task.config?.expectedAnswerType === "Number"))) && (
                      <Box
                        key={`tolerance-options-${taskIndex}-${task.config?.expectedAnswerType}`}
                        sx={{ mt: 2 }}
                      >
                        {/* Info box for number visibility */}
                        <Alert
                          severity="info"
                          sx={{ mb: 2 }}
                          action={
                            <IconButton
                              aria-label="close"
                              color="inherit"
                              size="small"
                            >
                              <InfoIcon />
                            </IconButton>
                          }
                        >
                          <AlertTitle>Number Visibility</AlertTitle>
                          Ensure the number can be seen by students in the
                          GitHub repository. For example, if asking for issue
                          count, make sure students can access the repository
                          and see the issues tab.
                        </Alert>

                        {/* Tolerance checkbox */}
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={task.config?.enableTolerance || false}
                              onChange={(e) => {
                                const tasks = [...questFormData.tasks];
                                if (!tasks[taskIndex].config)
                                  tasks[taskIndex].config = {};
                                tasks[taskIndex].config.enableTolerance =
                                  e.target.checked;
                                setQuestFormData({ ...questFormData, tasks });
                              }}
                            />
                          }
                          label="Enable tolerance for dynamic numbers (10% default)"
                        />

                        {task.config?.enableTolerance && (
                          <TextField
                            fullWidth
                            label="Tolerance Percentage"
                            type="number"
                            value={task.config?.tolerancePercentage || 10}
                            onChange={(e) => {
                              const tasks = [...questFormData.tasks];
                              if (!tasks[taskIndex].config)
                                tasks[taskIndex].config = {};
                              tasks[taskIndex].config.tolerancePercentage =
                                parseInt(e.target.value) || 10;
                              setQuestFormData({ ...questFormData, tasks });
                            }}
                            margin="normal"
                            helperText="Percentage tolerance for numbers that might change while in use (e.g., 10 for 10%)"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                )}

                {(task.type === "issue-selection" ||
                  task.type === "pr-creation") && (
                  <TextField
                    fullWidth
                    label="Expected Response"
                    value={task.answer || ""}
                    onChange={(e) => {
                      const tasks = [...questFormData.tasks];
                      tasks[taskIndex].answer = e.target.value;
                      setQuestFormData({ ...questFormData, tasks });
                    }}
                    margin="normal"
                    helperText={`What the user should do to complete this ${
                      task.type === "issue-selection"
                        ? "issue selection"
                        : "pull request creation"
                    } task (e.g., 'DONE', issue number, etc.)`}
                  />
                )}

                {(task.type === "assigned" ||
                  task.type === "issue-no" ||
                  task.type === "comment") && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label="Repository (owner/repo)"
                      value={task.ossRepository || ""}
                      onChange={(e) => {
                        const tasks = [...questFormData.tasks];
                        tasks[taskIndex].ossRepository = e.target.value;
                        setQuestFormData({ ...questFormData, tasks });
                      }}
                      margin="normal"
                      placeholder="e.g., microsoft/vscode"
                      helperText="Format: owner/repository-name"
                    />

                    {(task.type === "assigned" || task.type === "comment") && (
                      <TextField
                        fullWidth
                        label="Issue Number"
                        type="number"
                        value={task.issueNumber || ""}
                        onChange={(e) => {
                          const tasks = [...questFormData.tasks];
                          tasks[taskIndex].issueNumber = e.target.value;
                          setQuestFormData({ ...questFormData, tasks });
                        }}
                        margin="normal"
                        placeholder="e.g., 123"
                        helperText={`The specific issue number for ${
                          task.type === "assigned"
                            ? "assignment validation"
                            : "comment validation"
                        }`}
                      />
                    )}
                  </Box>
                )}

                {/* Task Response Messages */}
                <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                  Response Messages
                </Typography>
                <TextField
                  fullWidth
                  label="Accept Response (Initial Question)"
                  value={task.accept}
                  onChange={(e) => {
                    const tasks = [...questFormData.tasks];
                    tasks[taskIndex].accept = e.target.value;
                    setQuestFormData({ ...questFormData, tasks });
                  }}
                  margin="normal"
                  multiline
                  rows={4}
                  helperText="The message shown when the task is first presented (include Objective, Question, Options, Help)"
                />
                <TextField
                  fullWidth
                  label="Success Response"
                  value={task.success}
                  onChange={(e) => {
                    const tasks = [...questFormData.tasks];
                    tasks[taskIndex].success = e.target.value;
                    setQuestFormData({ ...questFormData, tasks });
                  }}
                  margin="normal"
                  multiline
                  rows={3}
                  helperText="Message shown when the correct answer is given"
                />
                <TextField
                  fullWidth
                  label="Error Response"
                  value={task.error}
                  onChange={(e) => {
                    const tasks = [...questFormData.tasks];
                    tasks[taskIndex].error = e.target.value;
                    setQuestFormData({ ...questFormData, tasks });
                  }}
                  margin="normal"
                  multiline
                  rows={3}
                  helperText="Message shown when an incorrect answer is given"
                />

                {/* Task Hints Section */}
                <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                  Hints
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                  <Button
                    variant={
                      task.hints && task.hints.length > 0
                        ? "contained"
                        : "outlined"
                    }
                    color="primary"
                    onClick={() => {
                      const tasks = [...questFormData.tasks];
                      if (!tasks[taskIndex].hints) {
                        tasks[taskIndex].hints = [];
                      }
                      // If no hints exist, add the first one
                      if (tasks[taskIndex].hints.length === 0) {
                        tasks[taskIndex].hints.push({
                          sequence: 1,
                          content: "",
                          penalty: 0,
                        });
                      }
                      setQuestFormData({ ...questFormData, tasks });
                    }}
                  >
                    {task.hints && task.hints.length > 0
                      ? "Hints Enabled"
                      : "Enable Hints"}
                  </Button>
                </Stack>
                {task.hints && task.hints.length > 0 && (
                  <>
                    {task.hints.map((hint, hintIndex) => (
                      <Card
                        key={hintIndex}
                        sx={{ mb: 2, p: 2, bgcolor: "grey.50" }}
                      >
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          mb={2}
                        >
                          <TextField
                            label="Sequence"
                            type="number"
                            value={hint.sequence || hintIndex + 1}
                            onChange={(e) => {
                              const tasks = [...questFormData.tasks];
                              tasks[taskIndex].hints[hintIndex].sequence =
                                parseInt(e.target.value) || 1;
                              setQuestFormData({ ...questFormData, tasks });
                            }}
                            sx={{ width: 120 }}
                            inputProps={{ min: 1 }}
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
                              const tasks = [...questFormData.tasks];
                              tasks[taskIndex].hints[hintIndex].penalty = value;
                              setQuestFormData({ ...questFormData, tasks });
                            }}
                            sx={{ width: 150 }}
                            inputProps={{ min: 0 }}
                            helperText="Min: 0"
                          />
                          <Button
                            color="error"
                            onClick={() => {
                              const tasks = [...questFormData.tasks];
                              tasks[taskIndex].hints = tasks[
                                taskIndex
                              ].hints.filter((_, i) => i !== hintIndex);
                              setQuestFormData({ ...questFormData, tasks });
                            }}
                          >
                            Remove
                          </Button>
                        </Stack>
                        <TextField
                          fullWidth
                          label={`Hint ${hintIndex + 1} Content`}
                          value={hint.content || ""}
                          onChange={(e) => {
                            const tasks = [...questFormData.tasks];
                            tasks[taskIndex].hints[hintIndex].content =
                              e.target.value;
                            setQuestFormData({ ...questFormData, tasks });
                          }}
                          multiline
                          rows={2}
                          helperText="The hint text that will be shown to the user"
                        />
                      </Card>
                    ))}
                    {task.hints.length < 5 && (
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          const tasks = [...questFormData.tasks];
                          tasks[taskIndex].hints.push({
                            sequence: tasks[taskIndex].hints.length + 1,
                            content: "",
                            penalty: 0,
                          });
                          setQuestFormData({ ...questFormData, tasks });
                        }}
                      >
                        + Add Hint
                      </Button>
                    )}
                  </>
                )}
              </Card>
            ))}
            <Button
              variant="outlined"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => {
                setQuestFormData({
                  ...questFormData,
                  tasks: [
                    ...questFormData.tasks,
                    {
                      type: "multiple-choice",
                      title: "",
                      objective: "",
                      description: "",
                      outcome: "",
                      helpText: "",
                      points: 100,
                      xp: 100,
                      descriptionImage: null,
                      config: {
                        correctAnswer: "a",
                        optionA: "",
                        optionB: "",
                        optionC: "",
                        optionD: "",
                      },
                      desc: "",
                      accept: "",
                      success: "",
                      error: "",
                      answer: "a",
                      hints: [],
                    },
                  ],
                });
              }}
            >
              + Add Another Task
            </Button>
            {/* Hints Section */}
            <Box mt={4}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Hints
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Button
                  variant={
                    questFormData.hints.enabled ? "contained" : "outlined"
                  }
                  color="primary"
                  onClick={() =>
                    setQuestFormData({
                      ...questFormData,
                      hints: {
                        ...questFormData.hints,
                        enabled: !questFormData.hints.enabled,
                      },
                    })
                  }
                >
                  {questFormData.hints.enabled
                    ? "Hints Enabled"
                    : "Enable Hints"}
                </Button>
                {questFormData.hints.enabled && (
                  <TextField
                    label="Hint Penalty"
                    type="number"
                    value={questFormData.hints.penalty || 0}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                      if (value < 0) {
                        // Prevent setting penalty below 0
                        return;
                      }
                      setQuestFormData({
                        ...questFormData,
                        hints: {
                          ...questFormData.hints,
                          penalty: value,
                        },
                      });
                    }}
                    inputProps={{ min: 0 }}
                    sx={{ width: 160 }}
                    helperText="Min: 0"
                  />
                )}
              </Stack>
              {questFormData.hints.enabled && (
                <>
                  {questFormData.hints.hints.map((hint, hintIndex) => (
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      key={hintIndex}
                      mb={1}
                    >
                      <TextField
                        label={`Hint ${hintIndex + 1}`}
                        value={hint}
                        onChange={(e) => {
                          const hints = [...questFormData.hints.hints];
                          hints[hintIndex] = e.target.value;
                          setQuestFormData({
                            ...questFormData,
                            hints: { ...questFormData.hints, hints },
                          });
                        }}
                        sx={{ flex: 1 }}
                      />
                      <Button
                        color="error"
                        onClick={() => {
                          const hints = questFormData.hints.hints.filter(
                            (_, i) => i !== hintIndex
                          );
                          setQuestFormData({
                            ...questFormData,
                            hints: { ...questFormData.hints, hints },
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </Stack>
                  ))}
                  {questFormData.hints.hints.length < 3 && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setQuestFormData({
                          ...questFormData,
                          hints: {
                            ...questFormData.hints,
                            hints: [...questFormData.hints.hints, ""],
                          },
                        });
                      }}
                    >
                      + Add Hint
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>
        </DialogContent>
        
        {/* Hint Penalty Validation Errors */}
        {(() => {
          const hintPenaltyErrors = [];
          
          // Check individual task hints
          questFormData.tasks.forEach((task, taskIndex) => {
            if (task.hints && task.hints.length > 0) {
              const totalPenalty = task.hints.reduce((sum, hint) => {
                const penalty = parseInt(hint.penalty) || 0;
                return sum + penalty;
              }, 0);
              const taskPoints = parseInt(task.points) || 1;
              if (totalPenalty > taskPoints) {
                hintPenaltyErrors.push(`Task ${taskIndex + 1}: Hint penalties (${totalPenalty}) exceed task points (${taskPoints})`);
              }
            }
          });
          
          // Check main hints penalty
          if (questFormData.hints && questFormData.hints.enabled) {
            const mainPenalty = parseInt(questFormData.hints.penalty) || 0;
            const totalTaskPoints = questFormData.tasks.reduce((sum, task) => sum + (parseInt(task.points) || 1), 0);
            if (mainPenalty > totalTaskPoints) {
              hintPenaltyErrors.push(`Main Hints: Penalty (${mainPenalty}) exceeds total task points (${totalTaskPoints})`);
            }
          }
          
          return hintPenaltyErrors.length > 0 ? (
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
          ) : null;
        })()}
        
        <DialogActions>
          <Button
            onClick={
              isEditMode ? handleCancelEdit : () => setShowQuestModal(false)
            }
            color="secondary"
          >
            {isEditMode ? "Cancel Edit" : "Cancel"}
          </Button>
          <Button
            onClick={handleUploadMCQQuest}
            color="primary"
            variant="contained"
            disabled={
              isUploadingQuest ||
              questFormData.tasks.length === 0 ||
              questFormData.tasks.every(
                (task) =>
                  !task.title.trim() ||
                  !task.desc.trim() ||
                  !task.description.trim()
              ) ||
              // Check hint penalty validation
              questFormData.tasks.some((task) => {
                if (task.hints && task.hints.length > 0) {
                  const totalPenalty = task.hints.reduce((sum, hint) => {
                    const penalty = parseInt(hint.penalty) || 0;
                    return sum + penalty;
                  }, 0);
                  const taskPoints = parseInt(task.points) || 0;
                  return totalPenalty > taskPoints;
                }
                return false;
              }) ||
              // Check main hints penalty
              (() => {
                if (questFormData.hints && questFormData.hints.enabled) {
                  const mainPenalty = parseInt(questFormData.hints.penalty) || 0;
                  // For main hints, we need to check against the total points of all tasks
                  const totalTaskPoints = questFormData.tasks.reduce((sum, task) => sum + (parseInt(task.points) || 0), 0);
                  return mainPenalty > totalTaskPoints;
                }
                return false;
              })()
            }
            sx={{ fontWeight: "bold" }}
          >
            {isUploadingQuest
              ? isEditMode
                ? "Updating..."
                : "Uploading..."
              : isEditMode
              ? "Update Quest"
              : getQuestTypeInfo().label}
          </Button>
        </DialogActions>
        {uploadQuestStatus && (
          <Box px={3} pb={2} width="100%">
            <Alert
              severity={
                uploadQuestStatus.startsWith("✅") ? "success" : "error"
              }
            >
              {uploadQuestStatus}
            </Alert>
          </Box>
        )}
      </Dialog>

      {/* My Quests Modal */}
      <Dialog
        open={showQuestsModal}
        onClose={() => setShowQuestsModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AssignmentIcon sx={{ mr: 1 }} />
            Quest Library
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Custom Quests Section */}
          <Box mb={4}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              📝 My Custom Quests ({myQuests.length})
            </Typography>

            {myQuests.length === 0 ? (
              <Box textAlign="center" py={4}>
                <AssignmentIcon
                  sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No custom quests found
                </Typography>
                <Typography color="text.secondary" paragraph>
                  You haven't created any custom quests yet.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setShowQuestsModal(false);
                    setShowQuestModal(true);
                  }}
                >
                  Create Your First Quest
                </Button>
              </Box>
            ) : (
              <Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={3}
                >
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowQuestsModal(false);
                      setShowQuestModal(true);
                    }}
                  >
                    Create New Quest
                  </Button>
                </Box>

                {/* Summary of custom quests in current class */}
                {(() => {
                  const questsInClass = myQuests.filter((quest) =>
                    unifiedQuestOrder.some((q) => q._id === quest._id)
                  );
                  if (questsInClass.length > 0) {
                    return (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          📚 Class Quest Summary
                        </Typography>
                        <Typography variant="body2">
                          {questsInClass.length} of {myQuests.length} custom
                          quests are already in this class's quest order.
                        </Typography>
                      </Alert>
                    );
                  }
                  return null;
                })()}

                <Grid container spacing={2}>
                  {myQuests.map((quest) => {
                    const isAlreadyInClass = unifiedQuestOrder.some(
                      (q) => q._id === quest._id
                    );
                    return (
                      <Grid item xs={12} key={quest._id}>
                        <Card>
                          <Box p={2}>
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="flex-start"
                            >
                              <Box>
                                <Typography
                                  variant="h6"
                                  color="primary"
                                  fontWeight={600}
                                >
                                  {quest.questTitle}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Created:{" "}
                                  {new Date(
                                    quest.createdAt
                                  ).toLocaleDateString()}
                                </Typography>
                                {isAlreadyInClass && (
                                  <Chip
                                    label="✓ Already in Class"
                                    color="success"
                                    size="small"
                                    sx={{ mt: 1 }}
                                  />
                                )}
                              </Box>
                              <Box textAlign="right">
                                <Chip
                                  label={`${
                                    quest.tasks ? quest.tasks.length : 0
                                  } Tasks`}
                                  color="success"
                                  size="small"
                                  sx={{ mb: 1 }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  ID: {quest._id.slice(-8)}...
                                </Typography>
                                <Stack direction="row" spacing={1} mt={1}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleEditQuest(quest)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => handleDeleteQuest(quest)}
                                  >
                                    Delete
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                    onClick={() => handleAddQuestToClass(quest)}
                                    disabled={isAlreadyInClass}
                                    title={
                                      isAlreadyInClass
                                        ? "Quest is already in this class"
                                        : "Add quest to this class"
                                    }
                                  >
                                    {isAlreadyInClass
                                      ? "✓ Added"
                                      : "Add to Class"}
                                  </Button>
                                </Stack>
                              </Box>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </Box>

          {/* Default Quests Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "secondary.main" }}>
              📚 Default Quest Library
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These are the standard quests that come with the system. They can
              be added to your class but cannot be edited.
            </Typography>

            <Grid container spacing={2}>
              {[
                {
                  id: "Q1",
                  title: "Q1: Understanding OSS Projects and GitHub Basics",
                  content:
                    "Learn the fundamentals of open source software and GitHub workflow",
                },
                {
                  id: "Q2",
                  title: "Q2: Forking and Contributing to Repositories",
                  content:
                    "Master the process of forking repositories and making contributions",
                },
                {
                  id: "Q3",
                  title: "Q3: Creating Pull Requests and Code Reviews",
                  content:
                    "Learn how to create pull requests and participate in code reviews",
                },
              ].map((defaultQuest) => {
                const isAlreadyInClass = unifiedQuestOrder.some(
                  (q) => q.id === defaultQuest.id
                );
                return (
                  <Grid item xs={12} key={defaultQuest.id}>
                    <Card sx={{ bgcolor: "grey.50" }}>
                      <Box p={2}>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box>
                            <Typography
                              variant="h6"
                              color="secondary.main"
                              fontWeight={600}
                            >
                              {defaultQuest.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {defaultQuest.content}
                            </Typography>
                            <Chip
                              label="Default Quest"
                              color="secondary"
                              size="small"
                              sx={{ mt: 1 }}
                            />
                            {isAlreadyInClass && (
                              <Chip
                                label="✓ Already in Class"
                                color="success"
                                size="small"
                                sx={{ mt: 1, ml: 1 }}
                              />
                            )}
                          </Box>
                          <Box textAlign="right">
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              System Quest
                            </Typography>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              onClick={() =>
                                addDefaultQuestToClass(defaultQuest.id)
                              }
                              disabled={isAlreadyInClass}
                              title={
                                isAlreadyInClass
                                  ? "Quest is already in this class"
                                  : "Add default quest to this class"
                              }
                              sx={{ mt: 1 }}
                            >
                              {isAlreadyInClass ? "✓ Added" : "Add to Class"}
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQuestsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ... Other modals and helpers as in ClassView.jsx, refactored to MUI ... */}
    </Container>
  );
};

export default ManageQuests;
