// src/services/nebiusAI.js
import OpenAI from 'openai';
import { NEBIUS_API_KEY } from '@env';

const nebiusClient = new OpenAI({
  baseURL: "https://api.studio.nebius.ai/v1/",
  apiKey: NEBIUS_API_KEY || "your_nebius_api_key",
  dangerouslyAllowBrowser: true 
});

const generateSummaryAndTasks = async (transcript) => {
  try {
    const completion = await nebiusClient.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-fast",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that creates meeting summaries and extracts action items from meeting transcripts."
        },
        {
          role: "user",
          content: `Please analyze this meeting transcript and provide: 
          1. A concise summary of the key points discussed (begin with "Summary:")
          2. A list of action items or tasks mentioned in the meeting (begin with "Tasks:")
          
          Format your response exactly like this:
          Summary: [your summary here]
          
          Tasks:
          - [task 1]
          - [task 2]
          - [task 3]
          
          Transcript: ${transcript}`
        }
      ],
      temperature: 0.7
    });
    
    const response = completion.choices[0].message.content;
    console.log("Raw LLM response:", response);
    
    const summaryMatch = response.match(/Summary:\s*([\s\S]*?)(?=\n\s*Tasks:|\s*$)/i);
    const tasksMatch = response.match(/Tasks:([\s\S]*)/i);
    
    let summary = summaryMatch ? summaryMatch[1].trim() : "No summary available";
    let tasks = [];
    
    if (tasksMatch) {
      tasks = tasksMatch[1]
        .split(/\n\s*-\s*/)
        .map(task => task.trim())
        .filter(task => task.length > 0);
    }
    
    // If no tasks found, try to extract list-like items
    if (tasks.length === 0) {
      const lines = response.split('\n');
      for (let line of lines) {
        if (line.match(/^\s*[-•*]\s+/) || line.match(/^\s*\d+\.\s+/)) {
          tasks.push(line.replace(/^\s*[-•*\d.]\s+/, '').trim());
        }
      }
    }
    
    // If still no summary, try to extract the first paragraph
    if (summary === "No summary available") {
      const paragraphs = response.split('\n\n');
      for (let paragraph of paragraphs) {
        if (paragraph.length > 30 && !paragraph.toLowerCase().includes("tasks:")) {
          summary = paragraph.trim();
          break;
        }
      }
    }
    
    console.log("Extracted summary:", summary);
    console.log("Extracted tasks:", tasks);
    
    return { summary, tasks };
  } catch (error) {
    console.error("Error generating summary and tasks:", error);
    throw error;
  }
};

export default { generateSummaryAndTasks };
