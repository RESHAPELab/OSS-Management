const axios = require('axios');

// Generate a helpful hint for a task using OpenAI if OPENAI_API_KEY is set, else fall back
async function generateHint(req, res) {
  try {
    const task = req.body || {};
    const {
      type,
      desc,
      accept,
      repository,
      ossRepository,
      issueNumber,
      responsePath,
      expectedAnswerType,
      llmTextValidation
    } = task;

    const contextParts = [];
    if (desc) contextParts.push(`Description: ${desc}`);
    if (accept) contextParts.push(`Accept/Prompt: ${accept}`);
    if (repository || ossRepository) contextParts.push(`Repository: ${repository || ossRepository}`);
    if (issueNumber) contextParts.push(`Issue Number: ${issueNumber}`);
    if (responsePath) contextParts.push(`Response Path: ${responsePath}`);
    if (expectedAnswerType) contextParts.push(`Expected Answer Type: ${expectedAnswerType}`);
    if (llmTextValidation && Array.isArray(llmTextValidation.validationParameters)) {
      contextParts.push(`Criteria: ${llmTextValidation.validationParameters.join('; ')}`);
    }

    const system = `You are a helpful teaching assistant for an OSS learning platform. Generate a single actionable hint (1-3 sentences) that nudges the student toward the answer without revealing it.`;

    // Few-shot examples from default quests (kept concise)
    const examples = [
      {
        user: "Task Type: get-issue-count\nRepository: probot-test-org/test-repo\n\nGenerate ONE concise hint. Avoid revealing the exact answer.",
        assistant: "Open the repository’s Issues tab and count only the items under OPEN issues (not pull requests)."
      },
      {
        user: "Task Type: get-pr-count\nRepository: probot-test-org/test-repo\n\nGenerate ONE concise hint. Avoid revealing the exact answer.",
        assistant: "Go to the Pull requests tab and look at the number of open PRs at the top of the list."
      },
      {
        user: "Task Type: get-issue-title\nRepository: probot-test-org/test-repo\nIssue Number: 12\n\nGenerate ONE concise hint. Avoid revealing the exact answer.",
        assistant: "Open issue #12 and copy the title exactly as shown (mind capitalization and punctuation)."
      },
      {
        user: "Task Type: issue-no\nRepository: probot-test-org/test-repo\n\nGenerate ONE concise hint. Avoid revealing the exact answer.",
        assistant: "From the Issues tab, choose any issue and use the number shown next to its title (digits only)."
      },
      {
        user: "Task Type: custom-api-call\nRepository: jabref/jabref\nResponse Path: stargazers_count\n\nGenerate ONE concise hint. Avoid revealing the exact answer.",
        assistant: "Confirm the endpoint matches the repo and extract the numeric field specified by the response path."
      },
      {
        user: "Task Type: llm-text-validation\nCriteria: List at least 3 specific examples; Define open source software clearly\n\nGenerate ONE concise hint. Avoid revealing the exact answer.",
        assistant: "State a clear definition of open source and provide at least three concrete project examples (e.g., languages, frameworks, or tools)."
      }
    ];

    const user = `Task Type: ${type}\n${contextParts.join('\n')}\n\nGenerate ONE concise hint. Avoid revealing the exact answer.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const messages = [
          { role: 'system', content: system },
          // Insert few-shot pairs
          ...examples.flatMap(e => ([{ role: 'user', content: e.user }, { role: 'assistant', content: e.assistant }])),
          { role: 'user', content: user }
        ];

        const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.3,
          max_tokens: 120
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        const hint = resp.data?.choices?.[0]?.message?.content?.trim() || 'Try focusing on the core requirement and check the repository section that matches it.';
        return res.status(200).json({ success: true, data: { hint } });
      } catch (e) {
        // Fall through to heuristic if OpenAI fails
        console.warn('[AI] OpenAI call failed, using heuristic:', e?.response?.data || e?.message || e);
      }
    }

    // Heuristic fallback by task type
    let hint = 'Re-read the task and check the relevant tab in the repository. Look for exact terms used in the prompt.';
    switch (type) {
      case 'get-issue-count':
        hint = 'Open the Issues tab in the repository and ensure you are counting only OPEN issues, not PRs.';
        break;
      case 'get-pr-count':
        hint = 'Open the Pull requests tab and count only open PRs. Make sure you are in the correct repository.';
        break;
      case 'get-issue-title':
        hint = 'Navigate to the specified issue number and copy the title exactly as shown on the GitHub page.';
        break;
      case 'issue-no':
        hint = 'Open the Issues tab and use the number shown next to the specific issue you found.';
        break;
      case 'custom-api-call':
        hint = 'Double-check the API resource and the field you are extracting. Confirm the endpoint matches the owner/repo.';
        break;
      case 'llm-text-validation':
        if (llmTextValidation?.validationParameters?.length) {
          hint = `Make sure your answer covers: ${llmTextValidation.validationParameters.join(', ')}.`;
        } else {
          hint = 'Ensure your answer directly addresses the question and provides enough specifics.';
        }
        break;
      default:
        break;
    }

    return res.status(200).json({ success: true, data: { hint } });
  } catch (error) {
    console.error('Error generating hint:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate hint', error: error.message });
  }
}

module.exports = { generateHint }; 