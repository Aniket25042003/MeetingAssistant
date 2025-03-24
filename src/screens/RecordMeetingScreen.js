// RecordMeetingScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { firestore, auth } from '../services/firebase';
import * as FileSystem from 'expo-file-system';
import transcribeAudio from '../services/speechToText';
import nebiusAI from '../services/nebiusAI';
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

const RecordMeetingScreen = ({ navigation }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [meetingName, setMeetingName] = useState('');
  const [processingAudio, setProcessingAudio] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  
  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });

  useEffect(() => {
    // Generate default meeting name (Meeting 1, Meeting 2, etc.)
    const generateMeetingName = async () => {
      const userId = auth.currentUser.uid;
      const snapshot = await firestore
        .collection('meetings')
        .where('userId', '==', userId)
        .get();
      
      setMeetingName(`Meeting ${snapshot.size + 1}`);
    };
    
    generateMeetingName();
    
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant microphone permissions to record meetings.');
        return;
      }
      
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      // Process the recording
      await processRecording(uri);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const processRecording = async (audioUri) => {
    setProcessingAudio(true);
    try {
      // Step 1: Transcribe audio using Whisper
      setProcessingStage('Transcribing audio...');
      const transcript = await transcribeAudio(audioUri);
      
      // Step 2: Generate summary and tasks using Nebius AI
      setProcessingStage('Generating summary and tasks...');
      const { summary, tasks } = await nebiusAI.generateSummaryAndTasks(transcript);
      
      // Step 3: Save to Firebase
      setProcessingStage('Saving to database...');
      await saveMeetingData(meetingName, summary, tasks);
      
      Alert.alert(
        "Success", 
        "Meeting recorded and processed successfully!",
        [{ 
          text: "OK", 
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })
        }]
      );
    } catch (error) {
      console.error("Error processing recording:", error);
      Alert.alert("Error", "Failed to process recording: " + error.message);
    } finally {
      setProcessingAudio(false);
      setProcessingStage('');
    }
  };

  const saveMeetingData = async (title, summary, tasks) => {
    const userId = auth.currentUser.uid;
    
    // Create meeting document
    const meetingRef = await firestore.collection('meetings').add({
      title,
      userId,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    
    // Add summary
    await firestore
      .collection('meetings')
      .doc(meetingRef.id)
      .collection('summaries')
      .add({
        content: summary,
        createdAt: new Date().toISOString()
      });
    
    // Add tasks
    const batch = firestore.batch();
    tasks.forEach(task => {
      const taskRef = firestore
        .collection('meetings')
        .doc(meetingRef.id)
        .collection('tasks')
        .doc();
      
      batch.set(taskRef, {
        description: task,
        completed: false,
        createdAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0373fc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Meeting</Text>
      
      <TextInput
        style={styles.input}
        value={meetingName}
        onChangeText={setMeetingName}
        placeholder="Meeting Name"
        placeholderTextColor="#A0A0A0"
      />
      
      {processingAudio ? (
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Processing audio...</Text>
          <Text style={styles.stageText}>{processingStage}</Text>
          <ActivityIndicator size="large" color="#0373fc" style={styles.loader} />
        </View>
      ) : (
        <View style={styles.recordingContainer}>
          {isRecording ? (
            <>
              <Text style={styles.recordingText}>Recording in progress...</Text>
              <TouchableOpacity 
                style={[styles.button, styles.stopButton]} 
                onPress={stopRecording}
              >
                <Text style={styles.buttonText}>Stop Recording</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.startButton]} 
              onPress={startRecording}
            >
              <Text style={styles.buttonText}>Start Recording</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.button, styles.cancelButton]} 
        onPress={() => navigation.goBack()} 
        disabled={processingAudio}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    marginBottom: 20,
    color: '#ffd834',
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: '#ffd834',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#1E1E1E',
    color: '#E0E0E0',
    fontFamily: 'Roboto_400Regular',
  },
  recordingContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  recordingText: {
    fontSize: 18,
    color: '#ff6b6b',
    marginBottom: 20,
    fontFamily: 'Roboto_400Regular',
  },
  processingContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  processingText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#FFFFFF',
    fontFamily: 'Roboto_700Bold',
  },
  stageText: {
    marginBottom: 20,
    color: '#A0A0A0',
    fontFamily: 'Roboto_400Regular',
  },
  loader: {
    marginTop: 20,
  },
  button: {
    width: '100%',
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  startButton: {
    backgroundColor: '#ffd834',
  },
  stopButton: {
    backgroundColor: '#FF0000',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  buttonText: {
    color: '#222222',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  },
  cancelButtonText: {
    color: '#A0A0A0',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  }
});

export default RecordMeetingScreen;
