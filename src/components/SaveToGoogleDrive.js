import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Share, ActivityIndicator } from 'react-native';
import { firestore } from '../services/firebase';
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

const SaveToGoogleDrive = ({ meetingId, summaryId, summary }) => {
  const [sharing, setSharing] = useState(false);
  
  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });

  const handleShare = async () => {
    setSharing(true);
    try {
      const result = await Share.share({
        message: summary,
        title: `Meeting Summary - ${new Date().toLocaleDateString()}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log(result.activityType);
        } else {
          // shared
          console.log('Shared successfully');
        }
        Alert.alert(
          "Success", 
          "Meeting summary shared successfully.",
          [{ text: "OK" }]
        );
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error("Error sharing summary:", error);
      Alert.alert("Error", "Failed to share meeting summary: " + error.message);
    } finally {
      setSharing(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={handleShare}
      disabled={sharing}
    >
      {sharing ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>Share Summary</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ffd834',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1A1A1A',
    fontFamily: 'Roboto_700Bold',
    fontSize: 14,
  }
});

export default SaveToGoogleDrive;
