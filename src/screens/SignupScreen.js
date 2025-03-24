import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth, firestore } from '../services/firebase';
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const { user } = await auth.createUserWithEmailAndPassword(email, password);
      
      // Create user document in Firestore
      await firestore.collection('users').doc(user.uid).set({
        name,
        email,
        createdAt: new Date(),
      });
      
      // Navigation will be handled by the auth state listener in App.js
    } catch (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#0373fc" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#A0A0A0"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#A0A0A0"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#A0A0A0"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity 
        style={styles.signupButton} 
        onPress={handleSignup} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.signupButtonText}>Sign Up</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.loginLink} 
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginHighlight}>Login</Text></Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  title: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 28,
    marginBottom: 40,
    textAlign: 'center',
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
    color: '#FFFFFF',
    fontFamily: 'Roboto_400Regular',
  },
  signupButton: {
    backgroundColor: '#ffd834',
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    color: '#222222',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  },
  loginLink: {
    marginTop: 25,
    alignItems: 'center',
  },
  loginText: {
    color: '#FFFFFF',
    fontFamily: 'Roboto_400Regular',
  },
  loginHighlight: {
    color: '#ffd834',
    fontFamily: 'Roboto_700Bold',
  }
});

export default SignupScreen;
