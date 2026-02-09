

const DashboardManager = {
    init() {
        this.render();
    },
    render() {
        this.renderStats();
        this.renderUpcomingDeadlines();
        this.renderTodaySchedule();
    },

    renderStats() {
        const subjects = Storage.getSubjects();
        const tasks = Storage.getTasks();

        document.getElementById('totalSubjects').textContent = subjects ? subjects.length : 0;

        if (!tasks || tasks.length === 0) {
            document.getElementById('completedTasks').textContent = '0';
            document.getElementById('pendingTasks').textContent = '0';
            document.getElementById('completionRate').textContent = '0%';
            return;
        }

        const completed = tasks.filter(t => t.completed).length;
        const pending = tasks.length - completed;
        const completionRate = Math.round((completed / tasks.length) * 100);

        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
    },

    renderUpcomingDeadlines() {
        const container = document.getElementById('upcomingDeadlines');
        const tasks = Storage.getTasks();

        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">No upcoming deadlines</p>';
            return;
        }

        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        let upcoming = tasks.filter(task => {
            if (task.completed) return false;
            const deadline = new Date(task.deadline);
            return deadline >= now && deadline <= sevenDaysLater;
        });

        if (upcoming.length === 0) {
            container.innerHTML = '<p class="empty-state">No deadlines in the next 7 days 🎉</p>';
            return;
        }

        upcoming.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        upcoming = upcoming.slice(0, 5);

        container.innerHTML = upcoming.map(task => {
            const subject = Storage.getSubjectById(task.subjectId);
            if (!subject) return '';

            const deadline = new Date(task.deadline);
            const hoursUntil = (deadline - now) / (1000 * 60 * 60);

            let itemClass = 'deadline-item';
            let badgeClass = 'badge-upcoming';

            if (hoursUntil < 24) {
                itemClass += ' urgent';
                badgeClass = 'badge-urgent';
            }

            return `
                <div class="${itemClass}">
                    <div class="deadline-info">
                        <h4>${this.escapeHtml(task.title)}</h4>
                        <p>${this.escapeHtml(subject.name)} • ${task.type}</p>
                    </div>
                    <span class="deadline-badge ${badgeClass}">
                        ${this.formatRelativeTime(task.deadline)}
                    </span>
                </div>
            `;
        }).join('');
    },

    renderTodaySchedule() {
        const container = document.getElementById('todaySchedule');
        const schedules = Storage.getSchedules();

        if (!schedules || schedules.length === 0) {
            container.innerHTML = '<p class="empty-state">No classes scheduled for today</p>';
            return;
        }

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];

        let todaySchedules = schedules.filter(s => s.day === today);

        if (todaySchedules.length === 0) {
            container.innerHTML = '<p class="empty-state">No classes scheduled for today</p>';
            return;
        }

        todaySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));

        container.innerHTML = todaySchedules.map(schedule => {
            const subject = Storage.getSubjectById(schedule.subjectId);
            if (!subject) return '';

            return `
                <div class="schedule-item" style="border-left-color: ${subject.color}">
                    <div class="deadline-info">
                        <h4>${this.escapeHtml(subject.name)}</h4>
                        <p>${this.formatTime(schedule.startTime)} - ${this.formatTime(schedule.endTime)}</p>
                    </div>
                </div>
            `;
        }).join('');
    },

    formatRelativeTime(deadline) {
        const date = new Date(deadline);
        const now = new Date();
        const diff = date - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes}m`;
        } else if (hours < 24) {
            return `${hours}h`;
        } else if (days === 1) {
            return 'Tomorrow';
        } else {
            return `${days}d`;
        }
    },

    formatTime(time) {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${displayHour}:${minutes} ${period}`;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};


window.DashboardManager = DashboardManager;
