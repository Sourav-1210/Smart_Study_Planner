/**
 * LocalStorage Management Module
 * Handles all data persistence operations using browser LocalStorage
 * Enhanced with multi-user support
 */

const Storage = {
    // Storage keys
    KEYS: {
        SUBJECTS: 'studyPlanner_subjects', // Legacy key
        SCHEDULES: 'studyPlanner_schedules', // Legacy key
        TASKS: 'studyPlanner_tasks', // Legacy key
        SETTINGS: 'studyPlanner_settings', // Legacy key
        USER_DATA: 'studyPlanner_userData', // New multi-user key
        CURRENT_USER: 'studyPlanner_currentUser'
    },

    // Initialize storage with default data if empty
    init() {
        // Migrate from old multi-user structure if needed
        this.migrateFromMultiUser();
    },

    // Migrate from old multi-user structure to simple single-user structure
    migrateFromMultiUser() {
        const currentUser = localStorage.getItem(this.KEYS.CURRENT_USER);
        const userData = localStorage.getItem(this.KEYS.USER_DATA);

        // Check if migration is needed
        if (currentUser && userData) {
            try {
                const allUserData = JSON.parse(userData);
                const userSpecificData = allUserData[currentUser];

                if (userSpecificData) {
                    // Migrate data to simple keys if they don't already exist
                    if (!localStorage.getItem(this.KEYS.SUBJECTS) && userSpecificData.subjects) {
                        localStorage.setItem(this.KEYS.SUBJECTS, JSON.stringify(userSpecificData.subjects));
                    }
                    if (!localStorage.getItem(this.KEYS.SCHEDULES) && userSpecificData.schedules) {
                        localStorage.setItem(this.KEYS.SCHEDULES, JSON.stringify(userSpecificData.schedules));
                    }
                    if (!localStorage.getItem(this.KEYS.TASKS) && userSpecificData.tasks) {
                        localStorage.setItem(this.KEYS.TASKS, JSON.stringify(userSpecificData.tasks));
                    }
                    if (!localStorage.getItem(this.KEYS.SETTINGS) && userSpecificData.settings) {
                        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(userSpecificData.settings));
                    }

                    console.log('✅ Data migrated from multi-user to single-user format');

                    // Optional: Clean up old keys after successful migration
                    // localStorage.removeItem(this.KEYS.USER_DATA);
                    // localStorage.removeItem(this.KEYS.CURRENT_USER);
                    // localStorage.removeItem('studyPlanner_users');
                }
            } catch (error) {
                console.error('Migration failed:', error);
            }
        }
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // ===== SUBJECTS =====
    getSubjects() {
        const data = localStorage.getItem(this.KEYS.SUBJECTS);
        return data ? JSON.parse(data) : [];
    },

    setSubjects(subjects) {
        localStorage.setItem(this.KEYS.SUBJECTS, JSON.stringify(subjects));
        this.updateBackupTime();
    },

    addSubject(subject) {
        const subjects = this.getSubjects();
        const newSubject = {
            id: this.generateId(),
            name: subject.name,
            priority: subject.priority,
            color: this.getRandomColor(),
            createdAt: new Date().toISOString()
        };
        subjects.push(newSubject);
        this.setSubjects(subjects);
        return newSubject;
    },

    updateSubject(id, updates) {
        const subjects = this.getSubjects();
        const index = subjects.findIndex(s => s.id === id);
        if (index !== -1) {
            subjects[index] = { ...subjects[index], ...updates };
            this.setSubjects(subjects);
            return subjects[index];
        }
        return null;
    },

    deleteSubject(id) {
        const subjects = this.getSubjects();
        const filtered = subjects.filter(s => s.id !== id);
        this.setSubjects(filtered);

        // Also delete related schedules and tasks
        this.deleteSchedulesBySubject(id);
        this.deleteTasksBySubject(id);

        return true;
    },

    getSubjectById(id) {
        const subjects = this.getSubjects();
        return subjects.find(s => s.id === id);
    },

    // Check for duplicate subject names
    isDuplicateSubject(name, excludeId = null) {
        const subjects = this.getSubjects();
        return subjects.some(s =>
            s.name.toLowerCase() === name.toLowerCase() &&
            s.id !== excludeId
        );
    },

    // ===== SCHEDULES =====
    getSchedules() {
        const data = localStorage.getItem(this.KEYS.SCHEDULES);
        return data ? JSON.parse(data) : [];
    },

    setSchedules(schedules) {
        localStorage.setItem(this.KEYS.SCHEDULES, JSON.stringify(schedules));
        this.updateBackupTime();
    },

    addSchedule(schedule) {
        const schedules = this.getSchedules();
        const newSchedule = {
            id: this.generateId(),
            subjectId: schedule.subjectId,
            day: schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            note: schedule.note || '',
            createdAt: new Date().toISOString()
        };
        schedules.push(newSchedule);
        this.setSchedules(schedules);
        return newSchedule;
    },

    updateSchedule(id, updates) {
        const schedules = this.getSchedules();
        const index = schedules.findIndex(s => s.id === id);
        if (index !== -1) {
            schedules[index] = { ...schedules[index], ...updates };
            this.setSchedules(schedules);
            return schedules[index];
        }
        return null;
    },

    getScheduleById(id) {
        const schedules = this.getSchedules();
        return schedules.find(s => s.id === id);
    },

    deleteSchedule(id) {
        const schedules = this.getSchedules();
        const filtered = schedules.filter(s => s.id !== id);
        this.setSchedules(filtered);
        return true;
    },

    deleteSchedulesBySubject(subjectId) {
        const schedules = this.getSchedules();
        const filtered = schedules.filter(s => s.subjectId !== subjectId);
        this.setSchedules(filtered);
    },

    // Check for schedule conflicts
    hasScheduleConflict(day, startTime, endTime, excludeId = null) {
        const schedules = this.getSchedules();

        // Convert time strings to minutes for easier comparison
        const toMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const newStart = toMinutes(startTime);
        const newEnd = toMinutes(endTime);

        return schedules.some(schedule => {
            if (schedule.id === excludeId) return false;
            if (schedule.day !== day) return false;

            const existingStart = toMinutes(schedule.startTime);
            const existingEnd = toMinutes(schedule.endTime);

            // Check if time ranges overlap
            return (newStart < existingEnd && newEnd > existingStart);
        });
    },

    getConflictingSchedule(day, startTime, endTime) {
        const schedules = this.getSchedules();

        const toMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const newStart = toMinutes(startTime);
        const newEnd = toMinutes(endTime);

        return schedules.find(schedule => {
            if (schedule.day !== day) return false;

            const existingStart = toMinutes(schedule.startTime);
            const existingEnd = toMinutes(schedule.endTime);

            return (newStart < existingEnd && newEnd > existingStart);
        });
    },

    // ===== TASKS =====
    getTasks() {
        const data = localStorage.getItem(this.KEYS.TASKS);
        return data ? JSON.parse(data) : [];
    },

    setTasks(tasks) {
        localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
        this.updateBackupTime();
    },

    addTask(task) {
        const tasks = this.getTasks();
        const newTask = {
            id: this.generateId(),
            subjectId: task.subjectId,
            title: task.title,
            type: task.type,
            deadline: task.deadline,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        this.setTasks(tasks);
        return newTask;
    },

    updateTask(id, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            this.setTasks(tasks);
            return tasks[index];
        }
        return null;
    },

    toggleTaskComplete(id) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.setTasks(tasks);
            return task;
        }
        return null;
    },

    deleteTask(id) {
        const tasks = this.getTasks();
        const filtered = tasks.filter(t => t.id !== id);
        this.setTasks(filtered);
        return true;
    },

    deleteTasksBySubject(subjectId) {
        const tasks = this.getTasks();
        const filtered = tasks.filter(t => t.subjectId !== subjectId);
        this.setTasks(filtered);
    },

    // ===== SETTINGS =====
    getSettings() {
        const data = localStorage.getItem(this.KEYS.SETTINGS);
        return data ? JSON.parse(data) : { theme: 'light', lastBackup: null };
    },

    setSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    updateSettings(updates) {
        const settings = this.getSettings();
        const newSettings = { ...settings, ...updates };
        this.setSettings(newSettings);
        return newSettings;
    },

    updateBackupTime() {
        const settings = this.getSettings();
        settings.lastBackup = new Date().toISOString();
        this.setSettings(settings);
    },

    // ===== DATA MANAGEMENT =====
    exportData() {
        const data = {
            subjects: this.getSubjects(),
            schedules: this.getSchedules(),
            tasks: this.getTasks(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.subjects) this.setSubjects(data.subjects);
            if (data.schedules) this.setSchedules(data.schedules);
            if (data.tasks) this.setTasks(data.tasks);
            if (data.settings) this.setSettings(data.settings);
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    },

    resetAllData() {
        this.setSubjects([]);
        this.setSchedules([]);
        this.setTasks([]);
        this.setSettings({
            theme: 'light',
            lastBackup: null
        });
        return true;
    },

    // ===== UTILITY =====
    getRandomColor() {
        const colors = [
            '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
            '#f59e0b', '#ef4444', '#14b8a6', '#6366f1'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};

// Initialize storage on load
Storage.init();

