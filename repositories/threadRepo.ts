import { auth, db } from '@/lib/firebase';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

export const createPost = async (text: string, userName: string) => {
  // auth is now the instance exported from your util
  const user = auth.currentUser; 
  
  if (!user) {
    console.error("User is not authenticated");
    return;
  }

  await addDoc(collection(db, 'posts'), {
    text,
    uid: user.uid,
    userName,
    createdAt: serverTimestamp(),
    likes: [],
  });
};

export const toggleLike = async (postId: string, isLiked: boolean) => {
  console.log('toggleLike',postId,isLiked)
  const uid = auth.currentUser?.uid;
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likes: isLiked ? arrayRemove(uid) : arrayUnion(uid)
  });
};

export const addComment = async (postId: string, text: string, userName: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  // 1. Add the comment to the sub-collection
  const commentsRef = collection(db, 'posts', postId, 'comments');
  await addDoc(commentsRef, {
    text,
    uid,
    userName,
    createdAt: serverTimestamp(),
  });

  // 2. Increment the comment count on the main post
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    commentCount: increment(1)
  });
};

const loadComments = (postId: string) => {
  if (expandedPostId === postId) {
    setExpandedPostId(null); // Toggle off
    return;
  }

  setExpandedPostId(postId);

  // Listen to the comments sub-collection for this specific post
  const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  onSnapshot(q, (snapshot) => {
    const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setComments(prev => ({ ...prev, [postId]: commentsData }));
  });
};

export const reportPost = async (postId: string, postText: string, reason: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  await addDoc(collection(db, 'reports'), {
    postId,
    postText,
    reportedBy: uid,
    reason,
    status: 'pending', // You can filter by this in your admin view
    createdAt: serverTimestamp(),
  });
};