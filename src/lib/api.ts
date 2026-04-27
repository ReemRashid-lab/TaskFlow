import { db, auth } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, getAuth } from 'firebase/auth';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { sendTaskAssignmentEmail } from './email';

// Helper for Admin to create users without logging out
const getSecondaryAuth = () => {
  const secondaryAppName = 'SecondaryAuthApp';
  let secondaryApp;
  if (getApps().some(app => app.name === secondaryAppName)) {
    secondaryApp = getApp(secondaryAppName);
  } else {
    // We need the config from firebase.ts. Since it's not exported, we'll re-define it here or export it there.
    // For now, I'll assume we can use the same config.
    const firebaseConfig = {
      apiKey: "AIzaSyCCd3di38JT8i1CYoa7XmkXnY-tvTq7tRg",
      authDomain: "taskflow-lab.firebaseapp.com",
      projectId: "taskflow-lab",
      storageBucket: "taskflow-lab.firebasestorage.app",
      messagingSenderId: "163720611809",
      appId: "1:163720611809:web:84a72c32e64e98afa0b4a0",
    };
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }
  return getAuth(secondaryApp);
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const method = options.method || 'GET';
  let body: any = {};
  if (options.body && typeof options.body === 'string') {
    body = JSON.parse(options.body);
  }

  // --- /tasks ---
  if (endpoint === '/tasks' || endpoint.startsWith('/tasks/')) {
    if (method === 'GET') {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.data()?.role;

      let q;
      if (role === 'Staff') {
        q = query(collection(db, 'tasks'), where('assignedTo', '==', user.uid));
      } else {
        q = query(collection(db, 'tasks'));
      }
      
      const snapshot = await getDocs(q);
      let allTasks = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any[];
      
      // Populate staffName
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap: any = {};
      usersSnap.docs.forEach(d => { usersMap[d.id] = d.data(); });
      
      allTasks = allTasks.map(t => ({
        ...t,
        staffName: usersMap[t.assignedTo]?.name || 'Unknown',
        staffIdStr: usersMap[t.assignedTo]?.staffId || 'Unknown',
      }));

      return allTasks;
    }

    if (method === 'POST') {
      // Find highest refNo to auto-increment
      const tasksSnap = await getDocs(collection(db, 'tasks'));
      let maxRef = 1000;
      tasksSnap.docs.forEach(d => {
        const data = d.data();
        if (data.refNo) {
          const num = parseInt(data.refNo, 10);
          if (!isNaN(num) && num > maxRef) {
            maxRef = num;
          }
        }
      });
      const nextRefNo = (maxRef + 1).toString();

      const taskId = doc(collection(db, 'tasks')).id;
      const newTask = {
        taskId,
        ...body,
        refNo: nextRefNo,
        status: 'Pending',
        managerId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'tasks', taskId), newTask);

      // Send Email Notification
      try {
        const assigneeDoc = await getDoc(doc(db, 'users', body.assignedTo));
        if (assigneeDoc.exists()) {
          const assigneeData = assigneeDoc.data();
          await sendTaskAssignmentEmail({
            assignee_name: assigneeData.name,
            to_email: assigneeData.email,
            task_title: body.title,
            task_priority: body.priority,
            task_due_date: body.deadline,
            task_description: body.description || 'No description provided',
          });
        }
      } catch (emailError) {
        console.error('Error sending task assignment email:', emailError);
        // We don't throw here to avoid failing the task creation if email fails
      }

      return { id: taskId, refNo: nextRefNo };
    }

    if (method === 'PUT') {
      const taskId = endpoint.split('/')[2];
      await updateDoc(doc(db, 'tasks', taskId), {
        ...body,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    }

    if (method === 'DELETE') {
      const taskId = endpoint.split('/')[2];
      await deleteDoc(doc(db, 'tasks', taskId));
      return { success: true };
    }
  }

  // --- /users ---
  if (endpoint === '/users' || endpoint.startsWith('/users/')) {
    if (method === 'GET') {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    if (method === 'POST') {
      const { email, password, name, staffId, role } = body;
      const targetEmail = email || `${staffId.toLowerCase().replace(/\s+/g, '_')}@taskflow.local`;
      
      try {
        const secondaryAuth = getSecondaryAuth();
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, targetEmail, password);
        const newUserId = userCred.user.uid;
        
        // Sign out from secondary auth immediately so it doesn't interfere
        await signOut(secondaryAuth);

        const newUser = {
          userId: newUserId,
          staffId: staffId,
          name: name,
          role: role,
          email: targetEmail,
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', newUserId), newUser);
        return { id: newUserId, ...newUser };
      } catch (err: any) {
        console.error("Error creating user:", err);
        throw err;
      }
    }

    if (method === 'PUT') {
      const userId = endpoint.split('/')[2];
      await updateDoc(doc(db, 'users', userId), {
        ...body,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    }

    if (method === 'DELETE') {
      const deleteId = endpoint.split('/')[2];
      await deleteDoc(doc(db, 'users', deleteId));
      return { success: true };
    }
  }

  throw new Error('Endpoint not handled by Firebase mock');
};

