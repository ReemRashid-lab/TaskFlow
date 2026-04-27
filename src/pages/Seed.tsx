import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, writeBatch, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Seed() {
  const [status, setStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSeed = async () => {
    setStatus('seeding');
    setError('');

    const user = auth.currentUser;
    if (!user) {
      setStatus('error');
      setError('You must be logged in to seed data for your account. Please register/login first.');
      return;
    }

    try {
      // 0. Update user role if they are the special Admin IDs but were registered as Staff
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.staffId === '1234' || userData.staffId === 'ADMIN001') {
          await updateDoc(userRef, { role: 'Admin' });
        }
      }

      const batch = writeBatch(db);

      // 1. Mock Tasks for the CURRENT user
      const tasks = [
        {
          taskId: 'task-sample-1',
          refNo: 'TASK-2026-001',
          title: 'Quarterly Financial Report',
          description: 'Analyze the Q1 spending and prepare the summary for the board meeting.',
          deadline: '2026-05-15',
          priority: 'High',
          status: 'In Progress',
          assignedTo: user.uid,
          managerId: 'system-manager',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          taskId: 'task-sample-2',
          refNo: 'TASK-2026-002',
          title: 'Infrastructure Maintenance',
          description: 'Routine checkup of the cloud server instances and database performance.',
          deadline: '2026-06-01',
          priority: 'Medium',
          status: 'Pending',
          assignedTo: user.uid,
          managerId: 'system-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      tasks.forEach(t => {
        batch.set(doc(db, 'tasks', t.taskId), t);
      });

      // 2. Mock Notifications for the CURRENT user
      const notifications = [
        {
          notificationId: 'notif-sample-1',
          userId: user.uid,
          message: 'New task assigned: Quarterly Financial Report',
          read: false,
          createdAt: new Date().toISOString()
        }
      ];

      notifications.forEach(n => {
        batch.set(doc(db, 'notifications', n.notificationId), n);
      });

      await batch.commit();
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setError(err.message || 'Unknown error occurred during seeding');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9] p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-[#1e293b] mb-4">Demo Seeding & Setup</h1>
        <p className="text-[#64748b] mb-8">
          This will assign mock tasks to your account and finalize your Admin permissions if you registered as 1234.
        </p>

        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">
            {error}
          </div>
        )}

        {status === 'success' ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm border border-green-100">
              Setup complete! Please Log Out and Log In again to see your Admin dashboard.
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-2 bg-[#3b82f6] text-white rounded-md font-semibold"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <button
            onClick={handleSeed}
            disabled={status === 'seeding'}
            className="w-full py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-md font-bold transition-colors disabled:opacity-50"
          >
            {status === 'seeding' ? 'Finalizing Setup...' : 'Finalize Setup & Add Sample Data'}
          </button>
        )}
      </div>
    </div>
  );
}
