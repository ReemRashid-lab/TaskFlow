import admin from 'firebase-admin';

// IMPORTANT: This script assumes you have default credentials set up 
// or are running in an environment where firebase-admin can authenticate.
try {
  admin.initializeApp({
    projectId: 'taskflow-lab'
  });
} catch (e) {
  // If already initialized
}

const db = admin.firestore();

async function seed() {
  console.log('Starting seeding...');

  try {
    // 1. Create Users
    const users = [
      {
        userId: 'admin-user-id',
        staffId: 'ADMIN001',
        name: 'System Admin',
        role: 'Admin',
        email: 'ilifekidstab7@gmail.com', // Recognized as Admin in rules
        createdAt: new Date().toISOString()
      },
      {
        userId: 'manager-user-id',
        staffId: 'MGR001',
        name: 'Alice Manager',
        role: 'Manager',
        email: 'alice@taskflow.local',
        createdAt: new Date().toISOString()
      },
      {
        userId: 'staff-user-id-1',
        staffId: 'STF001',
        name: 'Bob Staff',
        role: 'Staff',
        email: 'bob@taskflow.local',
        createdAt: new Date().toISOString()
      },
      {
        userId: 'staff-user-id-2',
        staffId: 'STF002',
        name: 'Charlie Staff',
        role: 'Staff',
        email: 'charlie@taskflow.local',
        createdAt: new Date().toISOString()
      }
    ];

    for (const user of users) {
      await db.collection('users').doc(user.userId).set(user);
      console.log(`User ${user.staffId} seeded.`);
    }

    // 2. Create Tasks
    const tasks = [
      {
        taskId: 'task-1',
        refNo: 'TASK-2026-001',
        title: 'Complete Project Documentation',
        description: 'Prepare the final technical documentation for the TaskFlow project.',
        deadline: '2026-05-15',
        priority: 'High',
        status: 'In Progress',
        assignedTo: 'staff-user-id-1',
        managerId: 'manager-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        taskId: 'task-2',
        refNo: 'TASK-2026-002',
        title: 'Review System Logs',
        description: 'Check periodic logs for any security anomalies.',
        deadline: '2026-05-01',
        priority: 'Medium',
        status: 'Pending',
        assignedTo: 'staff-user-id-2',
        managerId: 'manager-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        taskId: 'task-3',
        refNo: 'TASK-2026-003',
        title: 'Database Optimization',
        description: 'Optimize Firestore indexes and check query performance.',
        deadline: '2026-05-10',
        priority: 'Low',
        status: 'Needs Resubmission',
        assignedTo: 'staff-user-id-1',
        managerId: 'admin-user-id',
        managerNotes: 'Please check the slow queries on the staff list.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const task of tasks) {
      await db.collection('tasks').doc(task.taskId).set(task);
      console.log(`Task ${task.refNo} seeded.`);
    }

    // 3. Create Notifications
    const notifications = [
      {
        notificationId: 'notif-1',
        userId: 'staff-user-id-1',
        message: 'New task assigned: Complete Project Documentation',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        notificationId: 'notif-2',
        userId: 'staff-user-id-1',
        message: 'Task TASK-2026-003 needs resubmission',
        read: true,
        createdAt: new Date().toISOString()
      }
    ];

    for (const notif of notifications) {
      await db.collection('notifications').doc(notif.notificationId).set(notif);
      console.log(`Notification for ${notif.userId} seeded.`);
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    console.log('\n--- Troubleshooting ---');
    console.log('This script requires a service account key or environment credentials.');
    console.log('If it failed, please go to Firebase Console -> Project Settings -> Service Accounts');
    console.log('Generate a new private key and set GOOGLE_APPLICATION_CREDENTIALS to the path of that file.');
    process.exit(1);
  }
}

seed();
