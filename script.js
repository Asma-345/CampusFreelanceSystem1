document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:5000/api';
    const state = { projects: {}, services: {} };

    window.showModal = function(title, content) {
        let modal = document.getElementById('detailsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'detailsModal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
                z-index: 1000; opacity: 0; transition: opacity 0.3s;
            `;
            modal.innerHTML = `
                <div style="background: var(--bg-main); width: 90%; max-width: 550px; border-radius: var(--radius-lg); padding: 2.5rem; box-shadow: var(--shadow-lg); position: relative; transform: translateY(20px); transition: transform 0.3s;">
                    <button id="closeModalBtn" style="position: absolute; top: 1rem; right: 1.5rem; background: transparent; border: none; font-size: 2rem; cursor: pointer; color: var(--text-light); transition: color 0.2s;">&times;</button>
                    <h2 id="modalTitle" style="margin-bottom: 1.5rem; color: var(--text-dark); font-size: 1.5rem; padding-right: 2rem;"></h2>
                    <div id="modalContent" style="color: var(--text-body); line-height: 1.6; max-height: 60vh; overflow-y: auto; padding-right: 0.5rem;"></div>
                    <button id="modalActionBtn" class="btn btn-primary" style="margin-top: 2rem; width: 100%; padding: 0.85rem;">Close</button>
                </div>
            `;
            document.body.appendChild(modal);
            
            const closeModal = () => {
                modal.style.opacity = '0';
                modal.firstElementChild.style.transform = 'translateY(20px)';
                setTimeout(() => modal.style.display = 'none', 300);
            };
            
            document.getElementById('closeModalBtn').addEventListener('click', closeModal);
            document.getElementById('closeModalBtn').addEventListener('mouseover', function() { this.style.color = 'var(--text-dark)'; });
            document.getElementById('closeModalBtn').addEventListener('mouseout', function() { this.style.color = 'var(--text-light)'; });
            document.getElementById('modalActionBtn').addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }
        
        document.getElementById('modalTitle').innerText = title;
        document.getElementById('modalContent').innerHTML = content;
        
        modal.style.display = 'flex';
        // Trigger reflow
        void modal.offsetWidth;
        modal.style.opacity = '1';
        modal.firstElementChild.style.transform = 'translateY(0)';
    };

    window.showProjectDetails = function(id) {
        const p = state.projects[id];
        if (!p) return;
        const content = `
            <div style="margin-bottom: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <span class="badge">${p.category}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; background: var(--bg-alt); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                ${p.client_name ? `<div><div style="font-size: 0.8rem; color: var(--text-light);">Posted By</div><div style="font-weight: 600;">${p.client_name}</div></div>` : ''}
                <div><div style="font-size: 0.8rem; color: var(--text-light);">Budget</div><div style="color: var(--primary); font-weight: 700;">Rs. ${p.budget}</div></div>
                ${p.deadline ? `<div><div style="font-size: 0.8rem; color: var(--text-light);">Deadline</div><div style="font-weight: 500;">${p.deadline}</div></div>` : ''}
            </div>
            <div>
                <h4 style="margin-bottom: 0.75rem; color: var(--text-dark);">Project Description</h4>
                <p style="white-space: pre-wrap; color: var(--text-body);">${p.issues}</p>
            </div>
            ${window.currentUserRole === 'Freelance' || window.currentUserRole === 'Freelancer' ? `<button onclick="window.sendMessage(${p.user_id}, 'Hi! I am available for the project: ${p.title.replace(/'/g, "\\'")}')" class="btn btn-primary" style="margin-top: 1.5rem; width: 100%; padding: 0.85rem;"><i class="fa-solid fa-paper-plane"></i> I'm available for the project</button>` : ''}
        `;
        showModal(p.title, content);
    };

    window.showServiceDetails = function(id) {
        const s = state.services[id];
        if (!s) return;
        const content = `
            <div style="margin-bottom: 1.5rem;">
                <span class="badge">${s.category}</span>
            </div>
            ${s.freelancer_name ? `
            <div style="margin-bottom: 1.5rem; background: var(--bg-alt); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 1rem;">
                <div style="width: 40px; height: 40px; background: var(--primary-light); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">
                    ${s.freelancer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: var(--text-light);">Freelancer</div>
                    <div style="font-weight: 600;">${s.freelancer_name}</div>
                </div>
            </div>` : ''}
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 0.75rem; color: var(--text-dark);">Service Description</h4>
                <p style="white-space: pre-wrap; color: var(--text-body);">${s.description}</p>
            </div>
            ${s.projects ? `
            <div style="padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                <h4 style="margin-bottom: 0.75rem; color: var(--text-dark);">Previous Work / Portfolio</h4>
                <p style="white-space: pre-wrap; color: var(--text-body);">${s.projects}</p>
            </div>
            ` : ''}
            ${window.currentUserRole === 'Hire' ? `<button onclick="window.sendMessage(${s.user_id}, 'Hi! I would like to hire you for a project.')" class="btn btn-primary" style="margin-top: 1.5rem; width: 100%; padding: 0.85rem;"><i class="fa-solid fa-paper-plane"></i> Message Freelancer</button>` : ''}
        `;
        showModal(s.title, content);
    };

    // Role Toggle Animation
    const roleBtns = document.querySelectorAll('.role-btn');
    if (roleBtns.length > 0) {
        roleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                roleBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    // Helper to safely access localStorage
    function safeGetItem(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function safeSetItem(key, value) {
        try { localStorage.setItem(key, value); } catch (e) {}
    }

    // Load stored user data from token or localStorage
    async function loadUserData() {
        const token = safeGetItem('campusLanceToken');
        if (token) {
            try {
                const response = await fetch(`${API_URL}/me`, {
                    headers: { 'Authorization': token }
                });
                if (response.ok) {
                    const userData = await response.json();
                    updateUI(userData);
                    if (userData.role === 'Hire') {
                        loadProjects('projectsListContainer', userData.id);
                        loadDashboardMessages('clientMessagesContainer');
                    } else {
                        loadServices('servicesListContainer', userData.id);
                        loadProjects('availableProjectsContainer', null);
                        loadDashboardMessages('freelancerMessagesContainer');
                    }
                }
            } catch (error) {
                console.error("Auth error:", error);
            }
        } else {
            // Fallback to local storage if no token (legacy support)
            const storedName = safeGetItem('campusLanceName');
            const storedRole = safeGetItem('campusLanceRole');
            if (storedName) updateUI({ full_name: storedName, role: storedRole });
        }
        
        // Load all services for the marketplace if on index.html
        if (document.querySelector('.market-grid') || document.querySelector('.services-list')) {
            loadAllServices();
        }
    }

    async function loadProjects(containerId, userId = null) {
        const projectsPanel = document.getElementById(containerId);
        if (!projectsPanel) return;

        try {
            const url = userId ? `${API_URL}/projects?user_id=${userId}` : `${API_URL}/projects`;
            const response = await fetch(url);
            const projects = await response.json();
            projects.forEach(p => state.projects[p.id] = p);
            
            if (projects.length > 0) {
                projectsPanel.innerHTML = projects.map(p => `
                    <div class="project-item-card" style="background: var(--bg-alt); border: 1px solid var(--border-color); padding: 1rem; border-radius: 12px; margin-bottom: 1rem; cursor: pointer;" onclick="window.showProjectDetails(${p.id})">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <span style="font-size: 0.7rem; color: var(--primary); text-transform: uppercase; font-weight: bold;">${p.category}</span>
                                <h4 style="margin: 0.25rem 0; color: var(--text-dark);">${p.title}</h4>
                                <p style="font-size: 0.85rem; color: var(--text-body);">${p.issues}</p>
                                <div style="margin-top: 0.5rem; font-size: 0.8rem; font-weight: 600; color: var(--primary);">Budget: Rs. ${p.budget}</div>
                            </div>
                        </div>
                    </div>
                `).join('');
                // Only update the 'posted projects' stat for the user's own projects
                if (userId) {
                    const postedProjectsStat = document.getElementById('postedProjectsCount');
                    if (postedProjectsStat) postedProjectsStat.innerText = projects.length;
                }
            } else {
                if (!userId) {
                    projectsPanel.innerHTML = '<div style="padding: 1rem; color: var(--text-light); text-align: center;">No projects available yet.</div>';
                }
            }
        } catch (error) {
            console.error("Error loading projects:", error);
        }
    }

    async function loadServices(containerId, userId = null) {
        const servicesPanel = document.getElementById(containerId);
        if (!servicesPanel) return;

        try {
            const url = userId ? `${API_URL}/services?user_id=${userId}` : `${API_URL}/services`;
            const response = await fetch(url);
            const services = await response.json();
            services.forEach(s => state.services[s.id] = s);
            
            if (services.length > 0) {
                servicesPanel.innerHTML = services.map(s => `
                    <div class="service-item-card" style="background: var(--bg-alt); border: 1px solid var(--border-color); padding: 1rem; border-radius: 12px; margin-bottom: 1rem; cursor: pointer;" onclick="window.showServiceDetails(${s.id})">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <span style="font-size: 0.7rem; color: var(--primary); text-transform: uppercase; font-weight: bold;">${s.category}</span>
                                <h4 style="margin: 0.25rem 0; color: var(--text-dark);">${s.title}</h4>
                                <p style="font-size: 0.85rem; color: var(--text-body);">${s.description}</p>
                            </div>
                        </div>
                    </div>
                `).join('');
                // Only update the stats if they exist and it's for the user's own services
                if (userId) {
                    const activeServicesStat = document.getElementById('activeServicesCount');
                    if (activeServicesStat) activeServicesStat.innerText = services.length;
                }
            } else {
                if (!userId) {
                    servicesPanel.innerHTML = '<div style="padding: 1rem; color: var(--text-light); text-align: center;">No services available yet.</div>';
                }
            }
        } catch (error) {
            console.error("Error loading services:", error);
        }
    }

    async function loadDashboardMessages(containerId) {
        const messagesPanel = document.getElementById(containerId);
        if (!messagesPanel) return;
        const token = safeGetItem('campusLanceToken');
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/messages`, { headers: { 'Authorization': token } });
            const msgs = await response.json();
            
            if (msgs.length > 0) {
                // Group by sender
                const grouped = {};
                msgs.forEach(m => {
                    const partnerId = m.sender_id === window.currentUserId ? m.receiver_id : m.sender_id;
                    const partnerName = m.sender_id === window.currentUserId ? m.receiver_name : m.sender_name;
                    grouped[partnerId] = { name: partnerName, lastMsg: m.content, time: m.created_at };
                });
                
                const html = Object.keys(grouped).map(id => {
                    const g = grouped[id];
                    return `
                        <div style="background: var(--bg-alt); border: 1px solid var(--border-color); padding: 1rem; border-radius: 12px; margin-bottom: 1rem; cursor: pointer;" onclick="window.lastChatPartnerId=${id}; window.openChatbox()">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h4 style="margin: 0.25rem 0; color: var(--text-dark);">${g.name}</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${g.lastMsg}</p>
                                </div>
                                <div style="color: var(--primary); font-size: 1.2rem;">
                                    <i class="fa-solid fa-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                messagesPanel.innerHTML = html;
            }
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    }

    async function loadAllServices() {
        const marketGrid = document.querySelector('.market-grid');
        if (!marketGrid) return;

        try {
            const response = await fetch(`${API_URL}/services`);
            const services = await response.json();
            
            if (services.length > 0) {
                marketGrid.innerHTML = services.map(s => `
                    <div class="feature-card">
                        <div class="feature-icon"><i class="fa-solid fa-briefcase"></i></div>
                        <h3>${s.title}</h3>
                        <p>${s.description.substring(0, 100)}${s.description.length > 100 ? '...' : ''}</p>
                        <div style="margin-top: 1rem; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #10b981;">${s.category}</span>
                            <span style="opacity: 0.6;">By ${s.freelancer_name}</span>
                        </div>
                        <button class="btn btn-secondary" style="width: 100%; margin-top: 1rem; padding: 0.5rem;">View Profile</button>
                    </div>
                `).join('');
                addFadeIn(document.querySelectorAll('.market-grid .feature-card'), 100);
            }
        } catch (error) {
            console.error("Error loading marketplace:", error);
        }
    }

    function updateUI(user) {
        window.currentUserRole = user.role;
        window.currentUserId = user.id;
        
        // Initialize chatbox only on dashboard
        if (document.getElementById('dashboardContentGrid') && !document.getElementById('chatWidget')) {
            createChatbox();
        }

        const welcomeName = document.getElementById('welcomeName');
        if (welcomeName) welcomeName.innerText = user.full_name;
        
        const miniProfileName = document.getElementById('miniProfileName');
        if (miniProfileName) miniProfileName.innerText = user.full_name;

        // Role based visibility
        const freelancerElements = document.querySelectorAll('.freelancer-only');
        const clientElements = document.querySelectorAll('.client-only');
        const earningLabel = document.getElementById('earningLabel');
        const welcomeRole = document.querySelector('.welcome-card .badge');
        
        // Update wallet balances
        const navBalance = document.querySelector('.nav-actions .badge span');
        if (navBalance) navBalance.innerText = `Rs. ${user.balance || 0}`;
        
        const mainBalance = document.querySelector('.wallet-card .amount');
        if (mainBalance) mainBalance.innerText = `Rs. ${user.balance || 0}`;
        
        const earningsValue = earningLabel ? earningLabel.nextElementSibling : null;
        
        if (user.role === 'Hire') {
            if (earningsValue) earningsValue.innerText = `Rs. ${user.total_spent || 0}`;
            freelancerElements.forEach(el => el.style.display = 'none');
            clientElements.forEach(el => el.style.display = 'block');
            if (earningLabel) earningLabel.innerText = 'Total Spent';
            if (welcomeRole) welcomeRole.innerText = 'Client Overview';
        } else {
            if (earningsValue) earningsValue.innerText = `Rs. ${user.total_earnings || 0}`;
            freelancerElements.forEach(el => el.style.display = 'block');
            clientElements.forEach(el => el.style.display = 'none');
            if (earningLabel) earningLabel.innerText = 'Recent Earnings';
            if (welcomeRole) welcomeRole.innerText = 'Freelancer Overview';
        }
    }

    loadUserData();

    // Service Creation Form
    const serviceForm = document.getElementById('serviceForm');
    if (serviceForm) {
        serviceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = safeGetItem('campusLanceToken');
            if (!token) {
                alert("Please login first");
                window.location.href = 'login.html';
                return;
            }

            const submitBtn = serviceForm.querySelector('button[type="submit"]');
            submitBtn.innerText = 'Publishing...';
            submitBtn.disabled = true;

            const payload = {
                title: document.getElementById('serviceTitle').value,
                category: document.getElementById('serviceCategory').value,
                description: document.getElementById('serviceDescription').value,
                projects: document.getElementById('serviceProjects').value
            };

            try {
                const response = await fetch(`${API_URL}/services`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    alert("Service published successfully!");
                    window.location.href = 'dashboard.html';
                } else {
                    const data = await response.json();
                    alert(data.error || "Failed to publish service");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Connection error");
            } finally {
                submitBtn.innerText = 'Publish Service';
                submitBtn.disabled = false;
            }
        });
    }

    // Project Creation Form
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = safeGetItem('campusLanceToken');
            if (!token) {
                alert("Please login first");
                window.location.href = 'login.html';
                return;
            }

            const submitBtn = projectForm.querySelector('button[type="submit"]');
            submitBtn.innerText = 'Posting...';
            submitBtn.disabled = true;

            const payload = {
                title: document.getElementById('projectTitle').value,
                category: document.getElementById('projectCategory').value,
                issues: document.getElementById('projectIssues').value,
                budget: document.getElementById('projectBudget').value,
                deadline: document.getElementById('projectDeadline').value
            };

            try {
                const response = await fetch(`${API_URL}/projects`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    alert("Project posted successfully!");
                    window.location.href = 'dashboard.html';
                } else {
                    const data = await response.json();
                    alert(data.error || "Failed to post project");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Connection error");
            } finally {
                submitBtn.innerText = 'Post Project';
                submitBtn.disabled = false;
            }
        });
    }

    // Auth Form Submissions
    const forms = document.querySelectorAll('form:not(#serviceForm)');
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Connecting...';
            submitBtn.disabled = true;

            const isRegistration = !!document.getElementById('fullName');
            const email = form.querySelector('input[type="email"]').value;
            const password = form.querySelector('input[type="password"]').value;
            const activeRoleBtn = document.querySelector('.role-btn.active');
            const role = activeRoleBtn ? activeRoleBtn.innerText.trim() : 'Hire';

            try {
                if (isRegistration) {
                    const fullName = document.getElementById('fullName').value;
                    const response = await fetch(`${API_URL}/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ full_name: fullName, email, password, role })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        alert("Registration successful! Please login.");
                        window.location.href = 'login.html';
                    } else {
                        alert(data.error || "Registration failed");
                    }
                } else {
                    // Login
                    const response = await fetch(`${API_URL}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        safeSetItem('campusLanceToken', data.token);
                        safeSetItem('campusLanceName', data.user.full_name);
                        safeSetItem('campusLanceRole', data.user.role);
                        window.location.href = 'dashboard.html';
                    } else {
                        alert(data.error || "Login failed");
                    }
                }
            } catch (error) {
                console.error("Connection error:", error);
                alert("Could not connect to the backend server. Make sure it's running on port 5000.");
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    });

    // Add gentle intro animations
    const addFadeIn = (elements, delay) => {
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, delay + (index * 100));
        });
    };

    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length > 0) addFadeIn(featureCards, 300);

    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length > 0) addFadeIn(statCards, 300);

    // --- Chatbox Implementation ---
    function createChatbox() {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chatWidget';
        chatContainer.style.cssText = `
            position: fixed; bottom: 90px; right: 20px; width: 350px; height: 450px;
            background: var(--bg-main); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
            display: none; flex-direction: column; z-index: 9999; border: 1px solid var(--border-color); overflow: hidden;
        `;
        chatContainer.innerHTML = `
            <div style="background: var(--primary); color: white; padding: 1rem; display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
                <div>Messages</div>
                <button onclick="document.getElementById('chatWidget').style.display='none'" style="background:none; border:none; color:white; font-size: 1.5rem; cursor:pointer;">&times;</button>
            </div>
            <div id="chatMessages" style="flex: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.8rem; background: var(--bg-alt);"></div>
            <div style="padding: 1rem; border-top: 1px solid var(--border-color); display: flex; gap: 0.5rem; background: var(--bg-main);">
                <input type="text" id="chatInput" placeholder="Type a message..." style="flex: 1; padding: 0.5rem 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-pill); outline: none;">
                <button id="sendChatBtn" class="btn btn-primary" style="padding: 0.5rem 1rem; border-radius: var(--radius-pill);"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        `;
        document.body.appendChild(chatContainer);
        
        const chatToggle = document.createElement('button');
        chatToggle.innerHTML = '<i class="fa-solid fa-message"></i>';
        chatToggle.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
            border-radius: 50%; background: var(--primary); color: white; border: none;
            box-shadow: var(--shadow-lg); font-size: 1.5rem; cursor: pointer; z-index: 9998;
            display: flex; align-items: center; justify-content: center; transition: transform 0.2s;
        `;
        chatToggle.onmouseover = () => chatToggle.style.transform = 'scale(1.05)';
        chatToggle.onmouseout = () => chatToggle.style.transform = 'scale(1)';
        chatToggle.onclick = () => {
            const w = document.getElementById('chatWidget');
            if (w.style.display === 'none' || w.style.display === '') {
                w.style.display = 'flex';
                loadChatMessages();
            } else {
                w.style.display = 'none';
            }
        };
        document.body.appendChild(chatToggle);
        
        document.getElementById('sendChatBtn').onclick = async () => {
            const input = document.getElementById('chatInput');
            if (!input.value.trim() || !window.lastChatPartnerId) return;
            await window.sendMessage(window.lastChatPartnerId, input.value, true);
            input.value = '';
        };
    }

    window.openChatbox = function() {
        if(document.getElementById('chatWidget')) {
            document.getElementById('chatWidget').style.display = 'flex';
            loadChatMessages();
        }
    };

    async function loadChatMessages() {
        const token = safeGetItem('campusLanceToken');
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/messages`, { headers: { 'Authorization': token } });
            const msgs = await response.json();
            const container = document.getElementById('chatMessages');
            
            if (msgs.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: var(--text-light); margin-top: 2rem;">No messages yet. Select a project or service to start chatting!</div>';
                return;
            }
            
            if (!window.lastChatPartnerId) {
                const lastMsg = msgs[msgs.length - 1];
                window.lastChatPartnerId = lastMsg.sender_id === window.currentUserId ? lastMsg.receiver_id : lastMsg.sender_id;
            }
            
            const partnerIdStr = String(window.lastChatPartnerId);
            const filteredMsgs = msgs.filter(m => 
                String(m.sender_id) === partnerIdStr || String(m.receiver_id) === partnerIdStr
            );
            
            if (filteredMsgs.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: var(--text-light); margin-top: 2rem;">No messages in this conversation yet.</div>';
                return;
            }
            
            container.innerHTML = filteredMsgs.map(m => {
                const isMe = m.sender_id === window.currentUserId;
                return `
                    <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 85%; background: ${isMe ? 'var(--primary)' : 'white'}; color: ${isMe ? 'white' : 'var(--text-dark)'}; padding: 0.75rem 1rem; border-radius: 12px; border: ${isMe ? 'none' : '1px solid var(--border-color)'}; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 0.7rem; opacity: ${isMe ? '0.8' : '0.5'}; margin-bottom: 0.25rem;">${isMe ? 'You' : m.sender_name}</div>
                        <div style="font-size: 0.9rem;">${m.content}</div>
                    </div>
                `;
            }).join('');
            container.scrollTop = container.scrollHeight;
        } catch (e) { console.error(e); }
    }

    window.sendMessage = async function(receiverId, content, skipAlert = false) {
        const token = safeGetItem('campusLanceToken');
        try {
            const response = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ receiver_id: receiverId, content })
            });
            if (response.ok) {
                if (!skipAlert) {
                    alert("Notification sent! Opening chatbox...");
                    const closeBtn = document.getElementById('closeModalBtn');
                    if(closeBtn) closeBtn.click();
                    window.lastChatPartnerId = receiverId;
                    openChatbox();
                } else {
                    loadChatMessages();
                }
            }
        } catch (e) { console.error(e); }
    };
});

