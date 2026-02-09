

const ScheduleManager = {
    currentView: 'daily', 
    editingScheduleId: null, 

    init() {
        this.bindEvents();
        this.updateSubjectDropdown();
        this.render();
    },

    
    bindEvents() {
        document.getElementById('dailyViewBtn').addEventListener('click', () => {
            this.switchView('daily');
        });

        document.getElementById('weeklyViewBtn').addEventListener('click', () => {
            this.switchView('weekly');
        });

        document.getElementById('addScheduleBtn').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('closeScheduleModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelSchedule').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('scheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        document.getElementById('scheduleStart').addEventListener('change', () => {
            this.validateTimes();
        });

        document.getElementById('scheduleEnd').addEventListener('change', () => {
            this.validateTimes();
        });

        document.getElementById('scheduleDay').addEventListener('change', () => {
            this.validateTimes();
        });
    },

    switchView(view) {
        this.currentView = view;

        document.getElementById('dailyViewBtn').classList.toggle('active', view === 'daily');
        document.getElementById('weeklyViewBtn').classList.toggle('active', view === 'weekly');

        this.render();
    },

    updateSubjectDropdown() {
        const select = document.getElementById('scheduleSubject');
        const subjects = Storage.getSubjects();

        select.innerHTML = '<option value="">Select a subject</option>';

        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            select.appendChild(option);
        });
    },

    
    validateTimes() {
        const day = document.getElementById('scheduleDay').value;
        const startTime = document.getElementById('scheduleStart').value;
        const endTime = document.getElementById('scheduleEnd').value;
        const warning = document.getElementById('scheduleConflictWarning');

        if (!day || !startTime || !endTime) {
            warning.style.display = 'none';
            return;
        }

        if (endTime <= startTime) {
            warning.textContent = '⚠️ End time must be after start time!';
            warning.style.display = 'block';
            return;
        }

        const excludeId = this.editingScheduleId;
        const hasConflict = Storage.hasScheduleConflict(day, startTime, endTime, excludeId);

        if (hasConflict) {
            const conflicting = Storage.getConflictingSchedule(day, startTime, endTime);
            if (conflicting && conflicting.id !== excludeId) {
                const subject = Storage.getSubjectById(conflicting.subjectId);
                warning.textContent = `⚠️ Time conflict detected with ${subject.name} (${conflicting.startTime} - ${conflicting.endTime})`;
                warning.style.display = 'block';
            } else {
                warning.style.display = 'none';
            }
        } else {
            warning.style.display = 'none';
        }
    },

    openModal(scheduleId = null) {
        const modal = document.getElementById('scheduleModal');
        const form = document.getElementById('scheduleForm');
        const modalTitle = document.getElementById('scheduleModalTitle');
        const submitBtn = document.getElementById('scheduleSubmitBtn');

        form.reset();
        document.getElementById('scheduleConflictWarning').style.display = 'none';
        this.editingScheduleId = scheduleId;

        if (scheduleId) {
            const schedule = Storage.getScheduleById(scheduleId);
            if (schedule) {
                modalTitle.textContent = 'Edit Time Slot';
                submitBtn.textContent = 'Save Changes';
                document.getElementById('scheduleId').value = schedule.id;
                document.getElementById('scheduleSubject').value = schedule.subjectId;
                document.getElementById('scheduleDay').value = schedule.day;
                document.getElementById('scheduleStart').value = schedule.startTime;
                document.getElementById('scheduleEnd').value = schedule.endTime;
                document.getElementById('scheduleNote').value = schedule.note || '';
            }
        } else {
            modalTitle.textContent = 'Add Time Slot';
            submitBtn.textContent = 'Add Time Slot';

            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const today = days[new Date().getDay()];
            document.getElementById('scheduleDay').value = today;
        }

        modal.classList.add('show');
    },

    closeModal() {
        const modal = document.getElementById('scheduleModal');
        modal.classList.remove('show');
        this.editingScheduleId = null;
    },

    handleSubmit() {
        const scheduleId = document.getElementById('scheduleId').value;
        const subjectId = document.getElementById('scheduleSubject').value;
        const day = document.getElementById('scheduleDay').value;
        const startTime = document.getElementById('scheduleStart').value;
        const endTime = document.getElementById('scheduleEnd').value;
        const note = document.getElementById('scheduleNote').value.trim();

        if (!subjectId || !day || !startTime || !endTime) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (endTime <= startTime) {
            showToast('End time must be after start time', 'error');
            return;
        }

        const excludeId = scheduleId || null;
        if (Storage.hasScheduleConflict(day, startTime, endTime, excludeId)) {
            showToast('Time slot conflicts with existing schedule', 'error');
            return;
        }

        if (scheduleId) {
            Storage.updateSchedule(scheduleId, { subjectId, day, startTime, endTime, note });
            showToast('Time slot updated successfully', 'success');
        } else {
            Storage.addSchedule({ subjectId, day, startTime, endTime, note });
            showToast('Time slot added successfully', 'success');
        }

        this.closeModal();
        this.render();
        if (window.DashboardManager) DashboardManager.renderTodaySchedule();
    },

    editSchedule(scheduleId) {
        this.openModal(scheduleId);
    },

    deleteSchedule(scheduleId) {
        showConfirmation(
            'Are you sure you want to delete this time slot?',
            () => {
                Storage.deleteSchedule(scheduleId);
                showToast('Time slot deleted successfully', 'success');
                this.render();
                if (window.DashboardManager) DashboardManager.renderTodaySchedule();
            }
        );
    },

    render() {
        const container = document.getElementById('scheduleView');
        const schedules = Storage.getSchedules();

        if (!schedules || schedules.length === 0) {
            container.innerHTML = '<p class="empty-state">No schedule created yet. Click "Add Time Slot" to get started!</p>';
            return;
        }

        if (this.currentView === 'daily') {
            this.renderDailyView(container, schedules);
        } else {
            this.renderWeeklyView(container, schedules);
        }
    },

    renderDailyView(container, schedules) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];

        const todaySchedules = schedules.filter(s => s.day === today);

        if (todaySchedules.length === 0) {
            container.innerHTML = `<p class="empty-state">No classes scheduled for today (${today.charAt(0).toUpperCase() + today.slice(1)})</p>`;
            return;
        }

        todaySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));

        container.innerHTML = `
            <div class="schedule-day">
                <h3 class="day-header">${today.charAt(0).toUpperCase() + today.slice(1)}</h3>
                <div class="time-slots">
                    ${todaySchedules.map(schedule => this.renderTimeSlot(schedule)).join('')}
                </div>
            </div>
        `;
    },

    renderWeeklyView(container, schedules) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        container.innerHTML = `
            <div class="schedule-grid">
                ${days.map(day => {
            const daySchedules = schedules.filter(s => s.day === day);
            daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));

            return `
                        <div class="schedule-day">
                            <h3 class="day-header">${day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                            <div class="time-slots">
                                ${daySchedules.length > 0
                    ? daySchedules.map(schedule => this.renderTimeSlot(schedule)).join('')
                    : '<p class="text-muted" style="padding: 1rem;">No classes</p>'
                }
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    renderTimeSlot(schedule) {
        const subject = Storage.getSubjectById(schedule.subjectId);
        if (!subject) return '';

        const noteHtml = schedule.note ? `<p class="slot-note">📝 ${this.escapeHtml(schedule.note)}</p>` : '';

        return `
            <div class="time-slot" style="border-left-color: ${subject.color}">
                <div class="slot-info">
                    <h4>${this.escapeHtml(subject.name)}</h4>
                    <p class="slot-time">⏰ ${this.formatTime(schedule.startTime)} - ${this.formatTime(schedule.endTime)}</p>
                    ${noteHtml}
                </div>
                <div class="slot-actions">
                    <button class="icon-btn edit" onclick="ScheduleManager.editSchedule('${schedule.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="icon-btn delete" onclick="ScheduleManager.deleteSchedule('${schedule.id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `;
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

window.ScheduleManager = ScheduleManager;
