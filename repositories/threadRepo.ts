import { auth, db } from '@/lib/firebase';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
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
    reportedBy: [], // Initialize reported list
    reportCount: 0,
    commentCount: 0
  });
};

export const deletePost = async (postId: string) => {
  if (!auth.currentUser) return;
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
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

export const addComment = async (postId: string, text: string, userName: string, uid: string) => {
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

export const reportPost = async (postId: string, reporterUid: string, reason: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) throw new Error("Post not found");

    const postData = postSnap.data();
    const authorUid = postData.uid;

    // 1. Update the Post: Hide from reporter and increment count
    await updateDoc(postRef, {
      reportedBy: arrayUnion(reporterUid),
      reportCount: increment(1),
      lastReportReason: reason
    });

    // 2. Penalty Logic for the Author
    const userRef = doc(db, 'users', authorUid); 
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentPostReports = (postData.reportCount || 0) + 1;

      // If this specific post hits 2 reports, trigger a ban
      if (currentPostReports === 2) {
        const softBanCount = (userData.softBanCount || 0) + 1;
        
        let banUntil: number;
        
        if (softBanCount >= 3) {
          // PERMANENT BAN: Revoked forever (set to a date far in the future)
          banUntil = 9999999999999; 
        } else {
          // SOFT BAN: 3 Days (3 days * 24h * 60m * 60s * 1000ms)
          const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
          banUntil = Date.now() + THREE_DAYS_MS;
        }

        await updateDoc(userRef, {
          banUntil: banUntil,
          softBanCount: softBanCount,
          isFlagged: true,
          updatedAt: Date.now()
        });
      }
    }
  } catch (error) {
    console.error("reportPost Repo Error:", error);
    throw error;
  }
};
