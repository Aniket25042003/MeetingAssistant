import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { firestore, auth } from '../services/firebase';
import MeetingItem from '../components/MeetingItem';
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

const MEETINGS_PER_PAGE = 10;

const HomeScreen = ({ navigation }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  
  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });

  useEffect(() => {
    loadInitialMeetings();
    return () => {};
  }, []);

  const loadInitialMeetings = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser.uid;
      const meetingsRef = firestore
        .collection('meetings')
        .where('userId', '==', userId)
        .orderBy('date', 'desc')
        .limit(MEETINGS_PER_PAGE);
        
      const snapshot = await meetingsRef.get();
      
      if (snapshot.empty) {
        setMeetings([]);
        setAllLoaded(true);
      } else {
        const meetingsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMeetings(meetingsList);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setAllLoaded(snapshot.docs.length < MEETINGS_PER_PAGE);
      }
    } catch (error) {
      console.error("Error fetching meetings: ", error);
      Alert.alert("Error", "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMeetings = async () => {
    if (loadingMore || allLoaded) return;
    
    setLoadingMore(true);
    try {
      const userId = auth.currentUser.uid;
      const meetingsRef = firestore
        .collection('meetings')
        .where('userId', '==', userId)
        .orderBy('date', 'desc')
        .startAfter(lastVisible)
        .limit(MEETINGS_PER_PAGE);
        
      const snapshot = await meetingsRef.get();
      
      if (snapshot.empty) {
        setAllLoaded(true);
      } else {
        const moreMeetings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMeetings([...meetings, ...moreMeetings]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setAllLoaded(snapshot.docs.length < MEETINGS_PER_PAGE);
      }
    } catch (error) {
      console.error("Error loading more meetings: ", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const deleteMeeting = async (meetingId) => {
    try {
      const summariesSnapshot = await firestore
        .collection('meetings')
        .doc(meetingId)
        .collection('summaries')
        .get();
        
      const summariesBatch = firestore.batch();
      summariesSnapshot.forEach(doc => {
        summariesBatch.delete(doc.ref);
      });
      await summariesBatch.commit();
      
      const tasksSnapshot = await firestore
        .collection('meetings')
        .doc(meetingId)
        .collection('tasks')
        .get();
        
      const tasksBatch = firestore.batch();
      tasksSnapshot.forEach(doc => {
        tasksBatch.delete(doc.ref);
      });
      await tasksBatch.commit();
      
      await firestore.collection('meetings').doc(meetingId).delete();
      
      setMeetings(meetings.filter(meeting => meeting.id !== meetingId));
      
      Alert.alert("Success", "Meeting deleted successfully");
    } catch (error) {
      console.error("Error deleting meeting:", error);
      Alert.alert("Error", "Failed to delete meeting");
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0373fc" />
        <Text style={styles.footerText}>Loading more meetings...</Text>
      </View>
    );
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0373fc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Meetings</Text>
      
      {meetings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No meetings yet</Text>
          <Text style={styles.emptyStateSubText}>Record a meeting or upload a transcript to get started</Text>
        </View>
      ) : (
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MeetingItem 
              meeting={item} 
              onDelete={deleteMeeting}
            />
          )}
          contentContainerStyle={styles.meetingsList}
          onEndReached={loadMoreMeetings}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
        />
      )}
      
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.bottomButton}
          onPress={() => navigation.navigate('RecordMeeting')}
        >
          <Text style={styles.buttonText}>Record Meeting</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.bottomButton}
          onPress={() => navigation.navigate('AttachTranscript')}
        >
          <Text style={styles.buttonText}>Attach Transcript</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Roboto_700Bold',
    marginBottom: 20,
    color: '#ffd834',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
    marginBottom: 12,
    color: '#ffd834',
  },
  emptyStateSubText: {
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#ffd834',
    textAlign: 'center',
  },
  meetingsList: {
    paddingBottom: 120, // Increased padding to move content higher
  },
  bottomBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 25, // Moved up by 20 pixels
    left: 12,
    right: 12,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 5, // Added border radius for better appearance
  },
  bottomButton: {
    flex: 1,
    backgroundColor: '#ffd834',
    padding: 14,
    borderRadius: 8,
    marginHorizontal: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#222222',
    fontFamily: 'Roboto_700Bold',
    fontSize: 14,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 10,
    color: '#222222',
    fontFamily: 'Roboto_400Regular',
  }
});

export default HomeScreen;
