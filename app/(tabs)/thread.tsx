import { AppModal } from '@/components/AppModal'; // Import your custom modal
import { auth, db } from '@/lib/firebase';
import { createPost, deletePost, reportPost, toggleLike } from '@/repositories/threadRepo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GlobalChat({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [posts, setPosts] = useState<any[]>([]);

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
  const [refreshing, setRefreshing] = useState(false);

  // Function called when user pulls down
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Since we use onSnapshot, the data stays in sync, 
      // but "refreshing" gives the user visual feedback.
      // We can just add a small delay to simulate a reload.
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  }, []);

  // --- REPO ACTIONS ---
  const showOptions = (post: any) => {
    const isMyPost = post.uid === auth.currentUser?.uid;

    if (isMyPost) {
      openModal(
        "Delete this post forever?",
        async () => {
          await deletePost(post.id);
          setModalVisible(false);
        },
        'danger',
        'Delete'
      );
    } else {
      openModal(
        "Report this post for inappropriate content?",
        async () => {
          await reportPost(post.id, post.text, "User Flagged from Feed");
          setModalVisible(false);
        },
        'success',
        'Report'
      );
    }
  };

  // --- FEED LOGIC ---
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleSendPost = async () => {
    if (inputText.trim()) {
      await createPost(inputText, firstName || 'Gym Member');
      setInputText('');
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

      {/* Header and Input stay outside the list or in ListHeaderComponent */}
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
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#4CAF50" // iOS Spinner Color
            colors={["#4CAF50"]} // Android Spinner Color
          />
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
                <Text style={styles.postUser}>{item.userName}</Text>
                <Text style={styles.postDate}>{formatPostDate(item.createdAt)}</Text>
              </View>
              <Pressable onPress={(e) => { e.stopPropagation(); showOptions(item); }}>
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
  chatSection: { marginTop: 10 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 15,textAlign:'center' },
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
