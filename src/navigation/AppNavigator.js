import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { auth } from '../services/firebase';
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import RecordMeetingScreen from '../screens/RecordMeetingScreen';
import AttachTranscriptScreen from '../screens/AttachTranscriptScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  
  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing || !fontsLoaded) {
    return null; // or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1A1A1A',
            elevation: 0, 
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#333',
          },
          headerTintColor: '#ffd834',
          headerTitleStyle: {
            fontFamily: 'Roboto_700Bold',
            fontSize: 20,
          },
        }}
      >
        {user ? (
          // User is signed in
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ 
                title: 'Meeting Assistant',
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => auth.signOut()}
                    style={styles.logoutButton}
                  >
                    <Text style={styles.logoutText}>Logout</Text>
                  </TouchableOpacity>
                ),
              }}
            />
            <Stack.Screen 
              name="RecordMeeting" 
              component={RecordMeetingScreen} 
              options={{ title: 'Record Meeting' }}
            />
            <Stack.Screen 
              name="AttachTranscript" 
              component={AttachTranscriptScreen} 
              options={{ title: 'Attach Transcript' }}
            />
          </>
        ) : (
          // User is not signed in
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen} 
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    padding: 5,
    borderWidth: 2,
    borderColor: '#FFEB3B',
    borderRadius: 5,
    backgroundColor: '#ffd834',
  },
  logoutText: {
    color: '#222222',
    fontFamily: 'Roboto_700Bold',
    fontSize: 14,
  }
});

export default AppNavigator;
