import admin from 'firebase-admin';

try {
  admin.initializeApp({
    projectId: 'taskflow-lab'
  });
} catch (e) {}

const db = admin.firestore();

async function promote() {
  const snapshot = await db.collection('users').where('staffId', '==', '1234').get();
  if (snapshot.empty) {
    console.log('User 1234 not found.');
    return;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.update(doc.ref, { role: 'Admin' });
    console.log(`Updating doc ${doc.id} to Admin...`);
  });

  await batch.commit();
  console.log('Update complete!');
  process.exit(0);
}

promote().catch(err => {
  console.error(err);
  process.exit(1);
});
