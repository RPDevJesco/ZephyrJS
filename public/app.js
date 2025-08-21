/**
 * Zephyr Blueprint Showcase Application
 * Demonstrates DOM-as-state architecture with real business logic
 */

// Data storage and persistence
class DataManager {
    constructor() {
        this.storageKey = 'zephyr-showcase-data';
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        // Load existing data
        this.data = this.load();

        // Setup auto-save
        this.enableAutoSave();
    }

    load() {
        try {
            const stored = sessionStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : this.getDefaultData();
        } catch (e) {
            console.warn('Failed to load data, using defaults');
            return this.getDefaultData();
        }
    }

    save() {
        try {
            sessionStorage.setItem(this.storageKey, JSON.stringify(this.data));
            this.dispatchEvent('data-saved');
        } catch (e) {
            console.error('Failed to save data:', e);
        }
    }

    getDefaultData() {
        return {
            projects: [],
            tasks: [],
            team: [],
            settings: {
                theme: 'light',
                notifications: true,
                autoSave: true,
                defaultPriority: 'medium'
            },
            activity: []
        };
    }

    enableAutoSave() {
        const autoSaveEnabled = document.getElementById('auto-save-enabled')?.hasAttribute('checked') ?? true;

        if (autoSaveEnabled && !this.autoSaveInterval) {
            this.autoSaveInterval = setInterval(() => {
                this.save();
            }, 30000); // Save every 30 seconds
        }
    }

    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    clear() {
        this.data = this.getDefaultData();
        this.save();
        this.dispatchEvent('data-cleared');
    }

    export() {
        return JSON.stringify(this.data, null, 2);
    }

    import(jsonData) {
        try {
            this.data = JSON.parse(jsonData);
            this.save();
            this.dispatchEvent('data-imported');
            return true;
        } catch (e) {
            console.error('Failed to import data:', e);
            return false;
        }
    }

    dispatchEvent(type) {
        document.dispatchEvent(new CustomEvent(type, {
            detail: { data: this.data }
        }));
    }
}

// Project management
class ProjectManager {
    constructor(dataManager) {
        this.data = dataManager;
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.bindEvents();
    }

    bindEvents() {
        // New project button
        document.getElementById('new-project-btn')?.addEventListener('button-click', () => {
            this.openNewProjectDialog();
        });

        document.getElementById('quick-new-project')?.addEventListener('button-click', () => {
            this.openNewProjectDialog();
        });

        // Project filter and search
        document.getElementById('project-filter')?.addEventListener('select-change', (e) => {
            this.currentFilter = e.detail.value;
            this.renderProjects();
        });

        document.getElementById('project-search')?.addEventListener('input-change', (e) => {
            this.currentSearch = e.detail.value;
            this.renderProjects();
        });

        // Listen for data changes
        document.addEventListener('data-saved', () => {
            this.renderProjects();
            this.updateStats();
        });
    }

    openNewProjectDialog() {
        const dialog = document.getElementById('new-project-dialog');
        const form = document.getElementById('project-form');

        // Reset form
        form.querySelectorAll('x-input, x-textarea, x-select').forEach(field => {
            field.setAttr('value', field.id === 'project-status' ? 'active' : '');
            field.removeAttribute('error');
        });

        // Add action buttons
        dialog.clearActions();

        const cancelBtn = document.createElement('x-button');
        cancelBtn.setAttr('label', 'Cancel');
        cancelBtn.addEventListener('button-click', () => dialog.close());

        const createBtn = document.createElement('x-button');
        createBtn.setAttr('label', 'Create Project');
        createBtn.setAttr('variant', 'primary');
        createBtn.addEventListener('button-click', () => {
            if (this.validateAndCreateProject()) {
                dialog.close();
            }
        });

        dialog.addAction(cancelBtn);
        dialog.addAction(createBtn);
        dialog.open();
    }

    validateAndCreateProject() {
        const form = document.getElementById('project-form');
        const fieldset = form.querySelector('x-fieldset');

        if (!fieldset.validate()) {
            return false;
        }

        const projectData = fieldset.getFieldsetValue();
        this.createProject({
            id: Date.now().toString(),
            name: projectData['project-name'],
            description: projectData['project-description'],
            status: projectData['project-status'],
            deadline: projectData['project-deadline'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return true;
    }

    createProject(project) {
        this.data.data.projects.push(project);
        this.data.save();

        // Log activity
        this.logActivity(`Created project "${project.name}"`);

        // Update UI
        this.renderProjects();
        this.updateProjectSelects();
    }

    updateProject(id, updates) {
        const project = this.data.data.projects.find(p => p.id === id);
        if (project) {
            Object.assign(project, updates, { updatedAt: new Date().toISOString() });
            this.data.save();
            this.logActivity(`Updated project "${project.name}"`);
        }
    }

    deleteProject(id) {
        const projectIndex = this.data.data.projects.findIndex(p => p.id === id);
        if (projectIndex !== -1) {
            const project = this.data.data.projects[projectIndex];
            this.data.data.projects.splice(projectIndex, 1);

            // Also delete related tasks
            this.data.data.tasks = this.data.data.tasks.filter(t => t.projectId !== id);

            this.data.save();
            this.logActivity(`Deleted project "${project.name}"`);
            this.renderProjects();
            this.updateProjectSelects();
        }
    }

    renderProjects() {
        const container = document.getElementById('projects-list');
        const projects = this.getFilteredProjects();

        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h4>No projects found</h4>
                    <p>Try adjusting your filters or create a new project</p>
                </div>
            `;
            return;
        }

        container.innerHTML = projects.map(project => this.renderProjectCard(project)).join('');

        // Bind project card events
        projects.forEach(project => {
            this.bindProjectCardEvents(project.id);
        });
    }

    renderProjectCard(project) {
        const taskCount = this.data.data.tasks.filter(t => t.projectId === project.id).length;
        const completedTasks = this.data.data.tasks.filter(t => t.projectId === project.id && t.status === 'completed').length;
        const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

        const statusBadge = {
            active: { class: 'status-active', text: 'Active' },
            'on-hold': { class: 'status-hold', text: 'On Hold' },
            completed: { class: 'status-completed', text: 'Completed' }
        }[project.status];

        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-header">
                    <h4>${project.name}</h4>
                    <div class="project-actions">
                        <x-button data-action="edit" data-project-id="${project.id}" label="Edit"></x-button>
                        <x-button data-action="delete" data-project-id="${project.id}" label="Delete"></x-button>
                    </div>
                </div>
                <div class="project-meta">
                    <span class="status-badge ${statusBadge.class}">${statusBadge.text}</span>
                    ${project.deadline ? `<span class="deadline">Due: ${new Date(project.deadline).toLocaleDateString()}</span>` : ''}
                </div>
                <p class="project-description">${project.description || 'No description'}</p>
                <div class="project-stats">
                    <div class="stat">
                        <span class="stat-number">${taskCount}</span>
                        <span class="stat-label">Tasks</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${completedTasks}</span>
                        <span class="stat-label">Completed</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${progress}%</span>
                        <span class="stat-label">Progress</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
    }

    bindProjectCardEvents(projectId) {
        const card = document.querySelector(`[data-project-id="${projectId}"]`);
        if (!card) return;

        // Edit button
        const editBtn = card.querySelector('[data-action="edit"]');
        editBtn?.addEventListener('button-click', () => {
            this.editProject(projectId);
        });

        // Delete button
        const deleteBtn = card.querySelector('[data-action="delete"]');
        deleteBtn?.addEventListener('button-click', () => {
            this.confirmDeleteProject(projectId);
        });
    }

    editProject(id) {
        // Similar to new project dialog but pre-filled
        const project = this.data.data.projects.find(p => p.id === id);
        if (!project) return;

        this.openNewProjectDialog();

        // Pre-fill form
        setTimeout(() => {
            document.getElementById('project-name').setAttr('value', project.name);
            document.getElementById('project-description').setAttr('value', project.description || '');
            document.getElementById('project-status').setAttr('value', project.status);
            document.getElementById('project-deadline').setAttr('value', project.deadline || '');
        }, 100);
    }

    confirmDeleteProject(id) {
        const project = this.data.data.projects.find(p => p.id === id);
        if (!project) return;

        if (confirm(`Are you sure you want to delete "${project.name}"? This will also delete all related tasks.`)) {
            this.deleteProject(id);
        }
    }

    getFilteredProjects() {
        let projects = this.data.data.projects;

        // Filter by status
        if (this.currentFilter !== 'all') {
            projects = projects.filter(p => p.status === this.currentFilter);
        }

        // Filter by search
        if (this.currentSearch) {
            const search = this.currentSearch.toLowerCase();
            projects = projects.filter(p =>
                p.name.toLowerCase().includes(search) ||
                (p.description && p.description.toLowerCase().includes(search))
            );
        }

        return projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    updateProjectSelects() {
        const selects = ['task-project', 'task-project-filter'];
        const projects = this.data.data.projects.map(p => ({
            value: p.id,
            label: p.name
        }));

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const options = selectId === 'task-project-filter'
                    ? [{ value: 'all', label: 'All Projects' }, ...projects]
                    : projects;
                select.setAttr('options', JSON.stringify(options));
            }
        });
    }

    updateStats() {
        const stats = {
            total: this.data.data.projects.length,
            active: this.data.data.projects.filter(p => p.status === 'active').length,
            completed: this.data.data.projects.filter(p => p.status === 'completed').length,
            onHold: this.data.data.projects.filter(p => p.status === 'on-hold').length
        };

        document.getElementById('total-projects').textContent = stats.total;
    }

    logActivity(message) {
        this.data.data.activity.unshift({
            id: Date.now(),
            message,
            timestamp: new Date().toISOString(),
            type: 'project'
        });

        // Keep only last 50 activities
        if (this.data.data.activity.length > 50) {
            this.data.data.activity = this.data.data.activity.slice(0, 50);
        }
    }
}

// Task management
class TaskManager {
    constructor(dataManager) {
        this.data = dataManager;
        this.currentFilters = {
            project: 'all',
            status: 'all',
            priority: 'all'
        };
        this.bindEvents();
    }

    bindEvents() {
        // New task button
        document.getElementById('new-task-btn')?.addEventListener('button-click', () => {
            this.openNewTaskDialog();
        });

        document.getElementById('quick-new-task')?.addEventListener('button-click', () => {
            this.openNewTaskDialog();
        });

        // Task filters
        ['task-project-filter', 'task-status-filter', 'task-priority-filter'].forEach(filterId => {
            document.getElementById(filterId)?.addEventListener('select-change', (e) => {
                const filterType = filterId.replace('task-', '').replace('-filter', '');
                this.currentFilters[filterType] = e.detail.value;
                this.renderTasks();
            });
        });

        // Listen for data changes
        document.addEventListener('data-saved', () => {
            this.renderTasks();
            this.updateStats();
        });
    }

    openNewTaskDialog() {
        const dialog = document.getElementById('new-task-dialog');
        const form = document.getElementById('task-form');

        // Reset form
        form.querySelectorAll('x-input, x-textarea, x-select').forEach(field => {
            const defaultValues = {
                'task-priority': 'medium',
                'task-status': 'todo'
            };
            field.setAttr('value', defaultValues[field.id] || '');
            field.removeAttribute('error');
        });

        // Update project options
        this.updateTaskProjectSelect();

        // Add action buttons
        dialog.clearActions();

        const cancelBtn = document.createElement('x-button');
        cancelBtn.setAttr('label', 'Cancel');
        cancelBtn.addEventListener('button-click', () => dialog.close());

        const createBtn = document.createElement('x-button');
        createBtn.setAttr('label', 'Create Task');
        createBtn.setAttr('variant', 'primary');
        createBtn.addEventListener('button-click', () => {
            if (this.validateAndCreateTask()) {
                dialog.close();
            }
        });

        dialog.addAction(cancelBtn);
        dialog.addAction(createBtn);
        dialog.open();
    }

    validateAndCreateTask() {
        const form = document.getElementById('task-form');
        const fieldset = form.querySelector('x-fieldset');

        if (!fieldset.validate()) {
            return false;
        }

        const taskData = fieldset.getFieldsetValue();
        this.createTask({
            id: Date.now().toString(),
            title: taskData['task-title'],
            description: taskData['task-description'],
            projectId: taskData['task-project'],
            priority: taskData['task-priority'],
            status: taskData['task-status'],
            dueDate: taskData['task-due-date'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return true;
    }

    createTask(task) {
        this.data.data.tasks.push(task);
        this.data.save();

        // Log activity
        const project = this.data.data.projects.find(p => p.id === task.projectId);
        this.logActivity(`Created task "${task.title}" in ${project?.name || 'Unknown Project'}`);

        // Update UI
        this.renderTasks();
    }

    updateTask(id, updates) {
        const task = this.data.data.tasks.find(t => t.id === id);
        if (task) {
            const oldStatus = task.status;
            Object.assign(task, updates, { updatedAt: new Date().toISOString() });

            if (oldStatus !== task.status) {
                this.logActivity(`Moved task "${task.title}" to ${task.status.replace('-', ' ')}`);
            }

            this.data.save();
        }
    }

    deleteTask(id) {
        const taskIndex = this.data.data.tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            const task = this.data.data.tasks[taskIndex];
            this.data.data.tasks.splice(taskIndex, 1);
            this.data.save();
            this.logActivity(`Deleted task "${task.title}"`);
            this.renderTasks();
        }
    }

    renderTasks() {
        const tasks = this.getFilteredTasks();

        // Group tasks by status
        const tasksByStatus = {
            'todo': tasks.filter(t => t.status === 'todo'),
            'in-progress': tasks.filter(t => t.status === 'in-progress'),
            'completed': tasks.filter(t => t.status === 'completed')
        };

        // Render each column
        Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
            this.renderTaskColumn(status, statusTasks);
        });
    }

    renderTaskColumn(status, tasks) {
        const container = document.getElementById(`${status}-tasks`);
        if (!container) return;

        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-column">Drop tasks here</div>';
            return;
        }

        container.innerHTML = tasks.map(task => this.renderTaskCard(task)).join('');

        // Bind task card events
        tasks.forEach(task => {
            this.bindTaskCardEvents(task.id);
        });
    }

    renderTaskCard(task) {
        const project = this.data.data.projects.find(p => p.id === task.projectId);
        const priorityColors = {
            high: 'priority-high',
            medium: 'priority-medium',
            low: 'priority-low'
        };

        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

        return `
            <div class="task-card ${isOverdue ? 'task-overdue' : ''}" data-task-id="${task.id}" draggable="true">
                <div class="task-header">
                    <h5>${task.title}</h5>
                    <div class="task-actions">
                        <x-button data-action="edit" data-task-id="${task.id}" label="✏️"></x-button>
                        <x-button data-action="delete" data-task-id="${task.id}" label="🗑️"></x-button>
                    </div>
                </div>
                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                <div class="task-meta">
                    <span class="task-project">${project?.name || 'No Project'}</span>
                    <span class="task-priority ${priorityColors[task.priority]}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                </div>
                ${task.dueDate ? `<div class="task-due-date ${isOverdue ? 'overdue' : ''}">Due: ${new Date(task.dueDate).toLocaleDateString()}</div>` : ''}
            </div>
        `;
    }

    bindTaskCardEvents(taskId) {
        const card = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!card) return;

        // Edit button
        const editBtn = card.querySelector('[data-action="edit"]');
        editBtn?.addEventListener('button-click', () => {
            this.editTask(taskId);
        });

        // Delete button
        const deleteBtn = card.querySelector('[data-action="delete"]');
        deleteBtn?.addEventListener('button-click', () => {
            this.confirmDeleteTask(taskId);
        });

        // Drag and drop
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', taskId);
        });

        // Add drop zones
        document.querySelectorAll('.task-list').forEach(list => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                list.classList.add('drag-over');
            });

            list.addEventListener('dragleave', () => {
                list.classList.remove('drag-over');
            });

            list.addEventListener('drop', (e) => {
                e.preventDefault();
                list.classList.remove('drag-over');

                const draggedTaskId = e.dataTransfer.getData('text/plain');
                const newStatus = list.dataset.status;

                if (draggedTaskId && newStatus) {
                    this.updateTask(draggedTaskId, { status: newStatus });
                    this.renderTasks();
                }
            });
        });
    }

    editTask(id) {
        // Similar to new task dialog but pre-filled
        const task = this.data.data.tasks.find(t => t.id === id);
        if (!task) return;

        this.openNewTaskDialog();

        // Pre-fill form
        setTimeout(() => {
            document.getElementById('task-title').setAttr('value', task.title);
            document.getElementById('task-description').setAttr('value', task.description || '');
            document.getElementById('task-project').setAttr('value', task.projectId);
            document.getElementById('task-priority').setAttr('value', task.priority);
            document.getElementById('task-status').setAttr('value', task.status);
            document.getElementById('task-due-date').setAttr('value', task.dueDate || '');
        }, 100);
    }

    confirmDeleteTask(id) {
        const task = this.data.data.tasks.find(t => t.id === id);
        if (!task) return;

        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
            this.deleteTask(id);
        }
    }

    getFilteredTasks() {
        let tasks = this.data.data.tasks;

        // Filter by project
        if (this.currentFilters.project !== 'all') {
            tasks = tasks.filter(t => t.projectId === this.currentFilters.project);
        }

        // Filter by status
        if (this.currentFilters.status !== 'all') {
            tasks = tasks.filter(t => t.status === this.currentFilters.status);
        }

        // Filter by priority
        if (this.currentFilters.priority !== 'all') {
            tasks = tasks.filter(t => t.priority === this.currentFilters.priority);
        }

        return tasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    updateTaskProjectSelect() {
        const select = document.getElementById('task-project');
        if (!select) return;

        const projects = this.data.data.projects.map(p => ({
            value: p.id,
            label: p.name
        }));

        select.setAttr('options', JSON.stringify(projects));
    }

    updateStats() {
        const tasks = this.data.data.tasks;
        const stats = {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'completed').length,
            overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length
        };

        document.getElementById('total-tasks').textContent = stats.total;
        document.getElementById('completed-tasks').textContent = stats.completed;
        document.getElementById('overdue-tasks').textContent = stats.overdue;
    }

    logActivity(message) {
        this.data.data.activity.unshift({
            id: Date.now(),
            message,
            timestamp: new Date().toISOString(),
            type: 'task'
        });

        // Keep only last 50 activities
        if (this.data.data.activity.length > 50) {
            this.data.data.activity = this.data.data.activity.slice(0, 50);
        }
    }
}

// Team management
class TeamManager {
    constructor(dataManager) {
        this.data = dataManager;
        this.bindEvents();
    }

    bindEvents() {
        // New member button
        document.getElementById('new-member-btn')?.addEventListener('button-click', () => {
            this.openNewMemberDialog();
        });

        // Listen for data changes
        document.addEventListener('data-saved', () => {
            this.renderTeam();
        });
    }

    openNewMemberDialog() {
        const dialog = document.getElementById('new-member-dialog');
        const form = document.getElementById('member-form');

        // Reset form
        form.querySelectorAll('x-input, x-select').forEach(field => {
            field.setAttr('value', field.id === 'member-role' ? 'developer' : '');
            field.removeAttribute('error');
        });

        // Add action buttons
        dialog.clearActions();

        const cancelBtn = document.createElement('x-button');
        cancelBtn.setAttr('label', 'Cancel');
        cancelBtn.addEventListener('button-click', () => dialog.close());

        const addBtn = document.createElement('x-button');
        addBtn.setAttr('label', 'Add Member');
        addBtn.setAttr('variant', 'primary');
        addBtn.addEventListener('button-click', () => {
            if (this.validateAndCreateMember()) {
                dialog.close();
            }
        });

        dialog.addAction(cancelBtn);
        dialog.addAction(addBtn);
        dialog.open();
    }

    validateAndCreateMember() {
        const form = document.getElementById('member-form');
        const fieldset = form.querySelector('x-fieldset');

        if (!fieldset.validate()) {
            return false;
        }

        const memberData = fieldset.getFieldsetValue();
        this.createMember({
            id: Date.now().toString(),
            name: memberData['member-name'],
            email: memberData['member-email'],
            role: memberData['member-role'],
            joinedAt: new Date().toISOString()
        });

        return true;
    }

    createMember(member) {
        this.data.data.team.push(member);
        this.data.save();
        this.renderTeam();
    }

    deleteMember(id) {
        const memberIndex = this.data.data.team.findIndex(m => m.id === id);
        if (memberIndex !== -1) {
            this.data.data.team.splice(memberIndex, 1);
            this.data.save();
            this.renderTeam();
        }
    }

    renderTeam() {
        const container = document.getElementById('team-list');
        const team = this.data.data.team;

        if (team.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h4>No team members yet</h4>
                    <p>Add team members to collaborate on projects</p>
                </div>
            `;
            return;
        }

        container.innerHTML = team.map(member => this.renderMemberCard(member)).join('');

        // Bind member card events
        team.forEach(member => {
            this.bindMemberCardEvents(member.id);
        });
    }

    renderMemberCard(member) {
        const roleIcons = {
            developer: '👩‍💻',
            designer: '🎨',
            manager: '👔',
            client: '🤝'
        };

        return `
            <div class="member-card" data-member-id="${member.id}">
                <div class="member-avatar">
                    ${roleIcons[member.role] || '👤'}
                </div>
                <div class="member-info">
                    <h4>${member.name}</h4>
                    <p class="member-email">${member.email}</p>
                    <span class="member-role">${member.role.charAt(0).toUpperCase() + member.role.slice(1)}</span>
                </div>
                <div class="member-actions">
                    <x-button data-action="delete" data-member-id="${member.id}" label="Remove"></x-button>
                </div>
            </div>
        `;
    }

    bindMemberCardEvents(memberId) {
        const card = document.querySelector(`[data-member-id="${memberId}"]`);
        if (!card) return;

        const deleteBtn = card.querySelector('[data-action="delete"]');
        deleteBtn?.addEventListener('button-click', () => {
            const member = this.data.data.team.find(m => m.id === memberId);
            if (member && confirm(`Remove ${member.name} from the team?`)) {
                this.deleteMember(memberId);
            }
        });
    }
}

// Navigation management
class NavigationManager {
    constructor() {
        this.currentSection = 'showcase';
        this.bindEvents();
        this.initBreadcrumb();
    }

    bindEvents() {
        // Nav buttons
        document.querySelectorAll('.nav-links x-button').forEach(btn => {
            btn.addEventListener('button-click', () => {
                const section = btn.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Hero buttons
        document.getElementById('hero-demo')?.addEventListener('button-click', () => {
            this.showSection('demo');
        });

        document.getElementById('hero-github')?.addEventListener('button-click', () => {
            window.open('https://github.com/anthropic/zephyr-blueprint-starter', '_blank');
        });

        // Tab navigation within demo
        document.getElementById('app-tabs')?.addEventListener('tab-changed', (e) => {
            this.updateBreadcrumb(e.detail.activeTab);
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentSection = sectionName;

            // Update nav button states
            this.updateNavButtons();

            // Update URL without page reload
            window.history.pushState({}, '', `#${sectionName}`);
        }
    }

    updateNavButtons() {
        document.querySelectorAll('.nav-links x-button').forEach(btn => {
            const section = btn.getAttribute('data-section');
            if (section === this.currentSection) {
                btn.setAttr('variant', 'primary');
            } else {
                btn.removeAttribute('variant');
            }
        });
    }

    initBreadcrumb() {
        const breadcrumb = document.getElementById('app-breadcrumb');
        if (breadcrumb) {
            breadcrumb.addEventListener('breadcrumb-navigate', (e) => {
                const { href } = e.detail;
                if (href.startsWith('#')) {
                    const tabId = href.substring(1);
                    document.getElementById('app-tabs')?.setActiveTab(tabId);
                }
            });
        }
    }

    updateBreadcrumb(activeTab) {
        const breadcrumb = document.getElementById('app-breadcrumb');
        if (!breadcrumb) return;

        const tabLabels = {
            dashboard: 'Dashboard',
            projects: 'Projects',
            tasks: 'Tasks',
            team: 'Team',
            settings: 'Settings'
        };

        const path = [
            { label: 'Home', href: '#dashboard' },
            { label: tabLabels[activeTab] || activeTab, href: `#${activeTab}` }
        ];

        breadcrumb.setAttr('path', JSON.stringify(path));
    }
}

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.bindEvents();
        this.setupVirtualList();
        this.setupFormPerformance();
        this.setupComponentCreation();
    }

    bindEvents() {
        // Component creation buttons
        document.getElementById('create-100')?.addEventListener('button-click', () => {
            this.createComponents(100);
        });

        document.getElementById('create-1000')?.addEventListener('button-click', () => {
            this.createComponents(1000);
        });

        document.getElementById('destroy-all')?.addEventListener('button-click', () => {
            this.destroyAllComponents();
        });
    }

    setupVirtualList() {
        const vlist = document.getElementById('perf-virtual-list');
        if (vlist) {
            vlist.renderer = (el, i) => {
                el.textContent = `Performance Item ${i + 1} - Efficiently rendered`;
                el.style.padding = '0 12px';
                el.style.lineHeight = '32px';
                el.style.borderBottom = '1px solid #f0f0f0';

                // Alternate row colors
                if (i % 2) {
                    el.style.background = '#fafafa';
                } else {
                    el.style.background = 'white';
                }
            };
        }
    }

    setupFormPerformance() {
        const form = document.getElementById('perf-form');
        if (!form) return;

        const inputs = form.querySelectorAll('x-input, x-textarea');

        inputs.forEach(input => {
            input.addEventListener('input-change', () => {
                this.measureValidationTime(form);
            });
        });
    }

    measureValidationTime(form) {
        const startTime = performance.now();

        // Trigger validation
        const fieldset = form.querySelector('x-fieldset');
        if (fieldset) {
            fieldset.validate();
        }

        const endTime = performance.now();
        const validationTime = Math.round(endTime - startTime);

        const timeElement = document.getElementById('validation-time');
        if (timeElement) {
            timeElement.textContent = `${validationTime}ms`;
        }
    }

    setupComponentCreation() {
        this.componentCount = 0;
    }

    createComponents(count) {
        const container = document.getElementById('component-container');
        if (!container) return;

        const startTime = performance.now();

        for (let i = 0; i < count; i++) {
            // Create different types of components
            const componentTypes = ['x-button', 'x-input', 'x-checkbox'];
            const type = componentTypes[i % componentTypes.length];

            const component = document.createElement(type);

            switch (type) {
                case 'x-button':
                    component.setAttr('label', `Button ${this.componentCount + i + 1}`);
                    component.setAttr('variant', i % 3 === 0 ? 'primary' : undefined);
                    break;
                case 'x-input':
                    component.setAttr('placeholder', `Input ${this.componentCount + i + 1}`);
                    component.setAttr('value', `Value ${this.componentCount + i + 1}`);
                    break;
                case 'x-checkbox':
                    component.setAttr('label', `Checkbox ${this.componentCount + i + 1}`);
                    if (i % 2 === 0) component.setAttr('checked', '');
                    break;
            }

            container.appendChild(component);
        }

        const endTime = performance.now();
        const creationTime = Math.round(endTime - startTime);

        this.componentCount += count;

        // Update stats
        document.getElementById('creation-time').textContent = `${creationTime}ms`;
        document.getElementById('component-count').textContent = this.componentCount;
    }

    destroyAllComponents() {
        const container = document.getElementById('component-container');
        if (container) {
            container.innerHTML = '';
            this.componentCount = 0;
            document.getElementById('component-count').textContent = '0';
        }
    }
}

// Activity management
class ActivityManager {
    constructor(dataManager) {
        this.data = dataManager;
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('data-saved', () => {
            this.renderActivity();
        });
    }

    renderActivity() {
        const container = document.getElementById('activity-list');
        const activities = this.data.data.activity.slice(0, 10); // Show last 10

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No recent activity. Create a project to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => this.renderActivityItem(activity)).join('');
    }

    renderActivityItem(activity) {
        const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
        const icon = activity.type === 'project' ? '📁' : '✅';

        return `
            <div class="activity-item">
                <span class="activity-icon">${icon}</span>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <span class="activity-time">${timeAgo}</span>
                </div>
            </div>
        `;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
}

// Documentation examples
class DocsManager {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        // Demo input for docs
        const demoInput = document.getElementById('docs-demo-input');
        const demoOutput = document.getElementById('docs-demo-output');
        const demoBtn = document.getElementById('docs-demo-btn');

        if (demoInput && demoOutput) {
            // Update DOM preview as user types
            demoInput.addEventListener('input-change', () => {
                this.updateDOMPreview();
            });

            // Toggle required attribute
            demoBtn?.addEventListener('button-click', () => {
                if (demoInput.hasAttribute('required')) {
                    demoInput.removeAttribute('required');
                    demoBtn.setAttr('label', 'Add Required');
                } else {
                    demoInput.setAttr('required', '');
                    demoBtn.setAttr('label', 'Remove Required');
                }
                this.updateDOMPreview();
            });

            // Initial preview
            this.updateDOMPreview();
        }
    }

    updateDOMPreview() {
        const demoInput = document.getElementById('docs-demo-input');
        const demoOutput = document.getElementById('docs-demo-output');

        if (!demoInput || !demoOutput) return;

        const value = demoInput.getAttribute('value') || '';
        const placeholder = demoInput.getAttribute('placeholder') || '';
        const required = demoInput.hasAttribute('required');

        let preview = `<x-input`;
        if (value) preview += ` value="${value}"`;
        if (placeholder) preview += ` placeholder="${placeholder}"`;
        if (required) preview += ` required`;
        preview += `>`;

        demoOutput.textContent = preview;
    }
}

// Settings management
class SettingsManager {
    constructor(dataManager) {
        this.data = dataManager;
        this.bindEvents();
        this.loadSettings();
    }

    bindEvents() {
        const form = document.getElementById('settings-form');
        if (!form) return;

        // Listen for settings changes
        form.addEventListener('form-change', () => {
            this.saveSettings();
            this.applySettings();
        });

        // Settings buttons
        document.getElementById('export-settings')?.addEventListener('button-click', () => {
            this.exportSettings();
        });

        document.getElementById('import-settings')?.addEventListener('button-click', () => {
            this.importSettings();
        });

        document.getElementById('reset-settings')?.addEventListener('button-click', () => {
            this.resetSettings();
        });

        // Export/clear data buttons
        document.getElementById('export-data')?.addEventListener('button-click', () => {
            this.exportAllData();
        });

        document.getElementById('clear-all-data')?.addEventListener('button-click', () => {
            this.clearAllData();
        });
    }

    loadSettings() {
        const settings = this.data.data.settings;

        // Apply settings to form
        if (document.getElementById('theme-setting')) {
            document.getElementById('theme-setting').setAttr('value', settings.theme);
        }

        if (settings.notifications) {
            document.getElementById('notifications-enabled')?.setAttr('checked', '');
        }

        if (settings.autoSave) {
            document.getElementById('auto-save-enabled')?.setAttr('checked', '');
        }

        if (document.getElementById('default-priority')) {
            document.getElementById('default-priority').setAttr('value', settings.defaultPriority);
        }

        this.applySettings();
    }

    saveSettings() {
        const form = document.getElementById('settings-form');
        if (!form) return;

        const fieldset = form.querySelector('x-fieldset');
        const formData = fieldset.getFieldsetValue();

        this.data.data.settings = {
            theme: formData['theme-setting'] || 'light',
            notifications: formData['notifications-enabled'] || false,
            autoSave: formData['auto-save-enabled'] || false,
            defaultPriority: formData['default-priority'] || 'medium'
        };

        this.data.save();
    }

    applySettings() {
        const settings = this.data.data.settings;

        // Apply theme
        document.body.className = `theme-${settings.theme}`;

        // Apply auto-save setting
        if (settings.autoSave) {
            this.data.enableAutoSave();
        } else {
            this.data.disableAutoSave();
        }
    }

    exportSettings() {
        const settings = JSON.stringify(this.data.data.settings, null, 2);
        this.downloadFile('zephyr-settings.json', settings);
    }

    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const settings = JSON.parse(e.target.result);
                        this.data.data.settings = { ...this.data.data.settings, ...settings };
                        this.data.save();
                        this.loadSettings();
                        alert('Settings imported successfully!');
                    } catch (error) {
                        alert('Failed to import settings. Invalid file format.');
                    }
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            this.data.data.settings = this.data.getDefaultData().settings;
            this.data.save();
            this.loadSettings();
        }
    }

    exportAllData() {
        const data = this.data.export();
        this.downloadFile('zephyr-data-export.json', data);
    }

    clearAllData() {
        if (confirm('This will delete all projects, tasks, and team members. Are you sure?')) {
            this.data.clear();
            window.location.reload(); // Refresh to reset UI
        }
    }

    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Application initialization
class ZephyrShowcaseApp {
    constructor() {
        this.init();
    }

    async init() {
        // Wait for DOM and components to be ready
        await this.waitForComponents();

        // Initialize managers
        this.dataManager = new DataManager();
        this.navigationManager = new NavigationManager();
        this.projectManager = new ProjectManager(this.dataManager);
        this.taskManager = new TaskManager(this.dataManager);
        this.teamManager = new TeamManager(this.dataManager);
        this.activityManager = new ActivityManager(this.dataManager);
        this.performanceMonitor = new PerformanceMonitor();
        this.docsManager = new DocsManager();
        this.settingsManager = new SettingsManager(this.dataManager);

        // Initial render
        this.render();

        // Setup demo data if empty
        this.setupDemoData();

        // Show initial section
        this.handleInitialNavigation();

        console.log('Zephyr Blueprint Showcase App initialized!');
    }

    async waitForComponents() {
        // Wait for all custom elements to be defined
        const components = [
            'x-button', 'x-input', 'x-select', 'x-checkbox', 'x-textarea',
            'x-radio-group', 'x-fieldset', 'x-form', 'x-dialog', 'x-tabs',
            'x-breadcrumb', 'x-accordion', 'x-virtual-list'
        ];

        await Promise.all(components.map(tag => customElements.whenDefined(tag)));
    }

    render() {
        // Initial render of all components
        this.projectManager.renderProjects();
        this.projectManager.updateProjectSelects();
        this.taskManager.renderTasks();
        this.teamManager.renderTeam();
        this.activityManager.renderActivity();
        this.updateStats();
    }

    updateStats() {
        this.projectManager.updateStats();
        this.taskManager.updateStats();
    }

    setupDemoData() {
        // Add some demo data if the app is empty
        if (this.dataManager.data.projects.length === 0) {
            // Add sample project
            const sampleProject = {
                id: 'demo-project-1',
                name: 'Zephyr Blueprint Demo',
                description: 'A sample project showcasing the framework capabilities',
                status: 'active',
                deadline: '2024-12-31',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.dataManager.data.projects.push(sampleProject);

            // Add sample tasks
            const sampleTasks = [
                {
                    id: 'demo-task-1',
                    title: 'Create project structure',
                    description: 'Set up the basic project files and organization',
                    projectId: 'demo-project-1',
                    priority: 'high',
                    status: 'completed',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'demo-task-2',
                    title: 'Implement core components',
                    description: 'Build the essential UI components using Zephyr Blueprint',
                    projectId: 'demo-project-1',
                    priority: 'high',
                    status: 'in-progress',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'demo-task-3',
                    title: 'Add documentation',
                    description: 'Write comprehensive documentation and examples',
                    projectId: 'demo-project-1',
                    priority: 'medium',
                    status: 'todo',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];

            this.dataManager.data.tasks.push(...sampleTasks);

            // Add sample team member
            const sampleMember = {
                id: 'demo-member-1',
                name: 'Demo Developer',
                email: 'demo@zephyr-blueprint.dev',
                role: 'developer',
                joinedAt: new Date().toISOString()
            };

            this.dataManager.data.team.push(sampleMember);

            // Add sample activity
            this.dataManager.data.activity.push(
                {
                    id: Date.now(),
                    message: 'Created demo project "Zephyr Blueprint Demo"',
                    timestamp: new Date().toISOString(),
                    type: 'project'
                },
                {
                    id: Date.now() + 1,
                    message: 'Added sample tasks to get started',
                    timestamp: new Date().toISOString(),
                    type: 'task'
                }
            );

            this.dataManager.save();
        }
    }

    handleInitialNavigation() {
        // Check URL hash for initial section
        const hash = window.location.hash.substring(1);
        const validSections = ['showcase', 'demo', 'performance', 'docs'];

        if (validSections.includes(hash)) {
            this.navigationManager.showSection(hash);
        } else {
            this.navigationManager.showSection('showcase');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ZephyrShowcaseApp();
});

// Handle browser back/forward
window.addEventListener('popstate', () => {
    const hash = window.location.hash.substring(1) || 'showcase';
    document.querySelector('.navigation-manager')?.showSection(hash);
});