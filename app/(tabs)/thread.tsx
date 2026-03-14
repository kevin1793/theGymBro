import { AppModal } from '@/components/AppModal';
import { useReport } from '@/hooks/useReport';
import { useShake } from '@/hooks/useShake';
import { auth, db } from '@/lib/firebase';
import { createPost, deletePost, toggleLike } from '@/repositories/threadRepo';
import { getUser } from '@/repositories/usersRepo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import {
  collection, doc, getDoc,
  getDocs,
  limit,
  onSnapshot, orderBy,
  query,
  startAfter,
  updateDoc
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList, Pressable, RefreshControl, StyleSheet,
  Text, TextInput, View
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GlobalChat() {
  const { animatedStyle, triggerShake } = useShake();
  const router = useRouter();
  const { 
    reportModalVisible, 
    setReportModalVisible, 
    openReportModal, 
    submitReport, 
    ReasonPicker 
  } = useReport();

  // --- STATE ---
  const [inputText, setInputText] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [username, setUsername] = useState<string>('Gym Member');
  const [refreshing, setRefreshing] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  
  // Pagination State
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // --- MODAL STATES ---
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [banMessage, setBanMessage] = useState('');

  // --- ACCOUNT-BASED WELCOME LOGIC ---
  useEffect(() => {
    const checkWelcome = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && !userDoc.data().hasSeenChatWelcome) {
        setWelcomeVisible(true);
      }
    };
    checkWelcome();
  }, []);

  const handleDismissWelcome = async () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, 'users', uid), { hasSeenChatWelcome: true });
    }
    setWelcomeVisible(false);
  };

  // --- FETCH USERNAME ---
  useEffect(() => {
    const fetchUser = async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const user = await getUser(uid);
        if (user?.username) setUsername(user.username);
      }
    };
    fetchUser();
  }, []);

  // --- INITIAL FEED LOAD (Top 10) ---
  useEffect(() => {
    const q = query(
      collection(db, 'posts'), 
      orderBy('createdAt', 'desc'),
      limit(10) 
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uid = auth.currentUser?.uid;
      if (snapshot.empty) {
        setPosts([]);
        setHasMore(false);
        return;
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Filter out reported posts and strictly show 5 for initial view
      const cleanPosts = allPosts.filter(post => !post.reportedBy?.includes(uid));
      setPosts(cleanPosts.slice(0, 5));
      setHasMore(allPosts.length === 10);
    });
    return () => unsubscribe();
  }, []);

  // --- INFINITE SCROLL LOGIC ---
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore || !lastVisible) return;

    setLoadingMore(true);
    const uid = auth.currentUser?.uid;

    try {
      const nextQ = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(10)
      );

      const snapshot = await getDocs(nextQ);
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const filtered = newPosts.filter(post => !post.reportedBy?.includes(uid));
        
        setPosts(prev => [...prev, ...filtered]);
        setHasMore(snapshot.docs.length === 10);
      }
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSendPost = async () => {
    if (!inputText.trim()) {
      triggerShake(); 
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();

      if (userData?.banUntil && userData.banUntil > Date.now()) {
        setBanMessage(`You are banned until: \n${new Date(userData.banUntil).toLocaleString()}`);
        setBanModalVisible(true);
        return;
      }

      await createPost(inputText, userData?.username || username);
      setInputText('');
    } catch (error) {
      console.error("Post Error:", error);
    }
  };

  const showOptions = (post: any) => {
    const uid = auth.currentUser?.uid;
    if (post.uid === uid) {
      setDeleteTargetId(post.id);
      setDeleteModalVisible(true);
    } else {
      openReportModal(post.id);
    }
  };

  const formatPostDate = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.chatSection}>
      <AppModal visible={welcomeVisible} title="Community Guidelines" confirmText="I Understand" onClose={handleDismissWelcome} onConfirm={handleDismissWelcome}>
        <View style={{ alignItems: 'center' }}>
          <MaterialIcons name="security" size={40} color="#4CAF50" style={{ marginBottom: 15 }} />
          <Text style={styles.welcomeText}>Welcome! Let's keep this space <Text style={{ fontWeight: 'bold', color: '#fff' }}>safe and encouraging</Text>.</Text>
          <Text style={styles.welcomeSubText}>• Be supportive{"\n"}• No harassment{"\n"}• Stay positive</Text>
        </View>
      </AppModal>

      <AppModal visible={reportModalVisible} title="Report Post" variant="danger" confirmText="Submit" onClose={() => setReportModalVisible(false)} onConfirm={submitReport}><ReasonPicker /></AppModal>
      
      <AppModal 
        visible={deleteModalVisible} 
        title="Delete post?" 
        variant="danger" 
        onClose={() => setDeleteModalVisible(false)} 
        onConfirm={async () => {
          if (deleteTargetId) await deletePost(deleteTargetId);
          setDeleteModalVisible(false);
        }}
      />

      <AppModal visible={banModalVisible} title="Restricted" variant="danger" onConfirm={() => setBanModalVisible(false)} onClose={() => setBanModalVisible(false)}>
        <Text style={{ color: '#ccc', textAlign: 'center' }}>{banMessage}</Text>
      </AppModal>

      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.sectionTitle}>Community Feed</Text>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Share your PR..." placeholderTextColor="#888" value={inputText} onChangeText={setInputText} />
          <Animated.View style={[styles.sendButtonContainer, animatedStyle]}>
            <Pressable style={styles.sendButton} onPress={handleSendPost}>
              <Text style={styles.sendButtonText}>Post</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />}
        ListFooterComponent={() => loadingMore ? <ActivityIndicator size="small" color="#4CAF50" style={{ marginVertical: 20 }} /> : null}
        renderItem={({ item }) => (
          <Pressable style={styles.postCard} onPress={() => router.push({ pathname: `/thread/${item.id}`, params: { ...item } })}>
            <View style={styles.postHeader}>
              <View>
                <Text style={styles.postUser}>{item.userName} {item.uid === auth.currentUser?.uid && <Text style={{ color: '#888', fontWeight: '400' }}>(You)</Text>}</Text>
                <Text style={styles.postDate}>{formatPostDate(item.createdAt)}</Text>
              </View>
              <Pressable onPress={() => showOptions(item)} style={{ padding: 5 }}><MaterialIcons name="more-horiz" size={24} color="#888" /></Pressable>
            </View>
            <Text style={styles.postText}>{item.text}</Text>
            <View style={styles.actions}>
              <Pressable onPress={() => toggleLike(item.id, item.likes?.includes(auth.currentUser?.uid))}>
                <Text style={{ color: '#4CAF50' }}>{item.likes?.includes(auth.currentUser?.uid) ? '❤️' : '👍'} {item.likes?.length || 0}</Text>
              </Pressable>
              <Text style={{ color: '#888', marginLeft: 20 }}>💬 {item.commentCount || 0}</Text>
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
  inputContainer: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 8, padding: 12, marginRight: 10 },
  sendButtonContainer: { justifyContent: 'center' },
  sendButton: { backgroundColor: '#4CAF50', height: 35, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8 },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
  postCard: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 10, marginBottom: 12 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  postUser: { color: '#4CAF50', fontWeight: 'bold', fontSize: 14 },
  postDate: { color: '#666', fontSize: 11 },
  postText: { color: '#fff', fontSize: 16, lineHeight: 22 },
  actions: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  welcomeText: { color: '#ccc', textAlign: 'center', fontSize: 15, lineHeight: 22 },
  welcomeSubText: { color: '#888', fontSize: 13, marginTop: 15, lineHeight: 20 },
});
