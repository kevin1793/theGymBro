import { auth, db } from '@/lib/firebase';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc // Add this
  ,



  doc,
  getDoc,
  increment,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

export const createPost = async (text: string, userName: string) => {
  const user = auth.currentUser; 
  if (!user) return;

  await addDoc(collection(db, 'posts'), {
    text,
    uid: user.uid,
    userName,
    createdAt: serverTimestamp(),
    likes: [],
    commentCount: 0 // Initialize to 0
  });
};

// 🔥 ADD THIS FUNCTION
export const deletePost = async (postId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
    console.log("Post deleted successfully");
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};

export const toggleLike = async (postId: string, isLiked: boolean) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likes: isLiked ? arrayRemove(uid) : arrayUnion(uid)
  });
};

export const addComment = async (postId: string, text: string, userName: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const commentsRef = collection(db, 'posts', postId, 'comments');
  await addDoc(commentsRef, {
    text,
    uid,
    userName,
    createdAt: serverTimestamp(),
  });

  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    commentCount: increment(1)
  });
};

export const reportPost = async (postId: string, postText: string, authorUid: string) => {
  const reporterUid = auth.currentUser?.uid;
  if (!reporterUid || !authorUid) return;

  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  const postData = postSnap.data();

  // Check if current user already reported this post
  if (postData?.reportedBy?.includes(reporterUid)) {
    throw new Error("ALREADY_REPORTED");
  }

  // 1. Log report & Update post
  await updateDoc(postRef, {
    reportCount: increment(1),
    reportedBy: arrayUnion(reporterUid) // Track the reporter
  });

  // 2. Log to separate reports collection (optional but good for history)
  await addDoc(collection(db, 'reports'), {
    postId,
    reportedBy: reporterUid,
    createdAt: serverTimestamp(),
  });

  // 3. Ban Logic
  const userRef = doc(db, 'users', authorUid);
  const banUntil = Date.now() + (24 * 60 * 60 * 1000);
  await updateDoc(userRef, { banUntil, isFlagged: true });
};
