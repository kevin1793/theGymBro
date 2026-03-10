import { clearAllLocalData, run } from '@/database/db';
import { auth, db } from '@/lib/firebase';
import { pullAllUserData } from '@/repositories/syncRepo';
import { Stack, useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateRandomUsername = () => {
    const adjectives = [
      'Strong', 'Swift', 'Mighty', 'Iron', 'Savage', 'Agile', 'Ripped', 'Steady', 
      'Bold', 'Elite', 'Heavy', 'Fierce', 'Vibrant', 'Quick', 'Solid', 'Dynamic', 
      'Hyper', 'Primal', 'Active', 'Tough', 'Steadfast', 'Epic', 'Brawny', 'Rapid', 
      'Peak', 'Wild', 'Atomic', 'Vast', 'Sharp', 'Turbo', 'Kinetic', 'Brave', 'Titan'
    ];
    const nouns = [
      'Lion', 'Beast', 'Warrior', 'Titan', 'Atlas', 'Runner', 'Lifter', 'Racer', 
      'Grizzly', 'Hawk', 'Falcon', 'Rhino', 'Wolf', 'Spartan', 'Athlete', 'Legend', 
      'Machine', 'Ranger', 'Scout', 'Blaze', 'Bolt', 'Storm', 'Viking', 'Gladiator', 
      'Coach', 'Guru', 'Striker', 'Knight', 'Cyborg', 'Nomad', 'Apex', 'Zenith', 'Vanguard'
    ];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 100);
    return `${adj}-${noun}-${num}`;
  };

  const handleAuth = async () => {
    if (loading) return;
    setLoading(true);
    Keyboard.dismiss();

    try {
      let userCredential;

      if (isRegister) {
        if (!firstName || !lastName) {
          Alert.alert('Missing Info', 'Please enter your first and last name.');
          setLoading(false);
          return;
        }

        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const randomUsername = generateRandomUsername();
        const fullName = `${firstName} ${lastName}`;

        await updateProfile(user, { displayName: fullName });

        // Save to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          firstName,
          lastName,
          username: randomUsername,
          email: user.email,
          createdAt: serverTimestamp(),
        });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;

      // 1. Wipe old local data before seeding new user data
      await clearAllLocalData();

      // 2. Fetch/Create User Document and Seed local SQLite 'users' table
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let finalUsername = '';

      if (userDoc.exists()) {
        const data = userDoc.data();
        finalUsername = data.username || '';
        await run(
          `INSERT OR REPLACE INTO users (uid, firstName, lastName, username, email) VALUES (?, ?, ?, ?, ?)`,
          [user.uid, data.firstName || '', data.lastName || '', finalUsername, user.email]
        );
      } else {
        finalUsername = generateRandomUsername();
        await setDoc(doc(db, 'users', user.uid), {
          firstName: '',
          lastName: '',
          username: finalUsername,
          email: user.email,
          createdAt: serverTimestamp(),
        });
      }

      // 3. Sequential Data Pull (Goals, Templates, History)
      // This prevents the "runAsync" Busy error by finishing before navigation
      // Inside Login.tsx handleAuth
      // Inside handleAuth in Login.tsx
        await pullAllUserData(user.uid);

        // Give SQLite a moment to close its journal file and release the lock
        await new Promise(resolve => setTimeout(resolve, 800));

        setLoading(false);
        router.replace('/(tabs)');

      
    } catch (error: any) {
      console.log('Auth Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Stack.Screen options={{ headerShown: false }} />

          <View style={styles.brandContainer}>
            <Text style={styles.appName}>The Gym Bro</Text>
            <Text style={styles.tagline}>Track. Lift. Progress.</Text>
          </View>

          <Text style={styles.header}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </Text>

          {isRegister && (
            <>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#777"
                value={firstName}
                onChangeText={setFirstName}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#777"
                value={lastName}
                onChangeText={setLastName}
                editable={!loading}
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
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#777"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Pressable 
            style={[styles.button, loading && { opacity: 0.7 }]} 
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegister ? 'Create Account' : 'Login'}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => setIsRegister(!isRegister)} disabled={loading}>
            <Text style={styles.switchText}>
              {isRegister
                ? 'Already have an account? Login'
                : "Don't have an account? Create one"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
