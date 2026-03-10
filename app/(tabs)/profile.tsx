import { AppModal } from '@/components/AppModal';
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
  const [modalVisible, setModalVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [userData, setUserData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    username?: string;
    isFlagged?: boolean;    // Add this
    banUntil?: number;      // Add this
  } | null>(null);

  // States for the edit form
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
          // Pre-fill edit states
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
      setModalVisible(true);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#4CAF50" style={{flex:1}} />;

  const handleLogout = async () => {
    setIsSyncing(true);
    try {
      // This now pushes Goals, Workouts, AND History
      // await syncLocalDataToCloud();
      
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Final sync failed:', error);
      // Logout anyway to ensure user isn't stuck
      await signOut(auth);
      router.replace('/login');
    } finally {
      setIsSyncing(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <AppModal 
        visible={modalVisible}
        title="Profile Updated Successfully!"
        onConfirm={() => setModalVisible(false)}
        onClose={() => setModalVisible(false)}
      />
      
      {/* Profile Header */}
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
        {/* First Name Field */}
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

        {/* Last Name Field */}
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

        {/* Username Field */}
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

        {/* Action Buttons */}
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

      {/* Footer / Logout */}
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
  editButton: {
    flex: 1, // This makes buttons equal width in a row
    backgroundColor: '#333',
    paddingVertical: 14, // Slightly taller for better touch target
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#4CAF50', // Success Green
  },
  cancelBtn: {
    backgroundColor: '#2A2A2A', // Subtle Dark Gray
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
   buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,           // Space between the buttons
    marginTop: 20,     // Space above the button section
    alignItems: 'center',
    justifyContent: 'center',
  },
});
