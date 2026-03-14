import { auth, db } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  // REMOVED: modalVisible state
  const [isSyncing, setIsSyncing] = useState(false);

  const [userData, setUserData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    username?: string;
    isFlagged?: boolean;
    banUntil?: number;
  } | null>(null);

  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editUser, setEditUser] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setUserData(data);
          setEditFirst(data.firstName || '');
          setEditLast(data.lastName || '');
          setEditUser(data.username || '');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        firstName: editFirst,
        lastName: editLast,
        username: editUser,
        updatedAt: Date.now(),
      };

      await updateDoc(userRef, updatedData);

      setUserData({ ...userData, ...updatedData } as any);
      setIsEditing(false);
      // REMOVED: setModalVisible(true)
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#4CAF50" style={{flex:1}} />;

  const handleLogout = async () => {
    setIsSyncing(true);
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Final sync failed:', error);
      await signOut(auth);
      router.replace('/login');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* REMOVED: <AppModal /> component */}
      
      <Text style={styles.name}>{userData?.firstName} {userData?.lastName}</Text>
      <Text style={styles.email}>{userData?.email}</Text>

      {userData?.isFlagged && (
        <View style={[styles.infoBox, { borderColor: '#ff4444', borderWidth: 1 }]}>
          <Text style={[styles.infoLabel, { color: '#ff4444' }]}>ACCOUNT STATUS</Text>
          <Text style={styles.infoValue}>Flagged for Review</Text>
          {userData.banUntil > Date.now() && (
            <Text style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>
              Posting Restricted until: {new Date(userData.banUntil).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      <View style={styles.infoContainer}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>First Name</Text>
          {isEditing ? (
            <TextInput 
              style={styles.editInput} 
              value={editFirst} 
              onChangeText={setEditFirst} 
              placeholderTextColor="#555"
            />
          ) : (
            <Text style={styles.infoValue}>{userData?.firstName}</Text>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Last Name</Text>
          {isEditing ? (
            <TextInput 
              style={styles.editInput} 
              value={editLast} 
              onChangeText={setEditLast} 
              placeholderTextColor="#555"
            />
          ) : (
            <Text style={styles.infoValue}>{userData?.lastName}</Text>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Username</Text>
          {isEditing ? (
            <TextInput 
              style={styles.editInput} 
              value={editUser} 
              onChangeText={setEditUser} 
              autoCapitalize="none"
              placeholderTextColor="#555"
            />
          ) : (
            <Text style={styles.infoValue}>{userData?.username || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.buttonRow}>
          {isEditing ? (
            <>
              <Pressable 
                style={[styles.editButton, styles.cancelBtn]} 
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>

              <Pressable 
                style={[styles.editButton, styles.saveBtn]} 
                onPress={handleUpdateProfile}
              >
                <Text style={styles.buttonText}>Save All</Text>
              </Pressable>
            </>
          ) : (
            <Pressable 
              style={styles.editButton} 
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.logoutButton, isSyncing && { opacity: 0.5 }]} 
          onPress={handleLogout}
          disabled={isSyncing}
        >
          <Text style={styles.logoutText}>
            {isSyncing ? 'Syncing Data...' : 'Log Out'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', padding: 20 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 20 },
  email: { fontSize: 14, color: '#aaa', marginBottom: 30 },
  infoContainer: { width: '100%', flex: 1 },
  infoBox: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 8, marginBottom: 12 },
  infoLabel: { fontSize: 12, color: '#777', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  footer: { width: '100%', paddingBottom: 40, alignItems: 'center' },
  logoutButton: { borderWidth: 1, borderColor: '#ff4444', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20 },
  logoutText: { color: '#ff4444', fontWeight: '600', fontSize: 14 },
  editInput: { color: '#fff', fontSize: 16, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#4CAF50', paddingVertical: 4 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 10 }, // Added missing buttonRow style
  editButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
  },
  cancelBtn: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
