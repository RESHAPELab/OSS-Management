const { MongoClient, ObjectId } = require('mongodb');

const classId = '691b7f64528ddbaa6810aa3f';
// Use OSS-Management database URI
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/management?retryWrites=true&w=majority&appName=gamification';
// Extract database name from URI or use default
// URI format: mongodb+srv://.../management?...
const dbName = process.env.MONGODB_DB_NAME || 'management';

const questConfig = {
  "map_repo_link": "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map",
  "questSequence": [
    {
      "questId": "Q1",
      "title": "Understanding OSS Projects and GitHub Basics",
      "isQ0": false,
      "questType": "fixed",
      "sequenceNumber": 0,
      "metadata": {
        "title": "Q1: Understanding OSS Projects and GitHub Basics",
        "description": "Learn the fundamentals of open source software and GitHub workflow",
        "prerequisite": null,
        "type": "general"
      },
      "badgeDescription": "Explorer 🚀",
      "tasks": {
        "T1": {
          "desc": "Explore the issue tracker",
          "points": 20,
          "xp": 20,
          "type": "get-issue-count",
          "ossRepository": "probot-test-org/test-repo",
          "accept": "### 🎯 Task 1: Find the Issue Tracker\n\n**Objective:** The issue tracker is the hub for project discussions, bug reports, and feature requests. Your goal is to find the issue tracker within our GitHub repository.\n\n**Task:** Visit the GitHub repository in the link below and **COUNT** the number of open issues and provide that number in the comment box to complete the task.\n\n🔗 [GitHub Repository: probot-test-org/test-repo](https://github.com/probot-test-org/test-repo)\n\n**Outcome:** This task will help you become familiar with how issues are reported, discussed, and tracked. Understanding the volume of discussions is crucial for grasping the project's activity level and areas that might need your contribution.\n\n**Help:** If you need help with this task, type \"help\" in the comment box to get hints, but it will cost you 5 points from your total score.",
          "success": "### 🌟 Congratulations! You Nailed It!\n\nYou've successfully identified the correct number of issues in our project, displaying keen attention to detail and dedication. As a reward for your sharp observation skills, you've earned **${experiencePoints} experience points!**\n\n> 🌟 🌟 🌟\n\n🏆 **Current Progress:** You now have **${currentPoints} points**, edging closer to the next level. Remember, you need a total of **100 points to level up**, meaning you're just **${pointsRemaining} points away** from achieving that milestone.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate, to successfully complete the entire quest, you need to reach an 100% completion rate. Every task you accomplish brings you closer to mastering the GitHub realm and unlocking new levels of collaboration and contribution.\n\n> 🌟 🌟 🌟\n\nKeep up the great work! Your journey through the quest is shaping up to be an exciting one. Each task completed is a step forward in your adventure. \n\nReady for the next challenge? More experiences and rewards await!\n\nA new task has appeared in the issues tab.\n\nYour adventure awaits! 🌟\n\n",
          "error": "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the number you've provided doesn't match the current count of **OPEN** issues in our project. \n\nNo worries, though! Mistakes are just stepping stones on the path to learning.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nEach issue represents a story, a problem to solve, or a feature to improve. Finding the correct number is just the start of understanding the broader narrative of our project.\n\nReady for another try? Your correct answer awaits just a click away!",
          "answer": "",
          "hints": []
        },
        "T2": {
          "desc": "Explore the pull-request menu",
          "points": 20,
          "xp": 20,
          "type": "get-pr-count",
          "ossRepository": "probot-test-org/test-repo",
          "accept": "### 🎯 Task 2: Find the Pull Request Menu\n\n**Objective:** Pull requests are the heart of collaboration in a GitHub repository, allowing you to suggest changes and contribute directly. Your mission is to find the pull request menu within our GitHub repository and gauge the level of ongoing collaborations.\n\n🔗 [GitHub Repository: probot-test-org/test-repo](https://github.com/probot-test-org/test-repo) \n\n **Task:** Go to the GitHub repository using the link below, find the number of **open** pull requests, and enter it in the comment box below.\n\n**Outcome:** Completing this task will deepen your understanding of how contributions are proposed, discussed, and integrated into the project. Recognizing the volume of open pull requests helps you see the project's dynamic nature and where you might contribute in the future.\n\n**Help:** If you need help with this task, type \"help\" in the comment box to get hints, but it will cost you 5 points from your total score.",
          "success": "### 🌟 Congratulations! You Nailed It!\n\nYou've successfully identified the correct number of pull requests in our project, displaying keen attention to detail and dedication. As a reward for your sharp observation skills, you've earned **${experiencePoints} experience points!**\n\n> 🌟 🌟 🌟\n\n🏆 **Current Progress:** You now have **${currentPoints} points**, edging closer to the next level. Remember, you need a total of **100 points to level up**, meaning you're just **${pointsRemaining} points away** from achieving that milestone.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate, to successfully complete the entire quest, you need to reach an 100% completion rate. Every task you accomplish brings you closer to mastering the GitHub realm and unlocking new levels of collaboration and contribution.\n\n> 🌟 🌟 🌟\n\nKeep up the great work! Your journey through the quest is shaping up to be an exciting one. Each task completed is a step forward in your adventure. \n\nReady for the next challenge? More experiences and rewards await!\n\nYou will see a new task in your issues tab!\n\nYour adventure awaits! 🌟\n\n",
          "error": "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the number you've provided doesn't match the current count of **OPEN** pull requests in our project.\n\nNo worries, though! Mistakes are part of the learning journey, and every misstep is an opportunity for growth.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nConsider this a bit of detective work 🕵️‍♂️.\n\nEvery open pull request is a potential contribution, waiting to enhance the project or fix an underlying issue. Identifying the correct number not only demonstrates your attentiveness but also helps you get acquainted with the contributions landscape of our project.\n\nReady to try again? The accurate count—and a chance to sharpen your project navigation skills—is just a click away!",
          "answer": "",
          "hints": []
        },
        "T3": {
          "desc": "Explore the fork button",
          "points": 20,
          "xp": 20,
          "type": "multiple-choice",
          "accept": "**Question:** ### 🎯 Task 3: Locate the Fork Button \n\n**Objective:** Forking is a cornerstone of GitHub collaboration. It enables you to create a personal copy of a repository so you can experiment with changes without affecting the original project.\n\n**Task:** Go to the GitHub repository using the link below, locate the **Fork** button, and note where it's positioned.\n\n**Choose the option that best describes where the \"Fork\" button is located.**\n\nA) Bottom-left corner of the page\nB) Directly under the repository description\nC) Next to the \"Watch\" and \"Star\" buttons\nD) In the repository's \"Settings\" tab\n\n**Instructions:** Select the correct answer.",
          "success": "### 🌟 Congratulations! You've Got It Right!\n\nYou've correctly identified the fork button's location within a GitHub repository as the top-right corner of the page, showcasing your growing familiarity with GitHub's interface and tools for collaboration.\n\nAs a reward for your keen observation and learning skills, you've earned ${experiencePoints} experience points!\n\n>🌟 🌟 🌟\n\n🏆 **Current Progress:** You now have **${currentPoints} points**, edging closer to the next level. Remember, you need a total of **100 points to level up**, meaning you're just **${pointsRemaining} points away** from achieving that milestone.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate, to successfully complete the entire quest, you need to reach an 100% completion rate. Every task you accomplish brings you closer to mastering the GitHub realm and unlocking new levels of collaboration and contribution.\n\n> 🌟 🌟 🌟\n\nFantastic work! The path you're on is filled with learning and achievement. Each task you complete propels you further in your journey through the world of open-source collaboration.\n\nAre you ready to tackle the next challenge? More adventures and rewards await!\n\nTo dive into your next task, look in the issues tab!\n\nThe adventure continues! 🌟\n\n",
          "error": "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the location you've selected for the fork button doesn't align with its typical placement in a GitHub repository.\n\nNo worries, though! Mistakes are simply steps on the path to mastery, and every attempt brings you closer to understanding.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nThis is a bit like a treasure hunt 🗺️.\n\nFinding the fork button is a fundamental skill for navigating GitHub and making your mark on projects. Correctly identifying its location ensures you're ready to start experimenting and contributing on your own terms.\n\nReady for another try? Your correct answer is just a decision away!\n\n**Please select the correct answer from the options below:**\n\nA) Bottom-left corner of the page\nB) Directly under the repository description\nC) Top-right corner of the page\nD) In the repository's \"Settings\" tab\n\n**Type** the letter in the comment box to complete this task.",
          "answer": "C",
          "question": "### 🎯 Task 3: Locate the Fork Button \n\n**Objective:** Forking is a cornerstone of GitHub collaboration. It enables you to create a personal copy of a repository so you can experiment with changes without affecting the original project.\n\n**Task:** Go to the GitHub repository using the link below, locate the **Fork** button, and note where it's positioned.\n\n**Choose the option that best describes where the \"Fork\" button is located.**\n\n",
          "options": [
            {
              "label": "A",
              "value": "Bottom-left corner of the page"
            },
            {
              "label": "B",
              "value": "Directly under the repository description"
            },
            {
              "label": "C",
              "value": "Next to the \"Watch\" and \"Star\" buttons"
            },
            {
              "label": "D",
              "value": "In the repository's \"Settings\" tab"
            }
          ],
          "hints": []
        },
        "T4": {
          "desc": "Explore the readme file",
          "points": 20,
          "xp": 20,
          "type": "multiple-choice",
          "accept": "**Question:** ### 🎯 Task 4: Locate the README File\n\n**Objective:** The README file serves as the welcoming guide and introduction to a project, providing essential information, instructions, and insights.\n\n**Task:** Go to the GitHub repository using the link below, find the **README** section, and identify which of the following sections is listed there.\n\n**Which of the following sections is within the README file:**\n\nA) Functionality\nB) Design\nC) Architecture\nD) Contributing\n\n**Instructions:** Select the correct answer.",
          "success": "### 🌟 Congratulations! You've Got It Right!\n\nYou've successfully identified a key piece of information or instruction from the README file, demonstrating your thorough attention to detail and commitment to understanding the project.\n\nAs a reward for your keen observation and learning skills, you've earned ${experiencePoints} experience points!\n\n>🌟 🌟 🌟\n\n🏆 **Current Progress:** You now have **${currentPoints} points**, edging closer to the next level. Remember, you're just **${pointsRemaining} points away** from leveling up!.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate, to successfully complete the entire quest, you need to reach an 100% completion rate. Every task you accomplish brings you closer to mastering the GitHub realm and unlocking new levels of collaboration and contribution.\n\n> 🌟 🌟 🌟\n\nFantastic work! The path you're on is filled with learning and achievement. Each task you complete propels you further in your journey through the world of open-source collaboration.\n\nAre you ready to tackle the next challenge? More adventures and rewards are on the horizon! \n\nThere will be a new task in your issues tab.\n\nThe adventure continues! 🌟\n\n",
          "error": "### 🚨 Oops, That's Not Quite Right!\n\nIt seems the information you've shared from the README file doesn't quite match what we were looking for, or perhaps it was misunderstood.\n\nDon't fret, though! Each step, including the missteps, is part of the journey towards greater knowledge and proficiency.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nConsider this a chance to dive deeper 🤿.\n\nThe README file is packed with insights about the project, often hiding gems of information crucial for new contributors. By revisiting and reflecting on its content, you're not just completing a task but also building a foundation for meaningful contributions.\n\nReady to give it another go? The README file awaits with the details you need to move forward!\n\n**Please select the correct answer from the options below based on the sessions described in the README file:**\n\nA) Functionality\nB) Design\nC) Architecture\nD) Contributing\n\n**Type** the letter in the comment box to complete this task.",
          "answer": "D",
          "question": "### 🎯 Task 4: Locate the README File\n\n**Objective:** The README file serves as the welcoming guide and introduction to a project, providing essential information, instructions, and insights.\n\n**Task:** Go to the GitHub repository using the link below, find the **README** section, and identify which of the following sections is listed there.\n\n**Which of the following sections is within the README file:**\n\nA) Functionality\nB) Design\nC) Architecture\nD) Contributing\n\n**Instructions:** Select the correct answer.",
          "options": [
            {
              "label": "A",
              "value": "Functionality"
            },
            {
              "label": "B",
              "value": "Design"
            },
            {
              "label": "C",
              "value": "Architecture"
            },
            {
              "label": "D",
              "value": "Contributing"
            }
          ],
          "hints": []
        },
        "T5": {
          "desc": "Explore the contributors",
          "points": 20,
          "xp": 20,
          "type": "get-top-contributor",
          "ossRepository": "probot-test-org/test-repo",
          "accept": "### 🎯 Task 5: Discover the Contributors \n\n**Objective:** Understanding who has contributed to a project can provide insights into the project's community and potentially whom to reach out to for collaboration or questions.\n\n**Task:** Go to the GitHub repository using the link below, locate the **number 1** contributor, and **TYPE** their username in the comment box. Do NOT include any symbols.\n\n🔗 [GitHub Repository: probot-test-org/test-repo](https://github.com/probot-test-org/test-repo) \n\n**Outcome:** This task will help you become familiar with the collaborative nature of open-source projects on GitHub. Identifying contributors helps you understand the project's community size and diversity, offering a window into the people behind the project.\n\n**Help:** If you need help with this task, type \"help\" in the comment box to get hints, but it will cost you 5 points from your total score.",
          "success": "### 🌟 Congratulations! You've Reached a New Level!\n\nWith your latest achievement, you've accurately identified the number of contributors to our project, demonstrating not just your ability to navigate GitHub but also your appreciation for community collaboration.\n\nAs a reward for your sharp observation skills, you've earned **${experiencePoints} experience points!**\n\n> 🌟 🌟 🌟\n\n🏆 **Current Progress:** You've now accomplished a total of **${currentPoints} points**, achieving a remarkable milestone in your journey. This success is a testament to your dedication, learning, and contributions thus far.\n\n🎯 **Quest Completion:** You've successfully completed the tasks for this quest, leaving only the remaining quiz. This accomplishment signifies your mastery over the tasks at hand and your readiness to embark on new challenges and quests within the GitHub realm and beyond.\n\n> 🌟 🌟 🌟\n\nIncredible work! Your journey through this quest has been a tale of persistence, learning, and growth. Each task you've completed has not only contributed to your knowledge but has also paved the way for future adventures in open-source collaboration.\n\n**🚀 Ready for New Horizons:** With this quest behind you, new quests await, brimming with opportunities for exploration, learning, and making an impact.\n\nTo begin your next adventure, keep an eye out for the command or instructions that will introduce your next task. Your dedication and skills are invaluable assets on this journey of continuous learning and contribution.\n\nOnward to new quests and achievements! 🌟\n\n",
          "error": "### 🚨 Oops, That's Not Quite Right!\n\nIt seems the number of contributors you've mentioned doesn't align with the current roster of contributors to our project.\n\nBut remember, every error is a stepping stone towards greater understanding and skill.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nThink of this as honing your analytical skills 🔍.\n\nEach contributor represents a unique contribution to the project, from code commits to documentation. Recognizing the breadth and depth of the community's engagement is crucial for appreciating the collective effort involved in open-source projects.\n\nAre you ready for another attempt? The correct number, and a chance to deepen your understanding of our project's community, is just a few clicks away!",
          "answer": "",
          "hints": []
        },
        "T6": {
          "desc": "Quiz",
          "points": 20,
          "xp": 20,
          "type": "quiz",
          "questions": [
            {
              "question": "What is the primary purpose of the issue tracker in a GitHub repository?",
              "optionA": "To list all contributors to the project",
              "optionB": "To track bug reports, feature requests, and project discussions",
              "optionC": "To store documentation and project guidelines",
              "optionD": "To manage pull requests and merges",
              "correctAnswer": "b",
              "explanation": ""
            },
            {
              "question": "Which statement best describes a pull request on GitHub?",
              "optionA": "A way to propose changes to a repository, allowing for code review and discussion before integration",
              "optionB": "A method of archiving issues and marking them as resolved",
              "optionC": "A feature used for backing up repository data to a different server",
              "optionD": "A section where repository settings and configurations are modified",
              "correctAnswer": "a",
              "explanation": ""
            },
            {
              "question": "Why would you fork a repository on GitHub?",
              "optionA": "To permanently delete it from your account",
              "optionB": "To merge two different repositories into one",
              "optionC": "To create a personal copy where you can experiment and make changes without affecting the original",
              "optionD": "To mark it as one of your favorite projects",
              "correctAnswer": "c",
              "explanation": ""
            },
            {
              "question": "What information is typically found in a README file of a GitHub project?",
              "optionA": "The project's history and commit logs",
              "optionB": "A guide on how to contribute, along with an overview of the project",
              "optionC": "Personal information about the contributors",
              "optionD": "All the issues that have ever been reported",
              "correctAnswer": "b",
              "explanation": ""
            },
            {
              "question": "How can understanding who has contributed the most to a project be useful?",
              "optionA": "It ensures that you get paid for your contributions",
              "optionB": "It prevents other people from making changes to your code",
              "optionC": "It lets you change the project's license to your preference",
              "optionD": "It helps identify the project's most active users and potential people to reach out to for guidance",
              "correctAnswer": "d",
              "explanation": ""
            }
          ],
          "accept": "### 🧠 Quest 1 Quiz \n Answer the following questions to test your knowledge of the GitHub contribution process.\n Note that you may navigate to issues and view your \"closed issues\" to view old tasks that may help you answer these questions! \n\nThere is only one attempt allowed!",
          "success": "Good Job!",
          "error": "### Oops, That's Not Quite Right! Check if you have an answer for each question and if you are following the answer pattern: [X, X, X]",
          "answer": "",
          "hints": []
        }
      }
    }
  ]
};

async function createQuestConfig() {
  const client = new MongoClient(mongoUri);
  
  try {
    console.log(`💾 Saving quest configuration for class: ${classId}`);
    console.log(`📊 Quest count: ${questConfig.questSequence.length}`);
    console.log(`🔗 Connecting to MongoDB: ${dbName}`);

    await client.connect();
    console.log(`✅ Connected to MongoDB`);

    const db = client.db(dbName);
    const groupsCollection = db.collection('groups');

    console.log(`🔍 Searching for class with ID: ${classId}`);
    console.log(`📊 Database: ${dbName}, Collection: groups`);

    // Find the group - try as ObjectId first (MongoDB format)
    let group = null;
    try {
      group = await groupsCollection.findOne({ _id: new ObjectId(classId) });
    } catch (e) {
      console.log(`⚠️ ObjectId conversion failed, trying as string...`);
    }
    
    if (!group) {
      // Try as string if ObjectId doesn't work
      group = await groupsCollection.findOne({ _id: classId });
    }
    
    // Also try searching by classCode or groupName if ID doesn't work
    if (!group) {
      console.log(`🔍 Trying alternative search methods...`);
      const allGroups = await groupsCollection.find({}).limit(5).toArray();
      console.log(`📋 Found ${allGroups.length} groups in database (showing first 5):`);
      allGroups.forEach((g, i) => {
        console.log(`  ${i + 1}. _id: ${g._id}, groupName: ${g.groupName}, classCode: ${g.classCode || 'N/A'}`);
      });
    }
    
    if (!group) {
      console.error(`❌ Class with ID ${classId} not found`);
      console.error(`💡 Tip: Check the class ID in the URL or try searching by classCode`);
      process.exit(1);
    }

    console.log(`📚 Found class: ${group.groupName}`);
    
    // Update quest JSON configuration
    const result = await groupsCollection.updateOne(
      { _id: group._id },
      {
        $set: {
          questJsonConfig: questConfig,
          questJsonLastUpdated: new Date()
        }
      }
    );
    
    console.log(`✅ Successfully saved quest configuration!`);
    console.log(`📚 Class: ${group.groupName}`);
    console.log(`📊 Quest count: ${questConfig.questSequence.length}`);
    console.log(`📝 Modified count: ${result.modifiedCount}`);

    await client.close();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.close();
    process.exit(1);
  }
}

createQuestConfig();

