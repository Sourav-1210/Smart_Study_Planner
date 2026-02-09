

const SettingsManager = {
    init() {
        this.bindEvents();
        this.applyTheme();
        this.updateLastBackup();
    },

    bindEvents() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTheme(e.target.dataset.theme);
            });
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });
        document.getElementById('resetDataBtn').addEventListener('click', () => {
            this.confirmReset();
        });
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });

        Storage.updateSettings({ theme });

        showToast(`${theme === 'light' ? '☀️ Light' : '🌙 Dark'} theme activated`, 'success');
    },

    applyTheme() {
        const settings = Storage.getSettings();
        const theme = settings ? settings.theme : 'light';

        document.documentElement.setAttribute('data-theme', theme);

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    },

    updateLastBackup() {
        const settings = Storage.getSettings();
        const lastBackup = settings && settings.lastBackup;

        const element = document.getElementById('lastBackup');

        if (lastBackup) {
            const date = new Date(lastBackup);
            const formatted = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
            element.textContent = `Last backup: ${formatted}`;
        } else {
            element.textContent = 'Last backup: Never';
        }
    },

    exportData() {
        try {
            const jsonData = Storage.exportData();

            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            a.download = `study-planner-backup-${timestamp}.json`;

            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            showToast('Failed to export data', 'error');
        }
    },

    confirmReset() {
        showConfirmation(
            'Are you sure you want to reset all data? This action cannot be undone. All subjects, schedules, tasks, and settings will be permanently deleted.',
            () => {
                this.resetData();
            }
        );
    },

    resetData() {
        Storage.resetAllData();

        this.applyTheme();

        if (window.SubjectsManager) SubjectsManager.render();
        if (window.ScheduleManager) ScheduleManager.render();
        if (window.TasksManager) TasksManager.render();
        if (window.AnalyticsManager) AnalyticsManager.render();
        if (window.DashboardManager) DashboardManager.render();

        this.updateLastBackup();

        showToast('All data has been reset', 'success');
    }
};


window.SettingsManager = SettingsManager;
