

const SubjectsManager = {
    init() {
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('addSubjectBtn').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('closeSubjectModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelSubject').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('subjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        document.getElementById('subjectModal').addEventListener('click', (e) => {
            if (e.target.id === 'subjectModal') {
                this.closeModal();
            }
        });
    },

    openModal(subjectId = null) {
        const modal = document.getElementById('subjectModal');
        const form = document.getElementById('subjectForm');
        const title = document.getElementById('subjectModalTitle');

        form.reset();

        if (subjectId) {
            const subject = Storage.getSubjectById(subjectId);
            if (subject) {
                title.textContent = 'Edit Subject';
                document.getElementById('subjectId').value = subject.id;
                document.getElementById('subjectName').value = subject.name;
                document.getElementById('subjectPriority').value = subject.priority;
            }
        } else {
            title.textContent = 'Add Subject';
            document.getElementById('subjectId').value = '';
        }

        modal.classList.add('show');
    },

    closeModal() {
        const modal = document.getElementById('subjectModal');
        modal.classList.remove('show');
    },

    handleSubmit() {
        const subjectId = document.getElementById('subjectId').value;
        const name = document.getElementById('subjectName').value.trim();
        const priority = document.getElementById('subjectPriority').value;

        if (!name) {
            showToast('Please enter a subject name', 'error');
            return;
        }

        if (Storage.isDuplicateSubject(name, subjectId)) {
            showToast('A subject with this name already exists', 'error');
            return;
        }

        if (subjectId) {
            Storage.updateSubject(subjectId, { name, priority });
            showToast('Subject updated successfully', 'success');
        } else {
            Storage.addSubject({ name, priority });
            showToast('Subject added successfully', 'success');
        }

        this.closeModal();
        this.render();

        if (window.ScheduleManager) ScheduleManager.updateSubjectDropdown();
        if (window.TasksManager) TasksManager.updateSubjectDropdown();
        if (window.DashboardManager) DashboardManager.render();
    },

    render() {
        const container = document.getElementById('subjectsList');
        const subjects = Storage.getSubjects();

        if (!subjects || subjects.length === 0) {
            container.innerHTML = '<p class="empty-state">No subjects added yet. Click "Add Subject" to get started!</p>';
            return;
        }

        container.innerHTML = subjects.map(subject => `
            <div class="subject-card priority-${subject.priority}">
                <div class="subject-header">
                    <h3 class="subject-name">${this.escapeHtml(subject.name)}</h3>
                    <span class="priority-badge ${subject.priority}">${subject.priority}</span>
                </div>
                <div class="subject-actions">
                    <button class="icon-btn" onclick="SubjectsManager.openModal('${subject.id}')">
                        ✏️ Edit
                    </button>
                    <button class="icon-btn delete" onclick="SubjectsManager.confirmDelete('${subject.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    },

    confirmDelete(subjectId) {
        const subject = Storage.getSubjectById(subjectId);
        if (!subject) return;

        showConfirmation(
            `Are you sure you want to delete "${subject.name}"? This will also delete all related schedules and tasks.`,
            () => {
                Storage.deleteSubject(subjectId);
                showToast('Subject deleted successfully', 'success');
                this.render();

                if (window.ScheduleManager) {
                    ScheduleManager.updateSubjectDropdown();
                    ScheduleManager.render();
                }
                if (window.TasksManager) {
                    TasksManager.updateSubjectDropdown();
                    TasksManager.render();
                }
                if (window.DashboardManager) DashboardManager.render();
                if (window.AnalyticsManager) AnalyticsManager.render();
            }
        );
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

window.SubjectsManager = SubjectsManager;
