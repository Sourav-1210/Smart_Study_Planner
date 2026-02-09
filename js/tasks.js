

const TasksManager = {
    currentFilter: 'all', 

    init() {
        this.bindEvents();
        this.updateSubjectDropdown();
        this.render();
    },

    bindEvents() {
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('closeTaskModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelTask').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    },

    updateSubjectDropdown() {
        const select = document.getElementById('taskSubject');
        const subjects = Storage.getSubjects();

        select.innerHTML = '<option value="">Select a subject</option>';

        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            select.appendChild(option);
        });
    },

    setFilter(filter) {
        this.currentFilter = filter;

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.render();
    },

    openModal() {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');

        form.reset();

        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('taskDeadline').min = now.toISOString().slice(0, 16);

        modal.classList.add('show');
    },

    closeModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.remove('show');
    },

    handleSubmit() {
        const subjectId = document.getElementById('taskSubject').value;
        const title = document.getElementById('taskTitle').value.trim();
        const type = document.getElementById('taskType').value;
        const deadline = document.getElementById('taskDeadline').value;

        if (!subjectId || !title || !type || !deadline) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        Storage.addTask({ subjectId, title, type, deadline });
        showToast('Task added successfully', 'success');

        this.closeModal();
        this.render();
        if (window.DashboardManager) DashboardManager.render();
        if (window.AnalyticsManager) AnalyticsManager.render();
    },

    toggleComplete(taskId) {
        Storage.toggleTaskComplete(taskId);
        this.render();
        if (window.DashboardManager) DashboardManager.render();
        if (window.AnalyticsManager) AnalyticsManager.render();
    },

    deleteTask(taskId) {
        showConfirmation(
            'Are you sure you want to delete this task?',
            () => {
                Storage.deleteTask(taskId);
                showToast('Task deleted successfully', 'success');
                this.render();
                if (window.DashboardManager) DashboardManager.render();
                if (window.AnalyticsManager) AnalyticsManager.render();
            }
        );
    },

    render() {
        const container = document.getElementById('tasksList');
        let tasks = Storage.getTasks();

        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">No tasks yet. Click "Add Task" to create one!</p>';
            return;
        }

        if (this.currentFilter === 'pending') {
            tasks = tasks.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            tasks = tasks.filter(t => t.completed);
        }

        if (tasks.length === 0) {
            container.innerHTML = `<p class="empty-state">No ${this.currentFilter} tasks</p>`;
            return;
        }

        tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        container.innerHTML = tasks.map(task => this.renderTask(task)).join('');
    },

    renderTask(task) {
        const subject = Storage.getSubjectById(task.subjectId);
        if (!subject) return '';

        const deadline = new Date(task.deadline);
        const now = new Date();
        const hoursUntil = (deadline - now) / (1000 * 60 * 60);

        let deadlineBadge = '';
        if (!task.completed) {
            if (hoursUntil < 0) {
                deadlineBadge = '<span class="deadline-badge badge-overdue">Overdue</span>';
            } else if (hoursUntil < 24) {
                deadlineBadge = '<span class="deadline-badge badge-urgent">Due Soon</span>';
            } else {
                deadlineBadge = '<span class="deadline-badge badge-upcoming">Upcoming</span>';
            }
        }

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="TasksManager.toggleComplete('${task.id}')"
                >
                <div class="task-content">
                    <div class="task-header">
                        <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                        <span class="task-type">${task.type}</span>
                        ${deadlineBadge}
                    </div>
                    <div class="task-meta">
                        <span class="task-subject">📚 ${this.escapeHtml(subject.name)}</span>
                        <span class="task-deadline">📅 ${this.formatDeadline(task.deadline)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="icon-btn delete" onclick="TasksManager.deleteTask('${task.id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    },

    formatDeadline(deadline) {
        const date = new Date(deadline);
        const now = new Date();
        const diff = date - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const options = {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        };
        const formatted = date.toLocaleDateString('en-US', options);

        if (diff < 0) {
            return `${formatted} (Overdue)`;
        } else if (days === 0 && hours < 24) {
            return `${formatted} (${hours}h left)`;
        } else if (days < 7) {
            return `${formatted} (${days}d left)`;
        }

        return formatted;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};


window.TasksManager = TasksManager;
