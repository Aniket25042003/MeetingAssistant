import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { firestore, auth } from '../services/firebase';
import nebiusAI from '../services/nebiusAI';
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

const AttachTranscriptScreen = ({ navigation }) => {
  const [meetingName, setMeetingName] = useState('');
  const [transcript, setTranscript] = useState('');
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  
  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });

  useEffect(() => {
    const generateMeetingName = async () => {
      const userId = auth.currentUser.uid;
      const snapshot = await firestore
        .collection('meetings')
        .where('userId', '==', userId)
        .get();
      
      setMeetingName(`Meeting ${snapshot.size + 1}`);
    };
    
    generateMeetingName();
  }, []);

  const pickDocument = async () => {
    try {
      console.log("Opening document picker...");
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/plain", 
        copyToCacheDirectory: true
      });
      
      console.log("Document picker result:", JSON.stringify(result, null, 2));
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFileName(file.name);
        console.log("File selected:", file.name, file.uri);
        
        try {
          const fileContent = await FileSystem.readAsStringAsync(file.uri);
          console.log("File content length:", fileContent.length);
          setTranscript(fileContent);
        } catch (readError) {
          console.error("Error reading file:", readError);
          Alert.alert("Error", "Failed to read file content");
        }
      } else if (result.type === 'success') {
        setFileName(result.name);
        console.log("File selected (old format):", result.name, result.uri);
        
        try {
          const fileContent = await FileSystem.readAsStringAsync(result.uri);
          console.log("File content length:", fileContent.length);
          setTranscript(fileContent);
        } catch (readError) {
          console.error("Error reading file:", readError);
          Alert.alert("Error", "Failed to read file content");
        }
      } else {
        console.log("Document picking cancelled or failed");
      }
    } catch (err) {
      console.error('Document picking error:', err);
      Alert.alert('Error', 'Failed to pick document: ' + err.message);
    }
  };

  const processTranscript = async () => {
    if (!transcript) {
      Alert.alert('Error', 'Please enter or upload a transcript');
      return;
    }
    
    setProcessing(true);
    try {
      setProcessingStage('Generating summary and tasks...');
      const { summary, tasks } = await nebiusAI.generateSummaryAndTasks(transcript);
      
      setProcessingStage('Saving to database...');
      await saveMeetingData(meetingName, summary, tasks);
      
      Alert.alert(
        "Success", 
        "Transcript processed successfully!",
        [{ 
          text: "OK", 
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })
        }]
      );
    } catch (error) {
      console.error("Error processing transcript:", error);
      Alert.alert("Error", "Failed to process transcript: " + error.message);
    } finally {
      setProcessing(false);
      setProcessingStage('');
    }
  };

  const saveMeetingData = async (title, summary, tasks) => {
    const userId = auth.currentUser.uid;
    
    const meetingRef = await firestore.collection('meetings').add({
      title,
      userId,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    
    await firestore
      .collection('meetings')
      .doc(meetingRef.id)
      .collection('summaries')
      .add({
        content: summary,
        createdAt: new Date().toISOString()
      });
    
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
      <Text style={styles.title}>Attach Transcript</Text>
      
      <TextInput
        style={styles.input}
        value={meetingName}
        onChangeText={setMeetingName}
        placeholder="Meeting Name"
        placeholderTextColor="#A0A0A0"
      />
      
      <TouchableOpacity 
        style={styles.fileButton}
        onPress={pickDocument}
      >
        <Text style={styles.fileButtonText}>Pick Transcript File (.txt)</Text>
      </TouchableOpacity>
      
      {fileName ? (
        <View style={styles.fileNameContainer}>
          <Text style={styles.fileNameText}>Selected file: {fileName}</Text>
        </View>
      ) : null}
      
      <TextInput
        style={styles.transcriptInput}
        multiline
        numberOfLines={8}
        value={transcript}
        onChangeText={setTranscript}
        placeholder="Paste your transcript here..."
        placeholderTextColor="#A0A0A0"
      />
      
      {processing ? (
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Processing...</Text>
          <Text style={styles.stageText}>{processingStage}</Text>
          <ActivityIndicator size="large" color="#0373fc" style={styles.loader} />
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.button, styles.processButton, transcript.trim().length === 0 && styles.disabledButton]} 
          onPress={processTranscript} 
          disabled={transcript.trim().length === 0}
        >
          <Text style={styles.buttonText}>Process Transcript</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        style={[styles.button, styles.cancelButton]} 
        onPress={() => navigation.goBack()} 
        disabled={processing}
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
    backgroundColor: '#121212',
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
    borderColor: '#0373fc',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    fontFamily: 'Roboto_400Regular',
    borderColor: '#ffd834',
  },
  fileButton: {
    backgroundColor: '#ffd834',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  fileButtonText: {
    color: '#222222',
    fontFamily: 'Roboto_700Bold',
    fontSize: 14,
  },
  fileNameContainer: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ffd834',
  },
  fileNameText: {
    color: '#FFFFFF',
    fontFamily: 'Roboto_400Regular',
  },
  transcriptInput: {
    height: 200,
    borderWidth: 1,
    borderColor: '#ffd834',
    borderRadius: 8,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    fontFamily: 'Roboto_400Regular',
    textAlignVertical: 'top',
  },
  processingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  processingText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#E0E0E0',
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
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  processButton: {
    backgroundColor: '#ffd834',
  },
  disabledButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ffd834',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    marginTop: 20,
  },
  buttonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  },
  cancelButtonText: {
    color: '#A0A0A0',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  }
});

export default AttachTranscriptScreen;
