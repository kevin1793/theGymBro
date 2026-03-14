import { AppModal } from '@/components/AppModal';
import { auth, db } from '@/lib/firebase';
import { addComment, deletePost, reportPost } from '@/repositories/threadRepo';
import { getUser } from '@/repositories/usersRepo';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ThreadScreen() {
  const router = useRouter();
  const { id, userName, text, uid } = useLocalSearchParams();
  
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    onConfirm: () => {},
    variant: 'success' as 'success' | 'danger',
    confirmText: 'Yes'
  });

  const openModal = (title: string, onConfirm: () => void, variant: 'success' | 'danger' = 'success', confirmText = 'Yes') => {
    setModalConfig({ title, onConfirm, variant, confirmText });
    setModalVisible(true);
  };

  // 1. Fetch profile on mount
  useEffect(() => {
    const fetchMyProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const profile = await getUser(user.uid);
        if (profile) {
          setCurrentUsername(profile.username || profile.firstName || "Gym Member");
        }
      }
    };
    fetchMyProfile();
  }, []);

  // 2. Listen for comments
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'posts', id as string, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [id]);

  const handleReply = async () => {
    if (!commentText.trim()) return;

    const userUid = auth.currentUser?.uid;
    if (!userUid) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', userUid));
      const userData = userDoc.data();
      
      const finalUsername = userData?.username || userData?.firstName || currentUsername || "Gym Member";

      // Pass the UID into the comment so we can identify "You" later
      await addComment(id as string, commentText, finalUsername, userUid); 
      setCommentText('');
      
      if (userData?.username || userData?.firstName) {
        setCurrentUsername(userData.username || userData.firstName);
      }
    } catch (error) {
      console.error("Reply Error:", error);
    }
  };

  const showOptions = () => {
    const isMyPost = uid === auth.currentUser?.uid;

    if (isMyPost) {
      openModal(
        "Delete this post forever?",
        async () => {
          await deletePost(id as string);
          setModalVisible(false);
          router.back();
        },
        'danger',
        'Delete'
      );
    } else {
      openModal(
        "Report this post for review?",
        async () => {
          await reportPost(id as string, text as string, "User Flagged");
          setModalVisible(false);
        },
        'success',
        'Report'
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>

        <Stack.Screen
          options={{
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back(); // normal push stack
                  } else {
                    router.push('/'); // fallback if JS stack is empty
                  }
                }}
                style={{ paddingHorizontal: 16 }}
              >
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </Pressable>
            ),
            title: '',
            headerBackTitle: '',
            headerBackTitleVisible: false,
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#121212' },
          }}
        />

        <AppModal 
          visible={modalVisible}
          title={modalConfig.title}
          variant={modalConfig.variant}
          confirmText={modalConfig.confirmText}
          onClose={() => setModalVisible(false)}
          onConfirm={modalConfig.onConfirm}
        />

        <View style={styles.mainPost}>
          <View style={styles.headerRow}>
            <Text style={styles.postUser}>
              {userName}
              {uid === auth.currentUser?.uid && (
                <Text style={styles.youTag}> (You)</Text>
              )}
            </Text>
            <Pressable onPress={showOptions} style={{ padding: 5 }}>
              <MaterialIcons name="more-horiz" size={24} color="#888" />
            </Pressable>
          </View>
          <Text style={styles.postText}>{text}</Text>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Text style={styles.commentUser}>
                {item.userName}
                {item.uid === auth.currentUser?.uid && (
                  <Text style={styles.youTagSmall}> (You)</Text>
                )}
              </Text>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          )}
        />

        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            value={commentText} 
            onChangeText={setCommentText} 
            placeholder="Add a comment..."
            placeholderTextColor="#666"
          />
          <Pressable onPress={handleReply} style={styles.sendButton}>
            <Text style={{color: '#fff', fontWeight: 'bold'}}>Reply</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  mainPost: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  postUser: { color: '#4CAF50', fontWeight: 'bold', fontSize: 18 },
  youTag: { color: '#888', fontWeight: '400', fontSize: 14 },
  youTagSmall: { color: '#888', fontWeight: '400', fontSize: 11 },
  postText: { color: '#fff', fontSize: 16, lineHeight: 24 },
  commentItem: { paddingHorizontal: 20, paddingVertical: 12, borderLeftWidth: 2, borderLeftColor: '#4CAF50', marginLeft: 20, marginTop: 15 },
  commentUser: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  commentText: { color: '#ccc', fontSize: 14 },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#333', 
    backgroundColor: '#121212',
    position: 'absolute',
    bottom: 0,
    width: '100%'
  },
  input: { flex: 1, backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 10, paddingHorizontal: 15, height: 45 },
  sendButton: { marginLeft: 12, justifyContent: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 20, borderRadius: 10 }
});
