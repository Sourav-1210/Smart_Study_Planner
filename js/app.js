/**
 * Main Application Controller
 * Handles navigation, initialization, and global utilities
 */

// Global utility functions
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showConfirmation(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const messageElement = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');

    messageElement.textContent = message;
    modal.classList.add('show');

    // Remove previous event listeners by cloning
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Add new event listeners
    newConfirmBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// Main App
const App = {
    currentSection: 'dashboard',

    // Initialize application
    init() {
        console.log('Initializing Smart Study Planner...');

        // Initialize storage
        Storage.init();

        // Initialize all modules
        SubjectsManager.init();
        ScheduleManager.init();
        TasksManager.init();
        AnalyticsManager.init();
        DashboardManager.init();
        SettingsManager.init();

        // Setup navigation
        this.setupNavigation();

        // Setup mobile menu
        this.setupMobileMenu();

        // Show initial section
        this.showSection('dashboard');

        console.log('Smart Study Planner ready!');
    },

    // Setup navigation
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);

                // Close mobile menu if open
                document.getElementById('sidebar').classList.remove('show');
            });
        });
    },

    // Setup mobile menu
    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const closeSidebar = document.getElementById('closeSidebar');

        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('show');
        });

        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('show');
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        });
    },

    // Show specific section
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
        }

        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionName);
        });

        // Refresh section data if needed
        this.refreshSection(sectionName);
    },

    // Refresh section data
    refreshSection(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                DashboardManager.render();
                break;
            case 'subjects':
                SubjectsManager.render();
                break;
            case 'schedule':
                ScheduleManager.render();
                break;
            case 'tasks':
                TasksManager.render();
                break;
            case 'analytics':
                AnalyticsManager.render();
                break;
            case 'settings':
                SettingsManager.updateLastBackup();
                break;
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Expose App globally for debugging
window.App = App;
