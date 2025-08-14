import fs from "fs";
import { completeTask } from "../gamification.js";
import { getQuestConfig, getGroupQuestConfig } from "../config/questConfigGenerator.js";
import { utils } from "../taskUtils.js";
import LLM from "../llm.js";

// NOTE: due to how these functions are accessed, keep parameters uniform, even if not used
const llmInstance = new LLM();

/**
 * Generic MCQ handler that can validate any MCQ task
 * @param {Object} user_data - User data object
 * @param {string} user - Username
 * @param {Object} context - GitHub context
 * @param {string} ossRepo - OSS repository
 * @param {Object} response - Response template
 * @param {Object} selectedIssue - Selected issue
 * @param {Object} db - Database object
 * @param {string} quest - Quest ID (e.g., "Q4")
 * @param {string} task - Task ID (e.g., "T1")
 * @returns {Array} [response, success]
 */
export async function handleMCQ(user_data, user, context, ossRepo, response, selectedIssue, db, quest, task) {
  try {
    // Get quest configuration based on user's custom group
    let questConfig;
    if (user_data.customGroupId) {
      questConfig = getGroupQuestConfig(user_data.customGroupId);
    } else {
      questConfig = getQuestConfig();
    }
    
    const taskConfig = questConfig[quest][task];
    
    // Extract MCQ-specific data - check both 'correctAnswer' and 'answer' fields
    const correctAnswer = taskConfig.correctAnswer || taskConfig.answer;
    const userAnswer = context.payload.comment.body.trim();
    
    console.log(`[handleMCQ] Quest: ${quest}, Task: ${task}`);
    console.log(`[handleMCQ] User answer: "${userAnswer}"`);
    console.log(`[handleMCQ] Correct answer: "${correctAnswer}"`);
    console.log(`[handleMCQ] Task config:`, taskConfig);
    
    // Validate answer - case insensitive comparison
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    
    console.log(`[handleMCQ] Is correct: ${isCorrect}`);
    
    if (isCorrect) {
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    } else {
      return [response.error, false];
    }
  } catch (error) {
    console.error(`Error in handleMCQ for ${quest}${task}:`, error);
    return [response.error, false];
  }
}

/**
 * Generic handler for custom tasks that need specific logic
 * @param {Object} user_data - User data object
 * @param {string} user - Username
 * @param {Object} context - GitHub context
 * @param {string} ossRepo - OSS repository
 * @param {Object} response - Response template
 * @param {Object} selectedIssue - Selected issue
 * @param {Object} db - Database object
 * @param {string} quest - Quest ID (e.g., "Q4")
 * @param {string} task - Task ID (e.g., "T1")
 * @returns {Array} [response, success]
 */
export async function handleCustom(user_data, user, context, ossRepo, response, selectedIssue, db, quest, task) {
  try {
    // For custom quests, you can add specific logic here
    // For now, this is a placeholder that can be extended
    console.log(`Custom handler called for ${quest}${task}`);
    
    // You could add quest-specific logic here
    // For example, if quest === "Q4", handle it specially
    
    return [response.error, false];
  } catch (error) {
    console.error(`Error in handleCustom for ${quest}${task}:`, error);
    return [response.error, false];
  }
} 

/**
 * Generic Issue Count handler that can validate issue count tasks
 * @param {Object} user_data - User data object
 * @param {string} user - Username
 * @param {Object} context - GitHub context
 * @param {string} ossRepo - OSS repository
 * @param {Object} response - Response template
 * @param {Object} selectedIssue - Selected issue
 * @param {Object} db - Database object
 * @param {string} quest - Quest ID (e.g., "Q4")
 * @param {string} task - Task ID (e.g., "T1")
 * @returns {Array} [response, success]
 */
export async function handleIssueCount(user_data, user, context, ossRepo, response, selectedIssue, db, quest, task) {
  try {
    console.log(`[handleIssueCount] Quest: ${quest}, Task: ${task}`);
    console.log(`[handleIssueCount] OSS Repo: ${ossRepo}`);
    
    // Get quest configuration based on user's custom group
    let questConfig;
    if (user_data.customGroupId) {
      questConfig = getGroupQuestConfig(user_data.customGroupId);
    } else {
      questConfig = getQuestConfig();
    }
    
    const taskConfig = questConfig[quest][task];
    console.log(`[handleIssueCount] Task config:`, taskConfig);
    
    // Get the repository to check (use task config if specified, otherwise use ossRepo)
    const targetRepo = taskConfig.ossRepository || ossRepo;
    console.log(`[handleIssueCount] Target repository: ${targetRepo}`);
    
    // Validate that a repository is specified
    if (!targetRepo || !targetRepo.trim()) {
      console.error(`[handleIssueCount] No repository specified for issue count task`);
      return [response.error, false];
    }
    
    // Get the issue count from the repository
    const issueCount = await utils.getIssueCount(targetRepo, context);
    console.log(`[handleIssueCount] Issue count: ${issueCount}`);
    
    if (issueCount === null) {
      console.error(`[handleIssueCount] Failed to get issue count for repository: ${targetRepo}`);
      return [response.error, false];
    }
    
    const userAnswer = context.payload.comment.body.trim();
    console.log(`[handleIssueCount] User answer: "${userAnswer}"`);
    console.log(`[handleIssueCount] Expected answer: "${issueCount}"`);
    
    // First try direct match (case-insensitive)
    if (userAnswer.toLowerCase() === issueCount.toString().toLowerCase()) {
      console.log(`[handleIssueCount] Direct match successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    }
    
    // If direct match fails, try LLM validation
    console.log(`[handleIssueCount] Direct match failed, trying LLM validation`);
    const llmResponse = await llmInstance.validateAnswer(userAnswer, issueCount.toString(), quest, task);
    console.log(`[handleIssueCount] LLM response: ${llmResponse}`);
    
    if (llmResponse === "true") {
      console.log(`[handleIssueCount] LLM validation successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    }
    
    // If both direct match and LLM validation fail
    console.log(`[handleIssueCount] Both direct match and LLM validation failed`);
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${targetRepo})`;
    return [response, false];
    
  } catch (error) {
    console.error(`Error in handleIssueCount for ${quest}${task}:`, error);
    return [response.error, false];
  }
} 

/**
 * Generic Pull Request Count handler that can validate PR count tasks
 * @param {Object} user_data - User data object
 * @param {string} user - Username
 * @param {Object} context - GitHub context
 * @param {string} ossRepo - OSS repository
 * @param {Object} response - Response template
 * @param {Object} selectedIssue - Selected issue
 * @param {Object} db - Database object
 * @param {string} quest - Quest ID (e.g., "Q4")
 * @param {string} task - Task ID (e.g., "T1")
 * @returns {Array} [response, success]
 */
export async function handlePRCount(user_data, user, context, ossRepo, response, selectedIssue, db, quest, task) {
  try {
    console.log(`[handlePRCount] Quest: ${quest}, Task: ${task}`);
    console.log(`[handlePRCount] OSS Repo: ${ossRepo}`);
    
    // Get quest configuration based on user's custom group
    let questConfig;
    if (user_data.customGroupId) {
      questConfig = getGroupQuestConfig(user_data.customGroupId);
    } else {
      questConfig = getQuestConfig();
    }
    
    const taskConfig = questConfig[quest][task];
    console.log(`[handlePRCount] Task config:`, taskConfig);
    
    // Get the repository to check (use task config if specified, otherwise use ossRepo)
    const targetRepo = taskConfig.ossRepository || ossRepo;
    console.log(`[handlePRCount] Target repository: ${targetRepo}`);
    
    // Validate that a repository is specified
    if (!targetRepo || !targetRepo.trim()) {
      console.error(`[handlePRCount] No repository specified for PR count task`);
      return [response.error, false];
    }
    
    // Get the pull request count from the repository
    const prCount = await utils.getPRCount(targetRepo, context);
    console.log(`[handlePRCount] PR count: ${prCount}`);
    
    if (prCount === null) {
      console.error(`[handlePRCount] Failed to get PR count for repository: ${targetRepo}`);
      return [response.error, false];
    }
    
    const userAnswer = context.payload.comment.body.trim();
    console.log(`[handlePRCount] User answer: "${userAnswer}"`);
    console.log(`[handlePRCount] Expected answer: "${prCount}"`);
    
    // First try direct match (case-insensitive)
    if (userAnswer.toLowerCase() === prCount.toString().toLowerCase()) {
      console.log(`[handlePRCount] Direct match successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    }
    
    // If direct match fails, try LLM validation
    console.log(`[handlePRCount] Direct match failed, trying LLM validation`);
    const llmResponse = await llmInstance.validateAnswer(userAnswer, prCount.toString(), quest, task);
    console.log(`[handlePRCount] LLM response: ${llmResponse}`);
    
    if (llmResponse === "true") {
      console.log(`[handlePRCount] LLM validation successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    }
    
    // If both direct match and LLM validation fail
    console.log(`[handlePRCount] Both direct match and LLM validation failed`);
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${targetRepo})`;
    return [response, false];
    
  } catch (error) {
    console.error(`Error in handlePRCount for ${quest}${task}:`, error);
    return [response.error, false];
  }
} 

/**
 * Generic Top Contributor handler that can validate top contributor tasks
 * @param {Object} user_data - User data object
 * @param {string} user - Username
 * @param {Object} context - GitHub context
 * @param {string} ossRepo - OSS repository
 * @param {Object} response - Response template
 * @param {Object} selectedIssue - Selected issue
 * @param {Object} db - Database object
 * @param {string} quest - Quest ID (e.g., "Q4")
 * @param {string} task - Task ID (e.g., "T1")
 * @returns {Array} [response, success]
 */
export async function handleTopContributor(user_data, user, context, ossRepo, response, selectedIssue, db, quest, task) {
  try {
    console.log(`[handleTopContributor] Quest: ${quest}, Task: ${task}`);
    console.log(`[handleTopContributor] OSS Repo: ${ossRepo}`);
    
    // Get quest configuration based on user's custom group
    let questConfig;
    if (user_data.customGroupId) {
      questConfig = getGroupQuestConfig(user_data.customGroupId);
    } else {
      questConfig = getQuestConfig();
    }
    
    const taskConfig = questConfig[quest][task];
    console.log(`[handleTopContributor] Task config:`, taskConfig);
    
    // Get the repository to check (use task config if specified, otherwise use ossRepo)
    const targetRepo = taskConfig.ossRepository || ossRepo;
    console.log(`[handleTopContributor] Target repository: ${targetRepo}`);
    
    // Validate that a repository is specified
    if (!targetRepo || !targetRepo.trim()) {
      console.error(`[handleTopContributor] No repository specified for top contributor task`);
      return [response.error, false];
    }
    
    // Get the top contributor from the repository
    const topContributor = await utils.getTopContributor(targetRepo, context);
    console.log(`[handleTopContributor] Top contributor: ${topContributor}`);
    
    if (topContributor === null) {
      console.error(`[handleTopContributor] Failed to get top contributor for repository: ${targetRepo}`);
      return [response.error, false];
    }
    
    const userAnswer = context.payload.comment.body.trim();
    console.log(`[handleTopContributor] User answer: "${userAnswer}"`);
    console.log(`[handleTopContributor] Expected answer: "${topContributor}"`);
    
    // First try direct match
    if (userAnswer.toLowerCase() === topContributor.toLowerCase()) {
      console.log(`[handleTopContributor] Direct match successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    }
    
    // If direct match fails, try LLM validation
    console.log(`[handleTopContributor] Direct match failed, trying LLM validation`);
    const llmResponse = await llmInstance.validateAnswer(userAnswer, topContributor, quest, task);
    console.log(`[handleTopContributor] LLM response: ${llmResponse}`);
    
    if (llmResponse === "true") {
      console.log(`[handleTopContributor] LLM validation successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    }
    
    // If both direct match and LLM validation fail
    console.log(`[handleTopContributor] Both direct match and LLM validation failed`);
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${targetRepo})`;
    return [response, false];
    
  } catch (error) {
    console.error(`Error in handleTopContributor for ${quest}${task}:`, error);
    return [response.error, false];
  }
} 

/**
 * Generic Issue Title handler that can validate issue title tasks
 * @param {Object} user_data - User data object
 * @param {string} user - Username
 * @param {Object} context - GitHub context
 * @param {string} ossRepo - OSS repository
 * @param {Object} response - Response template
 * @param {Object} selectedIssue - Selected issue
 * @param {Object} db - Database object
 * @param {string} quest - Quest ID (e.g., "Q4")
 * @param {string} task - Task ID (e.g., "T1")
 * @returns {Array} [response, success]
 */
export async function handleIssueTitle(user_data, user, context, ossRepo, response, selectedIssue, db, quest, task) {
  try {
    console.log(`[handleIssueTitle] Quest: ${quest}, Task: ${task}`);
    console.log(`[handleIssueTitle] OSS Repo: ${ossRepo}`);
    
    // Get quest configuration based on user's custom group
    let questConfig;
    if (user_data.customGroupId) {
      questConfig = getGroupQuestConfig(user_data.customGroupId);
    } else {
      questConfig = getQuestConfig();
    }
    
    const taskConfig = questConfig[quest][task];
    console.log(`[handleIssueTitle] Task config:`, taskConfig);
    
    // Get the repository to check (use task config if specified, otherwise use ossRepo)
    const targetRepo = taskConfig.ossRepository || ossRepo;
    console.log(`[handleIssueTitle] Target repository: ${targetRepo}`);
    
    // Get the issue number to check (use task config if specified, otherwise use selectedIssue)
    const issueNumber = taskConfig.issueNumber || selectedIssue;
    console.log(`[handleIssueTitle] Issue number: ${issueNumber}`);
    
    // Validate that a repository and issue number are specified
    if (!targetRepo || !targetRepo.trim()) {
      console.error(`[handleIssueTitle] No repository specified for issue title task`);
      return [response.error, false];
    }
    
    if (!issueNumber) {
      console.error(`[handleIssueTitle] No issue number specified for issue title task`);
      return [response.error, false];
    }
    
    // Get the issue title from the repository
    const issueTitle = await utils.getIssueTitle(targetRepo, issueNumber, context);
    console.log(`[handleIssueTitle] Issue title: ${issueTitle}`);
    
    if (issueTitle === null) {
      console.error(`[handleIssueTitle] Failed to get issue title for repository: ${targetRepo}, issue: ${issueNumber}`);
      return [response.error, false];
    }
    
    const userAnswer = context.payload.comment.body.trim();
    console.log(`[handleIssueTitle] User answer: "${userAnswer}"`);
    console.log(`[handleIssueTitle] Expected answer: "${issueTitle}"`);
    
    // First try direct match (case-insensitive)
    if (userAnswer.toLowerCase() === issueTitle.toLowerCase()) {
      console.log(`[handleIssueTitle] Direct match successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    }
    
    // If direct match fails, try LLM validation
    console.log(`[handleIssueTitle] Direct match failed, trying LLM validation`);
    const llmResponse = await llmInstance.validateAnswer(userAnswer, issueTitle, quest, task);
    console.log(`[handleIssueTitle] LLM response: ${llmResponse}`);
    
    if (llmResponse === "true") {
      console.log(`[handleIssueTitle] LLM validation successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    }
    
    // If both direct match and LLM validation fail
    console.log(`[handleIssueTitle] Both direct match and LLM validation failed`);
    response = response.error;
    response += `\n\n[Click here to view the issue](https://github.com/${targetRepo}/issues/${issueNumber})`;
    return [response, false];
    
  } catch (error) {
    console.error(`Error in handleIssueTitle for ${quest}${task}:`, error);
    return [response.error, false];
  }
} 

/**
 * Generic Open Issues handler that can validate open issues count tasks
 * @param {Object} user_data - User data object
 * @param {string} user - Username
 * @param {Object} context - GitHub context
 * @param {string} ossRepo - OSS repository
 * @param {Object} response - Response template
 * @param {Object} selectedIssue - Selected issue
 * @param {Object} db - Database object
 * @param {string} quest - Quest ID (e.g., "Q4")
 * @param {string} task - Task ID (e.g., "T1")
 * @returns {Array} [response, success]
 */
export async function handleOpenIssues(user_data, user, context, ossRepo, response, selectedIssue, db, quest, task) {
  try {
    console.log(`[handleOpenIssues] Quest: ${quest}, Task: ${task}`);
    console.log(`[handleOpenIssues] OSS Repo: ${ossRepo}`);
    
    // Get quest configuration based on user's custom group
    let questConfig;
    if (user_data.customGroupId) {
      questConfig = getGroupQuestConfig(user_data.customGroupId);
    } else {
      questConfig = getQuestConfig();
    }
    
    const taskConfig = questConfig[quest][task];
    console.log(`[handleOpenIssues] Task config:`, taskConfig);
    
    // Get the repository to check (use task config if specified, otherwise use ossRepo)
    const targetRepo = taskConfig.ossRepository || ossRepo;
    console.log(`[handleOpenIssues] Target repository: ${targetRepo}`);
    
    // Validate that a repository is specified
    if (!targetRepo || !targetRepo.trim()) {
      console.error(`[handleOpenIssues] No repository specified for open issues task`);
      return [response.error, false];
    }
    
    // Get the open issues count from the repository
    const openIssuesCount = await utils.getOpenIssuesCount(targetRepo, context);
    console.log(`[handleOpenIssues] Open issues count: ${openIssuesCount}`);
    
    if (openIssuesCount === null) {
      console.error(`[handleOpenIssues] Failed to get open issues count for repository: ${targetRepo}`);
      return [response.error, false];
    }
    
    const userAnswer = context.payload.comment.body.trim();
    console.log(`[handleOpenIssues] User answer: "${userAnswer}"`);
    console.log(`[handleOpenIssues] Expected answer: "${openIssuesCount}"`);
    
    // First try direct match (case-insensitive)
    if (userAnswer.toLowerCase() === openIssuesCount.toString().toLowerCase()) {
      console.log(`[handleOpenIssues] Direct match successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    }
    
    // If direct match fails, try LLM validation
    console.log(`[handleOpenIssues] Direct match failed, trying LLM validation`);
    const llmResponse = await llmInstance.validateAnswer(userAnswer, openIssuesCount.toString(), quest, task);
    console.log(`[handleOpenIssues] LLM response: ${llmResponse}`);
    
    if (llmResponse === "true") {
      console.log(`[handleOpenIssues] LLM validation successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    }
    
    // If both direct match and LLM validation fail
    console.log(`[handleOpenIssues] Both direct match and LLM validation failed`);
    response = response.error;
    response += `\n\n[Click here to start](https://github.com/${targetRepo})`;
    return [response, false];
    
  } catch (error) {
    console.error(`Error in handleOpenIssues for ${quest}${task}:`, error);
    return [response.error, false];
  }
} 

/**
 * Generic True/False handler that logs user info and validates true/false answers
 * @param {Object} user_data - User data object
 * @param {string} user - Username
 * @param {Object} context - GitHub context
 * @param {string} ossRepo - OSS repository
 * @param {Object} response - Response template
 * @param {Object} selectedIssue - Selected issue
 * @param {Object} db - Database object
 * @param {string} quest - Quest ID (e.g., "Q4")
 * @param {string} task - Task ID (e.g., "T1")
 * @returns {Array} [response, success]
 */
export async function handleTrueFalse(user_data, user, context, ossRepo, response, selectedIssue, db, quest, task) {
  try {
    console.log(`[handleTrueFalse] Quest: ${quest}, Task: ${task}`);
    
    // Log user's current name and score
    const userInfo = {
      name: user_data.github || user_data.username || user,
      score: user_data.points || 0,
      xp: user_data.xp || 0,
      completion: user_data.completion || 0,
      currentStreak: user_data.currentStreak || 0,
      streakCount: user_data.streakCount || 0
    };
    
    console.log(`[handleTrueFalse] User Info:`, JSON.stringify(userInfo, null, 2));
    
    // Get quest configuration based on user's custom group
    let questConfig;
    if (user_data.customGroupId) {
      questConfig = getGroupQuestConfig(user_data.customGroupId);
    } else {
      questConfig = getQuestConfig();
    }
    
    const taskConfig = questConfig[quest][task];
    
    // Extract true/false answer - check both 'correctAnswer' and 'answer' fields
    const correctAnswer = taskConfig.correctAnswer || taskConfig.answer;
    const userAnswer = context.payload.comment.body.trim();
    
    console.log(`[handleTrueFalse] User answer: "${userAnswer}"`);
    console.log(`[handleTrueFalse] Correct answer: "${correctAnswer}"`);
    console.log(`[handleTrueFalse] Task config:`, taskConfig);
    
    // Validate answer - case insensitive comparison for true/false
    const normalizedUserAnswer = userAnswer.toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.toLowerCase();
    
    // Accept various true/false formats
    const isTrue = normalizedUserAnswer === 'true' || normalizedUserAnswer === 't' || normalizedUserAnswer === 'yes' || normalizedUserAnswer === 'y';
    const isFalse = normalizedUserAnswer === 'false' || normalizedUserAnswer === 'f' || normalizedUserAnswer === 'no' || normalizedUserAnswer === 'n';
    
    let userAnswerBoolean;
    if (isTrue) {
      userAnswerBoolean = 'true';
    } else if (isFalse) {
      userAnswerBoolean = 'false';
    } else {
      console.log(`[handleTrueFalse] Invalid answer format: "${userAnswer}"`);
      return [response.error, false];
    }
    
    const isCorrect = userAnswerBoolean === normalizedCorrectAnswer;
    
    console.log(`[handleTrueFalse] Normalized user answer: "${userAnswerBoolean}"`);
    console.log(`[handleTrueFalse] Is correct: ${isCorrect}`);
    
    if (isCorrect) {
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    } else {
      return [response.error, false];
    }
  } catch (error) {
    console.error(`Error in handleTrueFalse for ${quest}${task}:`, error);
    return [response.error, false];
  }
} 

export async function handleQuest(user_data, user, context, ossRepo, response, selectedIssue, db, quest, task) {
  try {
    // Get quest config (supporting custom groups)
    let questConfig = user_data.customGroupId
      ? getGroupQuestConfig(user_data.customGroupId)
      : getQuestConfig();

    const taskConfig = questConfig[quest][task];
    // Expect: taskConfig.questions = [{question, options, correctAnswer, explanation}, ...]
    const questions = taskConfig.questions || [];
    const correctAnswers = questions.map(q => q.correctAnswer);

    // Parse user answer (e.g., [b,a,c])
    let userAnswerString = context.payload.comment.body.trim();
    userAnswerString = userAnswerString.replace(/[\[\]\s]/g, '').split(',');

    let correctCount = 0;
    let feedback = [];
    for (let i = 0; i < questions.length; i++) {
      const userAns = (userAnswerString[i] || '').toLowerCase();
      const correctAns = (correctAnswers[i] || '').toLowerCase();
      if (userAns === correctAns) {
        correctCount++;
        feedback.push(`Q${i + 1}: ✅ Correct!`);
      } else {
        feedback.push(`Q${i + 1}: ❌ Incorrect. Correct answer: ${correctAns.toUpperCase()}${questions[i].explanation ? ' - ' + questions[i].explanation : ''}`);
      }
    }

    await completeTask(user_data, quest, task, context, db);

    response = response.success +
      `\n ## You correctly answered ${correctCount} out of ${questions.length} questions!` +
      `\n\n ### Feedback:\n${feedback.join('\n')}`;

    return [response, true];
  } catch (error) {
    console.error(`Error in handleQuest for ${quest}${task}:`, error);
    return [response.error, false];
  }
} 

/**
 * Generic Assignment Validation handler that validates if a user is assigned to a specific issue
 * @param {Object} user_data - User data object
 * @param {string} user - Username
 * @param {Object} context - GitHub context
 * @param {string} ossRepo - OSS repository
 * @param {Object} response - Response template
 * @param {Object} selectedIssue - Selected issue
 * @param {Object} db - Database object
 * @param {string} quest - Quest ID (e.g., "Q4")
 * @param {string} task - Task ID (e.g., "T1")
 * @returns {Array} [response, success]
 */
export async function handleAssigned(user_data, user, context, ossRepo, response, selectedIssue, db, quest, task) {
  try {
    console.log(`[handleAssigned] Quest: ${quest}, Task: ${task}`);
    console.log(`[handleAssigned] OSS Repo: ${ossRepo}`);
    
    // Get quest configuration based on user's custom group
    let questConfig;
    if (user_data.customGroupId) {
      questConfig = getGroupQuestConfig(user_data.customGroupId);
    } else {
      questConfig = getQuestConfig();
    }
    
    const taskConfig = questConfig[quest][task];
    console.log(`[handleAssigned] Task config:`, taskConfig);
    
    // Get the repository to check (use task config if specified, otherwise use ossRepo)
    const targetRepo = taskConfig.ossRepository || ossRepo;
    console.log(`[handleAssigned] Target repository: ${targetRepo}`);
    
    // Get the issue number to check (use task config if specified, otherwise use selectedIssue)
    const issueNumber = taskConfig.issueNumber || selectedIssue;
    console.log(`[handleAssigned] Issue number: ${issueNumber}`);
    
    // Validate that a repository and issue number are specified
    if (!targetRepo || !targetRepo.trim()) {
      console.error(`[handleAssigned] No repository specified for assignment validation task`);
      return [response.error, false];
    }
    
    if (!issueNumber) {
      console.error(`[handleAssigned] No issue number specified for assignment validation task`);
      return [response.error, false];
    }
    
    // Get the username from the user's comment
    const userInput = context.payload.comment.body.trim();
    console.log(`[handleAssigned] User input: "${userInput}"`);
    
    // Check if the user input is empty
    if (!userInput || userInput === '') {
      console.log(`[handleAssigned] No username provided in comment`);
      return [response.error + '\n\n**Please provide a GitHub username in your comment.**', false];
    }
    
    // Check if the provided username is assigned to the specified issue
    const isAssigned = await utils.checkAssignee(targetRepo, issueNumber, userInput, context);
    console.log(`[handleAssigned] User ${user} provided username: ${userInput}`);
    console.log(`[handleAssigned] Username ${userInput} assigned to issue #${issueNumber} in ${targetRepo}: ${isAssigned}`);
    
    // Print the correct answer for debugging
    console.log(`[handleAssigned] CORRECT ANSWER: A user should be assigned to issue #${issueNumber} in ${targetRepo}`);
    console.log(`[handleAssigned] USER ANSWER: ${userInput} is ${isAssigned ? 'ASSIGNED' : 'NOT ASSIGNED'} to issue #${issueNumber}`);
    
    if (isAssigned) {
      console.log(`[handleAssigned] Assignment validation successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    } else {
      console.log(`[handleAssigned] Assignment validation failed - user not assigned to issue`);
      response = response.error;
      response += `\n\n[Click here to view the issue](https://github.com/${targetRepo}/issues/${issueNumber})`;
      return [response, false];
    }
    
  } catch (error) {
    console.error(`Error in handleAssigned for ${quest}${task}:`, error);
    return [response.error, false];
  }
} 

/**
 * Generic Issue Number Validation handler that validates if a user provides an issue number that exists
 * @param {Object} user_data - User data object
 * @param {string} user - Username
 * @param {Object} context - GitHub context
 * @param {string} ossRepo - OSS repository
 * @param {Object} response - Response template
 * @param {Object} selectedIssue - Selected issue
 * @param {Object} db - Database object
 * @param {string} quest - Quest ID (e.g., "Q4")
 * @param {string} task - Task ID (e.g., "T1")
 * @returns {Array} [response, success]
 */
export async function handleIssueNo(user_data, user, context, ossRepo, response, selectedIssue, db, quest, task) {
  try {
    console.log(`[handleIssueNo] Quest: ${quest}, Task: ${task}`);
    console.log(`[handleIssueNo] OSS Repo: ${ossRepo}`);
    
    // Get quest configuration based on user's custom group
    let questConfig;
    if (user_data.customGroupId) {
      questConfig = getGroupQuestConfig(user_data.customGroupId);
    } else {
      questConfig = getQuestConfig();
    }
    
    const taskConfig = questConfig[quest][task];
    console.log(`[handleIssueNo] Task config:`, taskConfig);
    
    // Get the repository to check (use task config if specified, otherwise use ossRepo)
    const targetRepo = taskConfig.ossRepository || ossRepo;
    console.log(`[handleIssueNo] Target repository: ${targetRepo}`);
    
    // Get the issue number from the user's comment
    const userInput = context.payload.comment.body.trim();
    console.log(`[handleIssueNo] User input: "${userInput}"`);
    
    // Check if the user input is empty
    if (!userInput || userInput === '') {
      console.log(`[handleIssueNo] No issue number provided in comment`);
      return [response.error + '\n\n**Please provide an issue number in your comment.**', false];
    }
    
    // Parse the issue number (remove any non-numeric characters)
    const issueNumber = parseInt(userInput.replace(/\D/g, ''));
    if (isNaN(issueNumber) || issueNumber <= 0) {
      console.log(`[handleIssueNo] Invalid issue number: ${userInput}`);
      return [response.error + '\n\n**Please provide a valid issue number (e.g., 10, 25, 100).**', false];
    }
    
    console.log(`[handleIssueNo] Parsed issue number: ${issueNumber}`);
    
    // Check if the issue exists in the repository
    const issueExists = await utils.checkIssueExists(targetRepo, issueNumber, context);
    console.log(`[handleIssueNo] Issue #${issueNumber} exists in ${targetRepo}: ${issueExists}`);
    
    // Print the correct answer for debugging
    console.log(`[handleIssueNo] CORRECT ANSWER: Issue #${issueNumber} should exist in ${targetRepo}`);
    console.log(`[handleIssueNo] USER ANSWER: Issue #${issueNumber} ${issueExists ? 'EXISTS' : 'DOES NOT EXIST'} in ${targetRepo}`);
    
    if (issueExists) {
      console.log(`[handleIssueNo] Issue validation successful`);
      await completeTask(user_data, quest, task, context, db);
      return [response.success, true];
    } else {
      console.log(`[handleIssueNo] Issue validation failed - issue does not exist`);
      response = response.error;
      response += `\n\n[Click here to view all issues](https://github.com/${targetRepo}/issues)`;
      return [response, false];
    }
    
  } catch (error) {
    console.error(`Error in handleIssueNo for ${quest}${task}:`, error);
    return [response.error, false];
  }
} 