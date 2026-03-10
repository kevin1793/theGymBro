import { AppModal } from '@/components/AppModal';
import { auth, db } from '@/lib/firebase';
import { createPost, reportPost, toggleLike } from '@/repositories/threadRepo';
import { getUser } from '@/repositories/usersRepo'; // Import your user repo
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GlobalChat() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [username, setUsername] = useState<string>('Gym Member'); // State to hold the fetched username
  const [refreshing, setRefreshing] = useState(false);

  // --- MODAL STATE ---
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

  // --- FETCH USERNAME ON MOUNT ---
  useEffect(() => {
    const fetchUser = async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const user = await getUser(uid); // Fetches from your SQLite 'users' table
        if (user?.username) {
          setUsername(user.username);
        }
      }
    };
    fetchUser();
  }, []);

  // --- FEED LOGIC ---
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // You could re-fetch the user here too if needed
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

const handleSendPost = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      // 1. Fetch latest user status
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();

      if (userData?.banUntil && userData.banUntil > Date.now()) {
        const unlockDate = new Date(userData.banUntil).toLocaleString();
        // Updated to pass the message directly to openModal
        openModal(
          `You are banned from posting until: \n${unlockDate}`,
          () => setModalVisible(false),
          'danger',
          'OK'
        );
        return;
      }

      // 2. If not banned
      if (inputText.trim()) {
        await createPost(inputText, username);
        setInputText('');
      }
    } catch (error) {
      console.error("Post Error:", error);
    }
  };


  const showOptions = (post: any) => {
    const uid = auth.currentUser?.uid;
    const isMyPost = post.uid === uid;
    
    if (isMyPost) {
      openModal("Delete this post?", async () => {
        // await deletePost(post.id);
        setModalVisible(false);
      }, 'danger', 'Delete');
    } else {
      // Check local state immediately before opening modal
      if (post.reportedBy?.includes(uid)) {
        openModal("Already Reported", () => setModalVisible(false), 'success', 'OK');
        return;
      }

      openModal("Report this post?", async () => {
        try {
          await reportPost(post.id, post.text, post.uid);
          setModalVisible(false);
        } catch (error: any) {
          if (error.message === "ALREADY_REPORTED") {
            setModalConfig(prev => ({ ...prev, title: "You have already reported this post.", confirmText: "OK" }));
          }
        }
      }, 'danger', 'Report');
    }
  };

  const formatPostDate = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.chatSection}>
      <AppModal {...modalConfig} visible={modalVisible} onClose={() => setModalVisible(false)} />

      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.sectionTitle}>Community Feed</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Share your PR..."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
          />
          <Pressable style={styles.sendButton} onPress={handleSendPost}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Post</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" colors={["#4CAF50"]} />
        }
        renderItem={({ item }) => (
          <Pressable 
            style={styles.postCard}
            onPress={() => router.push({
              pathname: `/thread/${item.id}`,
              params: { id: item.id, userName: item.userName, text: item.text, uid: item.uid }
            })}
          >
            <View style={styles.postHeader}>
              <View>
                <Text style={styles.postUser}>{item.userName} {item.uid === auth.currentUser?.uid && (
        <Text style={[styles.postUser, { color: '#888', marginLeft: 4, fontWeight: '400' }]}>
          (You)
        </Text>
      )}</Text>
                {/* ADDED: "You" tag logic */}
      
                <Text style={styles.postDate}>{formatPostDate(item.createdAt)}</Text>
              </View>
              <Pressable onPress={(e) => { e.stopPropagation(); showOptions(item); }} style={{ padding: 5 }}>
                <MaterialIcons name="more-horiz" size={24} color="#888" />
              </Pressable>
            </View>

            <Text style={styles.postText}>{item.text}</Text>
            
            <View style={styles.actions}>
              <Pressable onPress={(e) => { e.stopPropagation(); toggleLike(item.id, item.likes?.includes(auth.currentUser?.uid)); }}>
                <Text style={{ color: '#4CAF50' }}>
                  {item.likes?.includes(auth.currentUser?.uid) ? '❤️' : '👍'} {item.likes?.length || 0}
                </Text>
              </Pressable>
              <View style={[styles.actionItem, { marginLeft: 20 }]}>
                <Text style={{ color: '#888' }}>💬 {item.commentCount || 0}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chatSection: { flex: 1, backgroundColor: '#121212' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginVertical: 15, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 8, padding: 12, marginRight: 10 },
  sendButton: { backgroundColor: '#4CAF50', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8 },
  postCard: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 10, marginBottom: 12 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  postUser: { color: '#4CAF50', fontWeight: 'bold', fontSize: 14 },
  postDate: { color: '#666', fontSize: 11, marginTop: 2 },
  postText: { color: '#fff', fontSize: 16, lineHeight: 22 },
  actions: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  actionItem: { flexDirection: 'row', alignItems: 'center' },
});
