

const AnalyticsManager = {
    // Initialize the analytics section
    init() {
        this.render();
    },

    // Render all analytics
    render() {
        this.renderOverallProgress();
        this.renderSubjectProgress();
        this.renderTaskChart();
        this.renderInsights();
    },

    // Render overall progress bar
    renderOverallProgress() {
        const tasks = Storage.getTasks();

        if (!tasks || tasks.length === 0) {
            document.getElementById('overallProgressBar').style.width = '0%';
            document.getElementById('overallProgressText').textContent = '0% Complete';
            return;
        }

        const completed = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        const percentage = Math.round((completed / total) * 100);

        document.getElementById('overallProgressBar').style.width = `${percentage}%`;
        document.getElementById('overallProgressText').textContent = `${percentage}% Complete (${completed}/${total} tasks)`;
    },

    // Render subject-wise progress
    renderSubjectProgress() {
        const container = document.getElementById('subjectProgress');
        const subjects = Storage.getSubjects();
        const tasks = Storage.getTasks();

        if (!subjects || subjects.length === 0 || !tasks || tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">No data available</p>';
            return;
        }

        const subjectStats = subjects.map(subject => {
            const subjectTasks = tasks.filter(t => t.subjectId === subject.id);
            const completed = subjectTasks.filter(t => t.completed).length;
            const total = subjectTasks.length;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            return {
                subject,
                completed,
                total,
                percentage
            };
        }).filter(stat => stat.total > 0); // Only show subjects with tasks

        if (subjectStats.length === 0) {
            container.innerHTML = '<p class="empty-state">No task data available</p>';
            return;
        }

        // Sort by percentage (descending)
        subjectStats.sort((a, b) => b.percentage - a.percentage);

        container.innerHTML = subjectStats.map(stat => `
            <div class="subject-progress-item">
                <div class="progress-label">${this.escapeHtml(stat.subject.name)}</div>
                <div class="progress-bar-small">
                    <div class="progress-fill" style="width: ${stat.percentage}%; background: ${stat.subject.color}"></div>
                </div>
                <div class="progress-value">${stat.percentage}%</div>
            </div>
        `).join('');
    },

    // Render task completion pie chart (using CSS conic-gradient)
    renderTaskChart() {
        const container = document.getElementById('taskChart');
        const tasks = Storage.getTasks();

        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">No tasks available</p>';
            return;
        }

        const completed = tasks.filter(t => t.completed).length;
        const pending = tasks.length - completed;
        const completedPercent = (completed / tasks.length) * 100;

        container.innerHTML = `
            <div style="text-align: center;">
                <div class="pie-chart" style="background: conic-gradient(
                    var(--primary-green) 0% ${completedPercent}%,
                    var(--primary-green-lightest) ${completedPercent}% 100%
                );">
                </div>
                <div class="chart-legend">
                    <div class="legend-item">
                        <div class="legend-color" style="background: var(--primary-green)"></div>
                        <span>Completed: ${completed} (${Math.round(completedPercent)}%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: var(--primary-green-lightest)"></div>
                        <span>Pending: ${pending} (${Math.round(100 - completedPercent)}%)</span>
                    </div>
                </div>
            </div>
        `;
    },

    // Render study insights
    renderInsights() {
        const container = document.getElementById('studyInsights');
        const subjects = Storage.getSubjects();
        const tasks = Storage.getTasks();
        const schedules = Storage.getSchedules();

        if (!subjects || subjects.length === 0 || !tasks || tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">Complete some tasks to see insights</p>';
            return;
        }

        const insights = [];

        // Most productive subject
        const subjectStats = subjects.map(subject => {
            const completed = tasks.filter(t => t.subjectId === subject.id && t.completed).length;
            return { subject, completed };
        });

        subjectStats.sort((a, b) => b.completed - a.completed);

        if (subjectStats[0] && subjectStats[0].completed > 0) {
            insights.push({
                title: '🏆 Most Productive Subject',
                description: `${subjectStats[0].subject.name} with ${subjectStats[0].completed} completed tasks`
            });
        }

        // Subject needing attention
        const needsAttention = subjectStats.find(stat => {
            const total = tasks.filter(t => t.subjectId === stat.subject.id).length;
            const completionRate = total > 0 ? (stat.completed / total) : 1;
            return completionRate < 0.5 && total > 0;
        });

        if (needsAttention) {
            const total = tasks.filter(t => t.subjectId === needsAttention.subject.id).length;
            const pending = total - needsAttention.completed;
            insights.push({
                title: '⚠️ Needs Attention',
                description: `${needsAttention.subject.name} has ${pending} pending tasks`
            });
        }

        // Most scheduled subject
        if (schedules && schedules.length > 0) {
            const scheduleStats = subjects.map(subject => {
                const count = schedules.filter(s => s.subjectId === subject.id).length;
                return { subject, count };
            });

            scheduleStats.sort((a, b) => b.count - a.count);

            if (scheduleStats[0] && scheduleStats[0].count > 0) {
                insights.push({
                    title: '📅 Most Scheduled',
                    description: `${scheduleStats[0].subject.name} with ${scheduleStats[0].count} time slots per week`
                });
            }
        }

        // Upcoming deadline count
        const upcomingDeadlines = tasks.filter(t => {
            if (t.completed) return false;
            const deadline = new Date(t.deadline);
            const now = new Date();
            const daysUntil = (deadline - now) / (1000 * 60 * 60 * 24);
            return daysUntil >= 0 && daysUntil <= 7;
        }).length;

        if (upcomingDeadlines > 0) {
            insights.push({
                title: '⏰ Upcoming This Week',
                description: `${upcomingDeadlines} task${upcomingDeadlines > 1 ? 's' : ''} due within 7 days`
            });
        }

        // Overall completion rate
        const completedTasks = tasks.filter(t => t.completed).length;
        const completionRate = Math.round((completedTasks / tasks.length) * 100);

        insights.push({
            title: '📈 Overall Progress',
            description: `${completionRate}% completion rate across all subjects`
        });

        if (insights.length === 0) {
            container.innerHTML = '<p class="empty-state">No insights available yet</p>';
            return;
        }

        container.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <h4>${insight.title}</h4>
                <p>${insight.description}</p>
            </div>
        `).join('');
    },

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Make it available globally
window.AnalyticsManager = AnalyticsManager;
