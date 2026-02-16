import { auth, db } from '@/lib/firebase';
import { Stack, router } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleAuth = async () => {
    try {
      let userCredential;

      if (isRegister) {
        if (!firstName || !lastName) {
          Alert.alert('Missing Info', 'Please enter your first and last name.');
          return;
        }

        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const user = userCredential.user;

        const fullName = `${firstName} ${lastName}`;

        // 🔥 Update Firebase Auth displayName
        await updateProfile(user, {
          displayName: fullName,
        });

        // 🔥 Create Firestore user profile
        await setDoc(doc(db, 'users', user.uid), {
          firstName,
          lastName,
          displayName: fullName,
          email: user.email,
          defaultWeightUnit: 'lbs',
          createdAt: serverTimestamp(),
        });

      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const user = userCredential.user;

        // Optional safety check
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            firstName: '',
            lastName: '',
            displayName: user.displayName || '',
            email: user.email,
            defaultWeightUnit: 'lbs',
            createdAt: serverTimestamp(),
          });
        }
      }

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Auth Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Branding */}
      <View style={styles.brandContainer}>
        <Text style={styles.appName}>The Gym Bro</Text>
        <Text style={styles.tagline}>Track. Lift. Progress.</Text>
      </View>

      <Text style={styles.header}>
        {isRegister ? 'Create Account' : 'Welcome Back'}
      </Text>

      {/* First + Last Name (Register Only) */}
      {isRegister && (
        <>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#777"
            value={firstName}
            onChangeText={setFirstName}
          />

          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#777"
            value={lastName}
            onChangeText={setLastName}
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#777"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#777"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleAuth}>
        <Text style={styles.buttonText}>
          {isRegister ? 'Create Account' : 'Login'}
        </Text>
      </Pressable>

      <Pressable onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.switchText}>
          {isRegister
            ? 'Already have an account? Login'
            : "Don't have an account? Create one"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 24,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#4CAF50',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 6,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  switchText: {
    color: '#4CAF50',
    textAlign: 'center',
  },
});
