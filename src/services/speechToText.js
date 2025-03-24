// src/services/speechToText.js
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { HUGGINGFACE_API_KEY } from '@env';

const transcribeAudio = async (audioUri) => {
  try {
    console.log('Transcribing audio from:', audioUri);

    // Read the audio file
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    const audioBase64 = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });

    // Prepare the request body
    const body = JSON.stringify({
      inputs: audioBase64,
      model: "openai/whisper-large-v3", // Using a larger model for better long-form support
      parameters: {
        return_timestamps: true, // Enable timestamp tokens for longer audio
        chunk_length_s: 30, // Set chunk length to 30 seconds
        stride_length_s: 5 // Overlap between chunks to ensure continuity
      }
    });

    // Call Hugging Face Inference API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: body
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    const result = await response.json();
    
    // Extract full transcript from chunks
    let fullTranscript = "";
    if (Array.isArray(result)) {
      fullTranscript = result.map(chunk => chunk.text).join(" ");
    } else {
      fullTranscript = result.text || "Transcription failed";
    }

    return fullTranscript;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

export default transcribeAudio;
