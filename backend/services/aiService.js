async function generateAssistantResponse({ question, dataset, plan, result }) {
  const fallbackResponse = buildHeuristicAssistantResponse({
    question,
    dataset,
    plan,
    result,
  });

  try {
    const prompt = [
      'You are a smart data analyst.',
      'Give short, clear answers.',
      '',
      `Question: ${question}`,
      `Summary: ${result.summary}`,
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      summary: text || fallbackResponse.summary,
      keyPoints: fallbackResponse.keyPoints,
      followUps: fallbackResponse.followUps,
      provider: 'gemini',
      usedAi: true,
    };
  } catch (error) {
    console.warn('Gemini failed:', error.message);
    return fallbackResponse;
  }
}