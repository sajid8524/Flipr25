// Function to summarize the input text using the Summarizer API
async function summarizeText(inputText) {
  const options = {
    sharedContext: 'This is an input text for summarization',
    type: 'key-points',
    format: 'markdown',
    length: 'medium',
  };

  // Check the availability of the Summarizer API
  const capabilities = await self.ai.summarizer.capabilities();
  const available = capabilities.available;

  if (available === 'no') {
    console.error('The Summarizer API is not available.');
    return null;
  }

  let summarizer;

  if (available === 'readily') {
    // API is ready for immediate use
    summarizer = await self.ai.summarizer.create(options);
  } else {
    // API requires downloading resources
    summarizer = await self.ai.summarizer.create(options);
    summarizer.addEventListener('downloadprogress', (e) => {
      console.log(`Downloading: ${e.loaded} / ${e.total}`);
    });
    await summarizer.ready; // Wait until the download is complete
  }

  // Generate and return the summary
  try {
    const summary = await summarizer.summarize(inputText);
    return summary;
  } catch (error) {
    console.error('Error during summarization:', error);
    return null;
  }
}

// Listen for messages from the popup or other parts of the extension
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "summarizeText" && message.content) {
    const inputText = message.content;

    // Call the summarizeText function
    const summary = await summarizeText(inputText);

    if (summary) {
      console.log("Generated Summary:", summary);

      // Send the summary to the side panel
      chrome.runtime.sendMessage({ action: "updateSidePanel", content: summary });
      sendResponse({ success: true, summary });
    } else {
      console.error("Failed to generate summary.");
      sendResponse({ success: false, error: "Summarization failed." });
    }
  }
  return true; // Keep the message channel open for async response
});
