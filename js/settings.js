/**
 * Settings Module
 * Handles theme management, data export/import, and reset functionality
 */

const SettingsManager = {
    // Initialize settings
    init() {
        this.bindEvents();
        this.applyTheme();
        this.updateLastBackup();
    },

    // Bind event listeners
    bindEvents() {
        // Theme toggle buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTheme(e.target.dataset.theme);
            });
        });

        // Export data button
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Reset data button
        document.getElementById('resetDataBtn').addEventListener('click', () => {
            this.confirmReset();
        });
    },

    // Set theme
    setTheme(theme) {
        // Update data attribute
        document.documentElement.setAttribute('data-theme', theme);

        // Update button states
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });

        // Save to storage
        Storage.updateSettings({ theme });

        showToast(`${theme === 'light' ? '☀️ Light' : '🌙 Dark'} theme activated`, 'success');
    },

    // Apply saved theme
    applyTheme() {
        const settings = Storage.getSettings();
        const theme = settings ? settings.theme : 'light';

        document.documentElement.setAttribute('data-theme', theme);

        // Update button states
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    },

    // Update last backup display
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

    // Export data as JSON
    exportData() {
        try {
            const jsonData = Storage.exportData();

            // Create blob and download link
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create temporary link and trigger download
            const a = document.createElement('a');
            a.href = url;

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            a.download = `study-planner-backup-${timestamp}.json`;

            document.body.appendChild(a);
            a.click();

            // Cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            showToast('Failed to export data', 'error');
        }
    },

    // Confirm reset
    confirmReset() {
        showConfirmation(
            'Are you sure you want to reset all data? This action cannot be undone. All subjects, schedules, tasks, and settings will be permanently deleted.',
            () => {
                this.resetData();
            }
        );
    },

    // Reset all data
    resetData() {
        Storage.resetAllData();

        // Reapply default theme
        this.applyTheme();

        // Re-render all sections
        if (window.SubjectsManager) SubjectsManager.render();
        if (window.ScheduleManager) ScheduleManager.render();
        if (window.TasksManager) TasksManager.render();
        if (window.AnalyticsManager) AnalyticsManager.render();
        if (window.DashboardManager) DashboardManager.render();

        this.updateLastBackup();

        showToast('All data has been reset', 'success');
    }
};

// Make it available globally
window.SettingsManager = SettingsManager;
