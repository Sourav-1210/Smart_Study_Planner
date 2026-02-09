
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

    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newConfirmBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

const App = {
    currentSection: 'dashboard',

    init() {
        console.log('Initializing Smart Study Planner...');

        Storage.init();

        SubjectsManager.init();
        ScheduleManager.init();
        TasksManager.init();
        AnalyticsManager.init();
        DashboardManager.init();
        SettingsManager.init();

        this.setupNavigation();

        this.setupMobileMenu();

        this.showSection('dashboard');

        console.log('Smart Study Planner ready!');
    },

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);

                document.getElementById('sidebar').classList.remove('show');
            });
        });
    },

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

        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        });
    },

    showSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionName);
        });

        this.refreshSection(sectionName);
    },

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

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
