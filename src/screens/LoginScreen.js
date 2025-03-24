import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth } from '../services/firebase';
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
      // Navigation will be handled by the auth state listener in App.js
    } catch (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#3A506B" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meeting Assistant</Text>
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
        style={styles.loginButton} 
        onPress={handleLogin} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.loginButtonText}>Login</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.signupLink} 
        onPress={() => navigation.navigate('Signup')}
      >
        <Text style={styles.signupText}>Don't have an account? <Text style={styles.signupHighlight}>Sign up</Text></Text>
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
  loginButton: {
    backgroundColor: '#ffd834',
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#222222',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  },
  signupLink: {
    marginTop: 25,
    alignItems: 'center',
  },
  signupText: {
    color: '#FFFFFF',
    fontFamily: 'Roboto_400Regular',
  },
  signupHighlight: {
    color: '#ffd834',
    fontFamily: 'Roboto_700Bold',
  }
});

export default LoginScreen;
