// Manual Data Migration Script
// Run this in the browser console (F12) to migrate your data

console.log('🔧 Starting manual data migration...');

// Get old multi-user data
const currentUser = localStorage.getItem('studyPlanner_currentUser');
const userData = localStorage.getItem('studyPlanner_userData');

console.log('Current User:', currentUser);

if (currentUser && userData) {
    try {
        const allUserData = JSON.parse(userData);
        console.log('All User Data:', allUserData);

        const userSpecificData = allUserData[currentUser];
        console.log('Your Data:', userSpecificData);

        if (userSpecificData) {
            // Migrate subjects
            if (userSpecificData.subjects) {
                localStorage.setItem('studyPlanner_subjects', JSON.stringify(userSpecificData.subjects));
                console.log('✅ Subjects migrated:', userSpecificData.subjects.length, 'items');
            }

            // Migrate schedules
            if (userSpecificData.schedules) {
                localStorage.setItem('studyPlanner_schedules', JSON.stringify(userSpecificData.schedules));
                console.log('✅ Schedules migrated:', userSpecificData.schedules.length, 'items');
            }

            // Migrate tasks
            if (userSpecificData.tasks) {
                localStorage.setItem('studyPlanner_tasks', JSON.stringify(userSpecificData.tasks));
                console.log('✅ Tasks migrated:', userSpecificData.tasks.length, 'items');
            }

            // Migrate settings
            if (userSpecificData.settings) {
                localStorage.setItem('studyPlanner_settings', JSON.stringify(userSpecificData.settings));
                console.log('✅ Settings migrated');
            }

            console.log('');
            console.log('✅✅ MIGRATION COMPLETE! ✅✅');
            console.log('Now refresh the page (F5) to see your data!');

        } else {
            console.error('❌ No data found for user:', currentUser);
        }
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
} else {
    console.log('ℹ️ No old data found to migrate');
    console.log('Current localStorage keys:', Object.keys(localStorage).filter(k => k.startsWith('studyPlanner')));
}
