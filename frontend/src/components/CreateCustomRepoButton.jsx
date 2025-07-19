import React, { useState } from "react";

export default function CreateCustomRepoButton({ customQuestConfig, classInfo }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [resultCustom, setResultCustom] = useState(null);

  const handleCreateCustomRepo = async () => {
    console.log('🚀 [Frontend] CreateCustomRepoButton clicked');
    setLoading(true);
    setResult(null);
    
    const requestBody = {
      users: ["misanatnau"],
      sequenceFile: "test.json"
    };
    
    console.log('📤 [Frontend] Sending request:', requestBody);
    
    try {
      const response = await fetch("/api/repo/createCustomRepos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📥 [Frontend] Response status:', response.status);
      console.log('📥 [Frontend] Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📥 [Frontend] Response data:', data);
      
      setResult(data);
    } catch (error) {
      console.error('❌ [Frontend] Error:', error);
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const handleCreateCustomRepoFromArrangement = async () => {
    setLoadingCustom(true);
    setResultCustom(null);
    if (!customQuestConfig) {
      setResultCustom({ error: 'No custom quest arrangement provided.' });
      setLoadingCustom(false);
      return;
    }
    const requestBody = {
      users: ["misanatnau"],
      customSequence: customQuestConfig,
      className: classInfo?.groupName,
      classId: classInfo?._id
    };
    console.log('📤 [Frontend] Sending custom arrangement request with:', {
      users: requestBody.users,
      questCount: customQuestConfig?.questSequence?.length || 0,
      hasMapLink: !!customQuestConfig?.map_repo_link,
      className: classInfo?.groupName || '(not provided - will use fallback naming)',
      namingPattern: classInfo?.groupName ? `username-${classInfo.groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'username-custom-oss-doorway'
    });
    try {
      const response = await fetch("/api/repo/createCustomRepos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
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
          marginBottom: "10px"
        }}
      >
        {loading ? "Creating..." : "Create Custom Repo for misanatnau (test.json)"}
      </button>
      {result && (
        <div style={{ marginTop: "10px" }}>
          <h4>Result:</h4>
          <pre style={{ 
            backgroundColor: "#f8f9fa", 
            padding: "15px", 
            borderRadius: "5px",
            color: result.error ? "red" : "green",
            overflow: "auto",
            maxHeight: "300px"
          }}>
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
          marginTop: "20px"
        }}
      >
        {loadingCustom ? "Creating..." : "Create Custom Repo for misanatnau (Current Quest Arrangement)"}
      </button>
      {resultCustom && (
        <div style={{ marginTop: "10px" }}>
          <h4>Result (Current Arrangement):</h4>
          <pre style={{ 
            backgroundColor: "#f8f9fa", 
            padding: "15px", 
            borderRadius: "5px",
            color: resultCustom.error ? "red" : "green",
            overflow: "auto",
            maxHeight: "300px"
          }}>
            {JSON.stringify(resultCustom, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 