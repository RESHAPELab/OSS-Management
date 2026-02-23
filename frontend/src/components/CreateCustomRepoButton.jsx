import React, { useState } from "react";
import API_CONFIG from "../config/api";

export default function CreateCustomRepoButton({
  customQuestConfig,
  classInfo,
}) {
  const baseURL = API_CONFIG.getBaseURL();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [resultCustom, setResultCustom] = useState(null);

  const handleCreateCustomRepo = async () => {
    console.log("🚀 [Frontend] CreateCustomRepoButton clicked");
    setLoading(true);
    setResult(null);

    const requestBody = {
      users: ["misanatnau"],
      sequenceFile: "test.json",
    };

    console.log("📤 [Frontend] Sending request:", requestBody);

    try {
      // Replace fetch calls:
      const response = await fetch(`${baseURL}/api/repo/createCustomRepos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 [Frontend] Response status:", response.status);
      console.log(
        "📥 [Frontend] Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      const data = await response.json();
      console.log("📥 [Frontend] Response data:", data);

      setResult(data);
    } catch (error) {
      console.error("❌ [Frontend] Error:", error);
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const handleCreateCustomRepoFromArrangement = async () => {
    setLoadingCustom(true);
    setResultCustom(null);

    if (!customQuestConfig) {
      setResultCustom({ error: "No custom quest arrangement provided." });
      setLoadingCustom(false);
      return;
    }

    try {
      const requestBody = {
        users: ["misanatnau"],
        customSequence: customQuestConfig,
        className: classInfo?.groupName,
        classId: classInfo?._id,
      };

      console.log("📤 [Frontend] Sending custom arrangement request with:", {
        users: requestBody.users,
        questCount: customQuestConfig?.questSequence?.length || 0,
        hasMapLink: !!customQuestConfig?.map_repo_link,
        className:
          classInfo?.groupName || "(not provided - will use fallback naming)",
        namingPattern: classInfo?.groupName
          ? `username-${classInfo.groupName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")}`
          : "username-custom-oss-doorway",
      });

      // 🎯 KEEP: Detailed custom quest logging for button test
      console.log("🎮 [BUTTON-CUSTOM-QUESTS] Quest config being sent to bot:");
      console.log(
        "🎮 [BUTTON-CUSTOM-QUESTS] Full customQuestConfig:",
        JSON.stringify(customQuestConfig, null, 2)
      );

      if (customQuestConfig?.questSequence) {
        console.log("🎮 [BUTTON-CUSTOM-QUESTS] Quest sequence breakdown:");
        customQuestConfig.questSequence.forEach((quest, index) => {
          console.log(`🎮 [BUTTON-CUSTOM-QUESTS] Quest ${index + 1}:`, {
            questId: quest.questId,
            title: quest.title,
            type: quest.questType,
            isQ0: quest.isQ0,
            sequenceNumber: quest.sequenceNumber,
            hasMetadata: !!quest.metadata,
            hasTasks: !!quest.tasks,
            taskCount: quest.tasks ? Object.keys(quest.tasks).length : 0,
          });

          // Log custom quests in detail
          if (quest.questType === "custom") {
            console.log(
              `🔥 [BUTTON-CUSTOM-QUEST-DETAIL] Custom Quest "${quest.title}":`,
              {
                questId: quest.questId,
                badgeDescription: quest.badgeDescription,
                metadata: quest.metadata,
                tasks: quest.tasks,
              }
            );

            if (quest.tasks) {
              console.log(
                `📋 [BUTTON-CUSTOM-QUEST-TASKS] Tasks for "${quest.title}":`
              );
              Object.entries(quest.tasks).forEach(([taskKey, task]) => {
                console.log(
                  `📋 [BUTTON-CUSTOM-QUEST-TASKS] Task ${taskKey}:`,
                  task
                );
              });
            }
          }
        });

        // Summary of what the bot will receive
        const customQuests = customQuestConfig.questSequence.filter(
          (q) => q.questType === "custom"
        );
        const fixedQuests = customQuestConfig.questSequence.filter(
          (q) => q.questType === "fixed"
        );

        console.log("🎯 [BUTTON-BOT-SUMMARY] Bot will receive:", {
          totalQuests: customQuestConfig.questSequence.length,
          customQuests: customQuests.length,
          fixedQuests: fixedQuests.length,
          customQuestTitles: customQuests.map((q) => q.title),
          map_repo_link: customQuestConfig.map_repo_link,
          hasMetadata: !!customQuestConfig.metadata,
        });
      }

      const response = await fetch("/api/repo/createCustomRepos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      setResultCustom(data);
    } catch (error) {
      setResultCustom({ error: error.message });
    }
    setLoadingCustom(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h3>Create Custom Repository</h3>
      <button
        onClick={handleCreateCustomRepo}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: loading ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "10px",
        }}
      >
        {loading
          ? "Creating..."
          : "Create Custom Repo for misanatnau (test.json)"}
      </button>
      {result && (
        <div style={{ marginTop: "10px" }}>
          <h4>Result:</h4>
          <pre
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "5px",
              color: result.error ? "red" : "green",
              overflow: "auto",
              maxHeight: "300px",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      <button
        onClick={handleCreateCustomRepoFromArrangement}
        disabled={loadingCustom}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: loadingCustom ? "#ccc" : "#28a745",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: loadingCustom ? "not-allowed" : "pointer",
          marginTop: "20px",
        }}
      >
        {loadingCustom
          ? "Creating..."
          : "Create Custom Repo for misanatnau (Current Quest Arrangement)"}
      </button>
      {resultCustom && (
        <div style={{ marginTop: "10px" }}>
          <h4>Result (Current Arrangement):</h4>
          <pre
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "5px",
              color: resultCustom.error ? "red" : "green",
              overflow: "auto",
              maxHeight: "300px",
            }}
          >
            {JSON.stringify(resultCustom, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
