/**
 * Ajanta Door & Window Systems - Standalone Admin Portal Controller
 * Author: Sunny Mehta / Ajanta Glass Management
 */

// ==========================================
// CONSTANTS & FACTORY DEFAULTS
// ==========================================
const STORAGE_KEYS = {
    PRODUCTS: "ajanta_products_catalog",
    LEADS: "ajanta_quote_leads",
    REVIEWS: "ajanta_client_reviews",
    USERS: "ajanta_registered_users",
    ACTIVE_USER: "ajanta_active_user",
    AUTH: "ajanta_admin_auth_config",
    SESSION: "ajanta_admin_logged_in"
};

const DEFAULT_USERS = [];

const FACTORY_PRODUCTS = [
    {
        id: "prod-sliding-windows",
        title: "Sliding Window Systems",
        subtitle: "Acoustic DGU Double Glazing & Precision Rollers",
        categoryBadge: "Acoustic Glazing",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        description: "Heavy-duty engineered sliding window systems with multi-point perimeter compression seals. Eliminates exterior urban noise up to 38dB while delivering thermal insulation.",
        features: ["38dB Noise Attenuation", "Heavy-Duty Extrusions", "Double Glazed DGU", "Smooth Glide Rollers"]
    },
    {
        id: "prod-panoramic-doors",
        title: "Panoramic Sliding Doors",
        subtitle: "Ultra-Slim Sightlines with 12mm Toughened Glass",
        categoryBadge: "Architectural Glazing",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        description: "Floor-to-ceiling glass expanses designed for modern residences, penthouses, and luxury villas. Features seamless flush bottom track options for barrier-free transitions.",
        features: ["Flush Floor Transition", "Multi-Point Locking", "12mm Toughened Glass", "High Wind Load Rated"]
    },
    {
        id: "prod-frameless-partitions",
        title: "Frameless Glass Partitions",
        subtitle: "10mm–12mm Clear & Frosted Office Partitions",
        categoryBadge: "Interior Glazing",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        description: "Minimalist floor-to-ceiling interior glass dividing solutions for executive boardrooms, luxury corporate offices, and private residential cabins.",
        features: ["Architectural Hardware", "Custom CNC Cutouts", "Acoustic Sound Control", "Frosted Privacy Banding"]
    },
    {
        id: "prod-shower-cubicles",
        title: "Toughened Shower Cubicles",
        subtitle: "10mm Hydrophobic Coated Water-Repellent Glass",
        categoryBadge: "Hydrophobic Glass",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
        description: "Custom-manufactured frameless shower enclosures with anti-limescale Nano-coating and marine-grade SS304 stainless steel hinges.",
        features: ["Nano Anti-Limescale", "SS304 Marine Hardware", "Magnetic Door Seals", "Bespoke Enclosure Shapes"]
    },
    {
        id: "prod-safety-railings",
        title: "Safety Glass Railings",
        subtitle: "13.52mm SentryGlas Toughened Laminated Balustrades",
        categoryBadge: "Safety Architecture",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        description: "Engineered spigot and continuous floor base-shoe railing systems for balconies, terrace gardens, and internal cantilever staircases.",
        features: ["High Impact Structural Glass", "Unobstructed Views", "Balcony & Staircase Spigots", "Zero Maintenance Aluminum"]
    }
];

const DEFAULT_REVIEWS = [
    {
        name: "Ar. Rajesh Singhal",
        role: "Principal Architect, Singhal Associates",
        city: "Bathinda, Punjab",
        rating: 5,
        text: "Ajanta Glass delivered flawless 12mm Toughened sliding partitions for our 12,000 sq.ft villa project in Model Town. Exceptional precision alignment and zero edge defects."
    },
    {
        name: "Vikramjit Brar",
        role: "Managing Director, Brar Colonizers",
        city: "Sirsa, Haryana",
        rating: 5,
        text: "We ordered DGU acoustic windows for a residential project adjacent to the highway. The noise reduction is astonishing. Truly masters of double glazing since 1976."
    },
    {
        name: "Dr. Ananya Goyal",
        role: "Homeowner",
        city: "Hisar, Haryana",
        rating: 5,
        text: "The hydrophobic shower cubicle and frameless glass balcony railings are the highlight of our new home. Superb fitting quality and timely delivery."
    }
];

// Global State
let currentTab = "products";
let activeLeadStatusFilter = "ALL";

// ==========================================
// ==========================================
// 1. AUTHENTICATION, SERVER STORAGE & USER ISOLATION
// ==========================================
const CLOUD_SYNC_CONFIG = {
    USERS_KEY: "ajanta_cloud_registered_users_v2",
    LEADS_KEY: "sunny_ajanta_leads_key",
    BASE_URL: "https://kvdb.io/T2p78Krq12XcfWn1vNiw9G/"
};

function getRegisteredUsers() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.USERS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn("Registered users read failed:", e);
    }
    return DEFAULT_USERS;
}

function saveRegisteredUsers(users) {
    try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        // Server & Cloud Sync (Spotify/Firebase style remote sync)
        syncUsersToCloud(users);
    } catch (e) {
        console.warn("Failed to save users:", e);
    }
}

async function syncUsersToCloud(users) {
    try {
        const endpoint = `${CLOUD_SYNC_CONFIG.BASE_URL}${CLOUD_SYNC_CONFIG.USERS_KEY}`;
        await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(users)
        });
    } catch (e) {
        console.warn("Background user cloud sync:", e);
    }
}

async function pullUsersFromCloud() {
    try {
        const endpoint = `${CLOUD_SYNC_CONFIG.BASE_URL}${CLOUD_SYNC_CONFIG.USERS_KEY}`;
        const res = await fetch(endpoint).catch(() => null);
        if (res && res.ok) {
            const remoteUsers = await res.json().catch(() => null);
            if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
                const localUsers = getRegisteredUsers();
                const mergedMap = new Map();
                localUsers.forEach(u => mergedMap.set((u.mobile || u.username), u));
                remoteUsers.forEach(u => mergedMap.set((u.mobile || u.username), u));
                const merged = Array.from(mergedMap.values());
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
                return merged;
            }
        }
    } catch (e) {
        console.warn("Cloud user pull:", e);
    }
    return getRegisteredUsers();
}

function switchAuthMode(mode) {
    const loginForm = document.getElementById("adminLoginForm");
    const registerForm = document.getElementById("adminRegisterForm");
    const tabLogin = document.getElementById("authTab-login");
    const tabRegister = document.getElementById("authTab-register");
    const loginErr = document.getElementById("loginError");
    const regErr = document.getElementById("registerError");

    if (loginErr) loginErr.classList.add("hidden");
    if (regErr) regErr.classList.add("hidden");

    if (mode === "register") {
        if (loginForm) loginForm.classList.add("hidden");
        if (registerForm) registerForm.classList.remove("hidden");
        if (tabRegister) {
            tabRegister.className = "flex-1 py-2 rounded-xl text-xs font-bold transition bg-emerald-600 text-white shadow";
        }
        if (tabLogin) {
            tabLogin.className = "flex-1 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-white";
        }
    } else {
        if (registerForm) registerForm.classList.add("hidden");
        if (loginForm) loginForm.classList.remove("hidden");
        if (tabLogin) {
            tabLogin.className = "flex-1 py-2 rounded-xl text-xs font-bold transition bg-cyan-600 text-white shadow";
        }
        if (tabRegister) {
            tabRegister.className = "flex-1 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-white";
        }
    }
}

function getActiveUser() {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn("Active user read error:", e);
    }
    return { name: "Sunny Mehta", mobile: "9876543210", username: "sunny" };
}

function checkAuthSession() {
    const isLogged = sessionStorage.getItem(STORAGE_KEYS.SESSION) === "true";
    const loginScreen = document.getElementById("loginScreen");
    const dashboardApp = document.getElementById("dashboardApp");

    if (isLogged) {
        if (loginScreen) loginScreen.classList.add("hidden");
        if (dashboardApp) dashboardApp.classList.remove("hidden");
        initDashboard();
    } else {
        if (loginScreen) loginScreen.classList.remove("hidden");
        if (dashboardApp) dashboardApp.classList.add("hidden");
        // Ensure all login and register inputs are completely clean and unpopulated
        const loginUser = document.getElementById("loginUsername");
        const loginPass = document.getElementById("loginPassword");
        const regPass = document.getElementById("regPassword");
        const regConf = document.getElementById("regConfirmPassword");
        if (loginUser) loginUser.value = "";
        if (loginPass) loginPass.value = "";
        if (regPass) regPass.value = "";
        if (regConf) regConf.value = "";
    }
}

function handleRegisterSubmit(e) {
    if (e) e.preventDefault();
    const name = document.getElementById("regName")?.value?.trim() || "";
    const mobileRaw = document.getElementById("regMobile")?.value?.trim() || "";
    const username = document.getElementById("regUsername")?.value?.trim() || "";
    const password = document.getElementById("regPassword")?.value || "";
    const confirmPassword = document.getElementById("regConfirmPassword")?.value || "";
    const errBox = document.getElementById("registerError");

    function showRegError(msg) {
        if (errBox) {
            errBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1.5"></i> ${msg}`;
            errBox.classList.remove("hidden");
        }
    }

    if (!name) {
        showRegError("Please enter your Full Name.");
        return;
    }

    // Clean mobile number (strip any spaces or special characters)
    const cleanMobile = mobileRaw.replace(/[^0-9]/g, "");
    if (cleanMobile.length !== 10) {
        showRegError("Please enter a valid 10-digit mobile number.");
        return;
    }

    if (username.length < 3) {
        showRegError("Username must be at least 3 characters long.");
        return;
    }

    if (password.length < 4) {
        showRegError("Password must be at least 4 characters long.");
        return;
    }

    if (password !== confirmPassword) {
        showRegError("Passwords do not match. Please verify.");
        return;
    }

    const users = getRegisteredUsers();

    // Check if mobile already exists in registered database
    const existingMobIdx = users.findIndex(u => (u.mobile || "").replace(/[^0-9]/g, "") === cleanMobile);
    if (existingMobIdx !== -1) {
        const existing = users[existingMobIdx];
        // If it was the initial placeholder/seed user, allow overwriting with newly chosen credentials
        if (existing.id === "usr-sunny" || existing.createdAt === "2026-01-01T00:00:00.000Z") {
            users[existingMobIdx] = {
                id: `usr-${Date.now()}`,
                name: name,
                mobile: cleanMobile,
                username: username,
                password: password,
                createdAt: new Date().toISOString()
            };
            saveRegisteredUsers(users);
            sessionStorage.setItem(STORAGE_KEYS.SESSION, "true");
            sessionStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(users[existingMobIdx]));
            if (errBox) errBox.classList.add("hidden");
            showToast(`Account registered! Welcome, ${name}`, "fa-user-check");
            checkAuthSession();
            return;
        }

        showRegError(`Mobile number +91 ${cleanMobile} is already registered. <button type="button" onclick="switchAuthMode('login')" class="underline font-bold text-cyan-300 ml-1">Sign In here</button>`);
        return;
    }

    // STRICT UNIQUE USERNAME VALIDATION (excluding if same user)
    const existingUser = users.find(u => (u.username || "").toLowerCase() === username.toLowerCase());
    if (existingUser && (existingUser.id !== "usr-sunny")) {
        showRegError(`Username '${username}' is already taken. Please choose another username.`);
        return;
    }

    // Create and save new user
    const newUser = {
        id: `usr-${Date.now()}`,
        name: name,
        mobile: cleanMobile,
        username: username,
        password: password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveRegisteredUsers(users);

    // Automatically authenticate the new user
    sessionStorage.setItem(STORAGE_KEYS.SESSION, "true");
    sessionStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(newUser));

    if (errBox) errBox.classList.add("hidden");
    showToast(`Account created! Welcome, ${name}`, "fa-user-check");
    checkAuthSession();
}

async function handleLoginSubmit(e) {
    if (e) e.preventDefault();
    const identifier = document.getElementById("loginUsername")?.value?.trim() || "";
    const passIn = document.getElementById("loginPassword")?.value || "";
    const errBox = document.getElementById("loginError");

    function showLogErr(msg) {
        if (errBox) {
            errBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1.5"></i> ${msg}`;
            errBox.classList.remove("hidden");
        }
    }

    if (!identifier || !passIn) {
        showLogErr("Please enter both username/mobile and password.");
        return;
    }

    let users = getRegisteredUsers();
    const cleanId = identifier.replace(/[^0-9]/g, "");

    // 1. Check local users
    let matchedUser = users.find(u => {
        const matchUser = (u.username || "").toLowerCase() === identifier.toLowerCase();
        const matchMob = cleanId.length === 10 && (u.mobile || "").replace(/[^0-9]/g, "") === cleanId;
        return (matchUser || matchMob) && u.password === passIn;
    });

    // 2. If not found locally, try pulling latest users from server/cloud database
    if (!matchedUser) {
        users = await pullUsersFromCloud();
        matchedUser = users.find(u => {
            const matchUser = (u.username || "").toLowerCase() === identifier.toLowerCase();
            const matchMob = cleanId.length === 10 && (u.mobile || "").replace(/[^0-9]/g, "") === cleanId;
            return (matchUser || matchMob) && u.password === passIn;
        });
    }

    if (matchedUser) {
        sessionStorage.setItem(STORAGE_KEYS.SESSION, "true");
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(matchedUser));
        if (errBox) errBox.classList.add("hidden");
        showToast(`Welcome ${matchedUser.name}! Active session`, "fa-circle-check");
        checkAuthSession();
    } else {
        showLogErr("Invalid username/mobile number or password. If you are a new user, click Create Account.");
    }
}

function toggleLoginPassword() {
    const passInput = document.getElementById("loginPassword");
    const icon = document.getElementById("loginPassIcon");
    if (!passInput) return;
    if (passInput.type === "password") {
        passInput.type = "text";
        if (icon) { icon.classList.remove("fa-eye"); icon.classList.add("fa-eye-slash"); }
    } else {
        passInput.type = "password";
        if (icon) { icon.classList.remove("fa-eye-slash"); icon.classList.add("fa-eye"); }
    }
}

function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    showToast("Logged out securely", "fa-lock");
    checkAuthSession();
}

function saveNewCredentials(e) {
    if (e) e.preventDefault();
    const activeUser = getActiveUser();
    const newPass = document.getElementById("settingPassword")?.value?.trim();

    if (!newPass) {
        showToast("Please enter a new password", "fa-triangle-exclamation");
        return;
    }

    const users = getRegisteredUsers();
    const idx = users.findIndex(u => u.username === activeUser.username || u.mobile === activeUser.mobile);
    if (idx !== -1) {
        users[idx].password = newPass;
        saveRegisteredUsers(users);
        activeUser.password = newPass;
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(activeUser));
        showToast("Password updated successfully", "fa-key");
    }
}


// ==========================================
// 2. DASHBOARD INITIALIZATION & TABS
// ==========================================
function initDashboard() {
    const activeUser = getActiveUser();
    const nameEl = document.getElementById("currentLoggedUserName");
    const mobileEl = document.getElementById("currentLoggedUserMobile");
    if (nameEl) nameEl.textContent = activeUser.name || "Administrator";
    if (mobileEl && activeUser.mobile) mobileEl.textContent = `(+91 ${activeUser.mobile})`;

    // Personal User Profile Elements (Spotify-like individual account display)
    const profName = document.getElementById("profileFullName");
    const profMobile = document.getElementById("profileMobile");
    const profUser = document.getElementById("profileUsername");
    const profId = document.getElementById("profileUserId");
    const profAvatar = document.getElementById("profileAvatarInitials");

    if (profName) profName.textContent = activeUser.name || "Administrator";
    if (profMobile) profMobile.textContent = activeUser.mobile || "—";
    if (profUser) profUser.textContent = activeUser.username || "admin";
    if (profId) profId.textContent = activeUser.id || ("usr-" + (activeUser.username || "active"));
    if (profAvatar) {
        const initials = (activeUser.name || "Admin")
            .split(" ")
            .map(n => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
        profAvatar.textContent = initials || "A";
    }

    // Settings inputs
    const setUsername = document.getElementById("settingUsername");
    const setPass = document.getElementById("settingPassword");
    if (setUsername) setUsername.value = activeUser.username || "";
    if (setPass) setPass.value = "";

    updateBadgesAndStats();
    renderProductsGrid();
    renderLeadsTable();
    renderReviewsGrid();
}

function switchTab(tabId) {
    currentTab = tabId;
    
    // Update navigation buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.className = "tab-btn px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer";
    });
    const activeNav = document.getElementById(`tabNav-${tabId}`);
    if (activeNav) {
        activeNav.className = "tab-btn px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 bg-cyan-600 text-white shadow-lg shadow-cyan-950/40 cursor-pointer";
    }

    // Update Panes
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.add("hidden"));
    const activePane = document.getElementById(`tabContent-${tabId}`);
    if (activePane) activePane.classList.remove("hidden");

    updateBadgesAndStats();
}

function updateBadgesAndStats() {
    const products = getStoredProducts();
    const leads = getStoredLeads();
    const reviews = getStoredReviews();

    const bProd = document.getElementById("badgeCountProducts");
    const bLeads = document.getElementById("badgeCountLeads");
    const bRev = document.getElementById("badgeCountReviews");

    if (bProd) bProd.textContent = products.length;
    if (bLeads) bLeads.textContent = leads.length;
    if (bRev) bRev.textContent = reviews.length;

    const sProd = document.getElementById("statBoxProducts");
    const sLeads = document.getElementById("statBoxLeads");
    const sRev = document.getElementById("statBoxReviews");

    if (sProd) sProd.textContent = products.length;
    if (sLeads) sLeads.textContent = leads.length;
    if (sRev) sRev.textContent = reviews.length;
}


// ==========================================
// 3. PRODUCTS CATALOG CONTROLLER
// ==========================================
function getStoredProducts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn("Failed to parse products:", e);
    }
    return FACTORY_PRODUCTS;
}

function saveProducts(productsList) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(productsList));
    updateBadgesAndStats();
}

function renderProductsGrid(filterText = "") {
    const container = document.getElementById("adminProductsGrid");
    if (!container) return;

    let products = getStoredProducts();
    if (filterText.trim()) {
        const query = filterText.toLowerCase();
        products = products.filter(p => 
            p.title.toLowerCase().includes(query) ||
            (p.categoryBadge && p.categoryBadge.toLowerCase().includes(query)) ||
            (p.features && p.features.some(f => f.toLowerCase().includes(query)))
        );
    }

    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-12 text-center text-slate-500 space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800">
                <i class="fa-solid fa-box-open text-3xl opacity-40"></i>
                <p class="text-xs">No products found. Click "+ Add New Product" to create one.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map((p, idx) => `
        <div class="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition group shadow-lg">
            <div class="space-y-3">
                <!-- Thumbnail & Badge -->
                <div class="relative h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img src="${escapeHtml(p.image || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80')}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                    <span class="absolute top-2.5 left-2.5 bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        ${escapeHtml(p.categoryBadge || 'Architectural Glass')}
                    </span>
                    <span class="absolute top-2.5 right-2.5 bg-slate-900/80 text-slate-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md">
                        #${idx + 1}
                    </span>
                </div>

                <!-- Titles & Info -->
                <div>
                    <h4 class="font-bold text-white text-sm group-hover:text-cyan-300 transition">${escapeHtml(p.title)}</h4>
                    <p class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(p.subtitle || '')}</p>
                </div>

                <p class="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    ${escapeHtml(p.description || '')}
                </p>

                <!-- Features Tags -->
                ${p.features && p.features.length ? `
                    <div class="flex flex-wrap gap-1 pt-1">
                        ${p.features.slice(0, 3).map(f => `
                            <span class="bg-slate-950/80 border border-slate-800 text-slate-300 text-[9px] px-2 py-0.5 rounded-md">
                                ${escapeHtml(f)}
                            </span>
                        `).join("")}
                        ${p.features.length > 3 ? `<span class="text-slate-500 text-[9px] self-center">+${p.features.length - 3} more</span>` : ''}
                    </div>
                ` : ''}
            </div>

            <!-- Actions Bar -->
            <div class="border-t border-slate-800/80 pt-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-1">
                    <button onclick="moveProduct('${p.id}', -1)" ${idx === 0 ? 'disabled' : ''} class="w-7 h-7 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white rounded-lg flex items-center justify-center text-xs transition cursor-pointer" title="Move Up">
                        <i class="fa-solid fa-arrow-up"></i>
                    </button>
                    <button onclick="moveProduct('${p.id}', 1)" ${idx === products.length - 1 ? 'disabled' : ''} class="w-7 h-7 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white rounded-lg flex items-center justify-center text-xs transition cursor-pointer" title="Move Down">
                        <i class="fa-solid fa-arrow-down"></i>
                    </button>
                </div>

                <div class="flex items-center gap-1.5">
                    <button onclick="openProductModal('${p.id}')" class="bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/40 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button onclick="deleteProduct('${p.id}')" class="bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/30 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer" title="Delete Product">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

function filterProductsCatalog() {
    const input = document.getElementById("productSearchInput");
    renderProductsGrid(input ? input.value : "");
}

function openProductModal(productId = null) {
    const modal = document.getElementById("productModal");
    const titleEl = document.getElementById("productModalTitle");
    const form = document.getElementById("productEditForm");
    if (!modal || !form) return;

    form.reset();

    if (productId) {
        const products = getStoredProducts();
        const prod = products.find(p => p.id === productId);
        if (prod) {
            if (titleEl) titleEl.textContent = `Edit Product: ${prod.title}`;
            document.getElementById("prodFormId").value = prod.id;
            document.getElementById("prodFormTitle").value = prod.title || "";
            document.getElementById("prodFormSubtitle").value = prod.subtitle || "";
            document.getElementById("prodFormBadge").value = prod.categoryBadge || "";
            document.getElementById("prodFormImage").value = prod.image || "";
            document.getElementById("prodFormDesc").value = prod.description || "";
            document.getElementById("prodFormFeatures").value = (prod.features || []).join(", ");
        }
    } else {
        if (titleEl) titleEl.textContent = "Add New Product";
        document.getElementById("prodFormId").value = "";
        document.getElementById("prodFormImage").value = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80";
        document.getElementById("prodFormBadge").value = "Architectural Glazing";
    }

    updateLivePreview();
    modal.classList.remove("hidden");
}

function closeProductModal() {
    const modal = document.getElementById("productModal");
    if (modal) modal.classList.add("hidden");
}

function setPresetImg(url) {
    const input = document.getElementById("prodFormImage");
    if (input) input.value = url;
    updateLivePreview();
}

function updateLivePreview() {
    const title = document.getElementById("prodFormTitle")?.value?.trim() || "Product Title";
    const subtitle = document.getElementById("prodFormSubtitle")?.value?.trim() || "Product subtitle description";
    const badge = document.getElementById("prodFormBadge")?.value?.trim() || "Architectural Glass";
    const imgUrl = document.getElementById("prodFormImage")?.value?.trim() || "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80";
    const desc = document.getElementById("prodFormDesc")?.value?.trim() || "Detailed specifications and description for this architectural glazing solution.";
    const featRaw = document.getElementById("prodFormFeatures")?.value?.trim() || "Premium Finish, Custom Sizing";

    const prevTitle = document.getElementById("previewTitle");
    const prevSub = document.getElementById("previewSubtitle");
    const prevBadge = document.getElementById("previewBadge");
    const prevImg = document.getElementById("previewImg");
    const prevDesc = document.getElementById("previewDesc");
    const prevFeat = document.getElementById("previewFeatures");

    if (prevTitle) prevTitle.textContent = title;
    if (prevSub) prevSub.textContent = subtitle;
    if (prevBadge) prevBadge.textContent = badge;
    if (prevImg) prevImg.src = imgUrl;
    if (prevDesc) prevDesc.textContent = desc;

    if (prevFeat) {
        const feats = featRaw.split(",").map(s => s.trim()).filter(Boolean);
        prevFeat.innerHTML = feats.map(f => `
            <span class="bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-[9px] px-2 py-0.5 rounded-md">${escapeHtml(f)}</span>
        `).join("");
    }
}

function saveProductForm(e) {
    if (e) e.preventDefault();
    const id = document.getElementById("prodFormId")?.value;
    const title = document.getElementById("prodFormTitle")?.value?.trim();
    const subtitle = document.getElementById("prodFormSubtitle")?.value?.trim() || "";
    const categoryBadge = document.getElementById("prodFormBadge")?.value?.trim() || "Architectural Glazing";
    const image = document.getElementById("prodFormImage")?.value?.trim() || "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80";
    const description = document.getElementById("prodFormDesc")?.value?.trim() || "";
    const featuresRaw = document.getElementById("prodFormFeatures")?.value?.trim() || "";
    const features = featuresRaw.split(",").map(s => s.trim()).filter(Boolean);

    if (!title) {
        showToast("Please enter a product title", "fa-triangle-exclamation");
        return;
    }

    let products = getStoredProducts();

    if (id) {
        // Edit existing product
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) {
            products[idx] = { ...products[idx], title, subtitle, categoryBadge, image, description, features };
            showToast(`Product "${title}" updated!`, "fa-circle-check");
        }
    } else {
        // Create new product
        const newProduct = {
            id: `prod-${Date.now()}`,
            title,
            subtitle,
            categoryBadge,
            image,
            description,
            features
        };
        products.unshift(newProduct);
        showToast(`New product "${title}" added!`, "fa-circle-check");
    }

    saveProducts(products);
    renderProductsGrid();
    closeProductModal();
}

async function deleteProduct(id) {
    let products = getStoredProducts();
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    const confirmed = await askConfirm({
        title: "Delete Product",
        message: `Are you sure you want to delete "${prod.title}" from your catalog?`,
        confirmText: "Delete Product",
        icon: "fa-trash-can",
        isDanger: true
    });
    if (!confirmed) return;

    products = products.filter(p => p.id !== id);
    saveProducts(products);
    requestAnimationFrame(() => {
        renderProductsGrid();
        showToast(`Product "${prod.title}" deleted`, "fa-trash-can");
    });
}

function moveProduct(id, direction) {
    let products = getStoredProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return;

    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= products.length) return;

    const item = products.splice(idx, 1)[0];
    products.splice(targetIdx, 0, item);

    saveProducts(products);
    requestAnimationFrame(() => {
        renderProductsGrid();
    });
}

async function resetFactoryProducts() {
    const confirmed = await askConfirm({
        title: "Restore Default Catalog",
        message: "Reset product catalog to standard factory defaults? Any custom added items will be replaced.",
        confirmText: "Restore Defaults",
        icon: "fa-rotate-left",
        isDanger: false
    });
    if (!confirmed) return;

    saveProducts(FACTORY_PRODUCTS);
    requestAnimationFrame(() => {
        renderProductsGrid();
        showToast("Factory products catalog restored", "fa-rotate-left");
    });
}


// ==========================================
// 4. INQUIRIES & LEADS CONTROLLER
// ==========================================
function getStoredLeads() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.LEADS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn("Failed to parse quote leads:", e);
    }
    return [
        {
            id: "lead-1",
            clientName: "Sunil Mehta",
            clientPhone: "+91 98765 43210",
            clientAddress: "Plot 42, Sector 14, Sirsa",
            status: "PENDING",
            requirements: "Acoustic sliding windows for master bedroom",
            items: [
                { glassType: "DGU Double Glazing 24mm", width: 6, height: 5, quantity: 2, application: "Bedroom Window" }
            ],
            createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: "lead-2",
            clientName: "Harpreet Kaur",
            clientPhone: "+91 94160 12345",
            clientAddress: "Model Town, Bathinda",
            status: "CONTACTED",
            requirements: "Frameless 10mm shower cubicles with nano coating",
            items: [
                { glassType: "10mm Toughened Clear", width: 4, height: 7, quantity: 1, application: "Master Bathroom" }
            ],
            createdAt: new Date(Date.now() - 172800000).toISOString()
        }
    ];
}

function saveLeads(leads) {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    updateBadgesAndStats();
}

function renderLeadsTable(searchQuery = "") {
    const tbody = document.getElementById("adminLeadsTableBody");
    const emptyState = document.getElementById("noLeadsState");
    if (!tbody) return;

    let leads = getStoredLeads();

    // Filter by status
    if (activeLeadStatusFilter !== "ALL") {
        leads = leads.filter(l => (l.status || "PENDING").toUpperCase() === activeLeadStatusFilter);
    }

    // Filter by search text
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        leads = leads.filter(l => 
            (l.clientName && l.clientName.toLowerCase().includes(q)) ||
            (l.clientPhone && l.clientPhone.toLowerCase().includes(q)) ||
            (l.clientAddress && l.clientAddress.toLowerCase().includes(q)) ||
            (l.requirements && l.requirements.toLowerCase().includes(q))
        );
    }

    if (leads.length === 0) {
        tbody.innerHTML = "";
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (emptyState) emptyState.classList.add("hidden");

    tbody.innerHTML = leads.map((lead, idx) => {
        const dateStr = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recent";
        const cleanPhone = (lead.clientPhone || "").replace(/[^0-9]/g, "");
        const waLink = cleanPhone ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=Hello%20${encodeURIComponent(lead.clientName || 'Client')},%20this%20is%20Sunny%20Mehta%20from%20Ajanta%20Glass.` : "#";
        const status = (lead.status || "PENDING").toUpperCase();

        return `
            <tr class="hover:bg-slate-900/60 transition">
                <!-- Date -->
                <td class="p-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    ${escapeHtml(dateStr)}
                </td>

                <!-- Client Info -->
                <td class="p-3.5">
                    <div class="font-bold text-white text-xs">${escapeHtml(lead.clientName || 'Anonymous')}</div>
                    <div class="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]">${escapeHtml(lead.requirements || 'No special notes')}</div>
                </td>

                <!-- Contact & WhatsApp Links -->
                <td class="p-3.5 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                        <a href="tel:${escapeHtml(lead.clientPhone)}" class="text-cyan-400 font-mono text-xs font-bold hover:underline flex items-center gap-1" title="Call Client">
                            <i class="fa-solid fa-phone text-[10px]"></i>
                            <span>${escapeHtml(lead.clientPhone || 'N/A')}</span>
                        </a>
                        ${cleanPhone ? `
                            <a href="${waLink}" target="_blank" class="w-6 h-6 rounded-md bg-emerald-950 border border-emerald-700/50 text-emerald-400 flex items-center justify-center text-xs hover:bg-emerald-900 transition" title="Chat on WhatsApp">
                                <i class="fa-brands fa-whatsapp"></i>
                            </a>
                        ` : ''}
                    </div>
                </td>

                <!-- Location -->
                <td class="p-3.5 text-slate-300 text-xs truncate max-w-[150px]" title="${escapeHtml(lead.clientAddress || '')}">
                    <i class="fa-solid fa-location-dot text-slate-500 text-[10px] mr-1"></i>
                    ${escapeHtml(lead.clientAddress || 'Sirsa / Region')}
                </td>

                <!-- Items & Specs -->
                <td class="p-3.5 text-xs text-slate-300">
                    <span class="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono text-cyan-300">
                        <i class="fa-solid fa-layer-group text-[9px]"></i>
                        ${lead.items && lead.items.length ? `${lead.items.length} items` : 'Custom Scope'}
                    </span>
                </td>

                <!-- Status Selector -->
                <td class="p-3.5 whitespace-nowrap">
                    <select onchange="updateLeadStatus(${idx}, this.value)" class="bg-slate-950 border text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none transition cursor-pointer ${
                        status === 'COMPLETED' ? 'border-emerald-700 text-emerald-400' :
                        status === 'CONTACTED' ? 'border-indigo-700 text-indigo-400' :
                        'border-amber-700 text-amber-400'
                    }">
                        <option value="PENDING" ${status === 'PENDING' ? 'selected' : ''}>⏳ Pending</option>
                        <option value="CONTACTED" ${status === 'CONTACTED' ? 'selected' : ''}>📞 Contacted</option>
                        <option value="COMPLETED" ${status === 'COMPLETED' ? 'selected' : ''}>✅ Completed</option>
                    </select>
                </td>

                <!-- Delete Action -->
                <td class="p-3.5 text-right whitespace-nowrap">
                    <button onclick="deleteLead(${idx})" class="text-slate-500 hover:text-rose-400 p-1.5 transition text-xs cursor-pointer" title="Delete Inquiry">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function filterLeadsList() {
    const input = document.getElementById("leadSearchInput");
    renderLeadsTable(input ? input.value : "");
}

function filterLeadStatus(status) {
    activeLeadStatusFilter = status;
    document.querySelectorAll(".lead-status-btn").forEach(btn => {
        btn.className = "lead-status-btn text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-semibold hover:text-white cursor-pointer";
    });
    if (event && event.target) {
        event.target.className = "lead-status-btn text-xs px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold cursor-pointer";
    }
    renderLeadsTable();
}

function updateLeadStatus(index, newStatus) {
    const leads = getStoredLeads();
    if (leads[index]) {
        leads[index].status = newStatus;
        saveLeads(leads);
        renderLeadsTable();
        showToast(`Inquiry status set to ${newStatus}`, "fa-circle-check");
    }
}

async function deleteLead(index) {
    let leads = getStoredLeads();
    const item = leads[index];
    const name = item?.clientName ? `from "${item.clientName}"` : "";

    const confirmed = await askConfirm({
        title: "Delete Client Inquiry",
        message: `Are you sure you want to remove this client inquiry ${name}?`,
        confirmText: "Delete Inquiry",
        icon: "fa-trash-can",
        isDanger: true
    });
    if (!confirmed) return;

    leads.splice(index, 1);
    saveLeads(leads);
    renderLeadsTable();
    showToast("Inquiry removed", "fa-trash-can");
}

async function clearAllLeadsPrompt() {
    const confirmed = await askConfirm({
        title: "Clear All Inquiries",
        message: "Are you sure you want to permanently clear ALL customer inquiries? This cannot be undone.",
        confirmText: "Clear All",
        icon: "fa-triangle-exclamation",
        isDanger: true
    });
    if (!confirmed) return;

    saveLeads([]);
    renderLeadsTable();
    showToast("All inquiries cleared", "fa-trash-can");
}

function exportLeadsExcel() {
    const leads = getStoredLeads();
    if (leads.length === 0) {
        showToast("No inquiries available to export", "fa-circle-info");
        return;
    }

    let excelContent = `<?xml version="1.0"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    <Worksheet ss:Name="Ajanta Leads">
    <Table>
    <Row>
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Client Name</Data></Cell>
        <Cell><Data ss:Type="String">Phone Number</Data></Cell>
        <Cell><Data ss:Type="String">Address / Site Location</Data></Cell>
        <Cell><Data ss:Type="String">Requirements Notes</Data></Cell>
        <Cell><Data ss:Type="String">Status</Data></Cell>
    </Row>`;

    leads.forEach(l => {
        const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-IN") : "Recent";
        excelContent += `
        <Row>
            <Cell><Data ss:Type="String">${escapeXml(dateStr)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(l.clientName || '')}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(l.clientPhone || '')}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(l.clientAddress || '')}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(l.requirements || '')}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(l.status || 'PENDING')}</Data></Cell>
        </Row>`;
    });

    excelContent += `</Table></Worksheet></Workbook>`;

    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Ajanta_Glass_Leads_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Excel spreadsheet downloaded", "fa-file-excel");
}

function exportLeadsCSV() {
    const leads = getStoredLeads();
    if (leads.length === 0) {
        showToast("No inquiries to export", "fa-circle-info");
        return;
    }

    const headers = ["Date", "Client Name", "Phone", "Location", "Notes", "Status"];
    const rows = leads.map(l => [
        `"${(l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '').replace(/"/g, '""')}"`,
        `"${(l.clientName || '').replace(/"/g, '""')}"`,
        `"${(l.clientPhone || '').replace(/"/g, '""')}"`,
        `"${(l.clientAddress || '').replace(/"/g, '""')}"`,
        `"${(l.requirements || '').replace(/"/g, '""')}"`,
        `"${(l.status || 'PENDING').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Ajanta_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("CSV file exported", "fa-file-csv");
}


// ==========================================
// 5. TESTIMONIALS & REVIEWS CONTROLLER
// ==========================================
function getStoredReviews() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.REVIEWS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn("Reviews parse error:", e);
    }
    return DEFAULT_REVIEWS;
}

function saveReviews(reviews) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    updateBadgesAndStats();
}

function renderReviewsGrid() {
    const container = document.getElementById("adminReviewsGrid");
    if (!container) return;

    const reviews = getStoredReviews();

    container.innerHTML = reviews.map((rev, idx) => `
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow">
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-bold text-white text-xs">${escapeHtml(rev.name)}</h4>
                        <p class="text-[10px] text-slate-400">${escapeHtml(rev.role || '')} • ${escapeHtml(rev.city || '')}</p>
                    </div>
                    <div class="text-amber-400 text-xs">
                        ${'★'.repeat(rev.rating || 5)}${'☆'.repeat(5 - (rev.rating || 5))}
                    </div>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed italic">
                    "${escapeHtml(rev.text)}"
                </p>
            </div>
            <div class="border-t border-slate-800/80 pt-2 flex items-center justify-end">
                <button onclick="deleteReview(${idx})" class="text-rose-400 hover:text-rose-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer">
                    <i class="fa-solid fa-trash-can text-[10px]"></i> Delete
                </button>
            </div>
        </div>
    `).join("");
}

function openAddReviewModal() {
    const modal = document.getElementById("reviewAddModal");
    if (modal) modal.classList.remove("hidden");
}

function closeAddReviewModal() {
    const modal = document.getElementById("reviewAddModal");
    if (modal) modal.classList.add("hidden");
}

function saveNewReview(e) {
    if (e) e.preventDefault();
    const name = document.getElementById("revFormName")?.value?.trim();
    const role = document.getElementById("revFormRole")?.value?.trim() || "Client";
    const rating = parseInt(document.getElementById("revFormRating")?.value || "5", 10);
    const text = document.getElementById("revFormText")?.value?.trim();

    if (!name || !text) {
        showToast("Please enter both client name and review text", "fa-triangle-exclamation");
        return;
    }

    const reviews = getStoredReviews();
    reviews.unshift({ name, role, city: "India", rating, text });
    saveReviews(reviews);
    renderReviewsGrid();
    closeAddReviewModal();
    showToast("Testimonial added to public website", "fa-star");
}

async function deleteReview(index) {
    let reviews = getStoredReviews();
    const item = reviews[index];
    const client = item?.name ? `from "${item.name}"` : "";

    const confirmed = await askConfirm({
        title: "Delete Testimonial",
        message: `Are you sure you want to remove this client review ${client}?`,
        confirmText: "Delete Review",
        icon: "fa-trash-can",
        isDanger: true
    });
    if (!confirmed) return;

    reviews.splice(index, 1);
    saveReviews(reviews);
    renderReviewsGrid();
    showToast("Review deleted", "fa-trash-can");
}

async function resetDefaultReviews() {
    const confirmed = await askConfirm({
        title: "Reset Testimonials",
        message: "Reset client testimonials to default showcase entries?",
        confirmText: "Reset Reviews",
        icon: "fa-rotate-left",
        isDanger: false
    });
    if (!confirmed) return;

    saveReviews(DEFAULT_REVIEWS);
    renderReviewsGrid();
    showToast("Default testimonials restored", "fa-rotate-left");
}


// ==========================================
// 6. DATA BACKUP & CLOUD SYNC
// ==========================================
function downloadJsonBackup() {
    const backupData = {
        app: "Ajanta Door & Window Systems",
        version: "2.0",
        exportedAt: new Date().toISOString(),
        products: getStoredProducts(),
        leads: getStoredLeads(),
        reviews: getStoredReviews()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Ajanta_Glass_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Full backup downloaded (.json)", "fa-download");
}

async function restoreJsonBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmed = await askConfirm({
        title: "Restore Backup Database",
        message: `Restore database from "${file.name}"? Current records will be replaced.`,
        confirmText: "Restore Database",
        icon: "fa-file-import",
        isDanger: false
    });
    if (!confirmed) {
        event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.products && Array.isArray(data.products)) {
                saveProducts(data.products);
            }
            if (data.leads && Array.isArray(data.leads)) {
                saveLeads(data.leads);
            }
            if (data.reviews && Array.isArray(data.reviews)) {
                saveReviews(data.reviews);
            }
            initDashboard();
            showToast("Database restored successfully!", "fa-circle-check");
        } catch (err) {
            showToast("Invalid backup file: " + err.message, "fa-triangle-exclamation");
        } finally {
            event.target.value = "";
        }
    };
    reader.readAsText(file);
}

async function syncAllCloudData() {
    const btn = document.getElementById("syncDataBtn");
    if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-arrows-rotate animate-spin text-[10px] text-emerald-400"></i> Syncing...`;
    }

    try {
        // Quick cloud check with KVDB hash
        const hashedKey = "sunny_ajanta_leads_key";
        const endpoint = `https://kvdb.io/T2p78Krq12XcfWn1vNiw9G/${hashedKey}`;
        const res = await fetch(endpoint).catch(() => null);
        if (res && res.ok) {
            const cloudLeads = await res.json().catch(() => null);
            if (Array.isArray(cloudLeads) && cloudLeads.length > 0) {
                // Merge cloud leads
                const localLeads = getStoredLeads();
                const merged = [...cloudLeads, ...localLeads.filter(l => !cloudLeads.some(c => c.id === l.id))];
                saveLeads(merged);
            }
        }
        showToast("Cloud sync completed successfully", "fa-arrows-rotate");
    } catch (e) {
        console.warn("Cloud sync note:", e);
        showToast("Local data verified", "fa-check");
    } finally {
        if (btn) {
            btn.innerHTML = `<i class="fa-solid fa-arrows-rotate text-[10px] text-emerald-400"></i> <span>Sync</span>`;
        }
        initDashboard();
    }
}


// ==========================================
// 7. UTILITIES & ASYNC CONFIRM (Non-blocking INP)
// ==========================================
function askConfirm({ title = "Confirm Action", message = "Are you sure you want to proceed?", confirmText = "Confirm", icon = "fa-trash-can", isDanger = true } = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById("customConfirmModal");
        const titleEl = document.getElementById("confirmTitle");
        const descEl = document.getElementById("confirmDesc");
        const actBtn = document.getElementById("confirmActionBtn");
        const actText = document.getElementById("confirmActionText");
        const cancelBtn = document.getElementById("confirmCancelBtn");
        const iconEl = document.getElementById("confirmIcon");
        const iconBox = document.getElementById("confirmIconBox");

        if (!modal || !actBtn || !cancelBtn) {
            resolve(true);
            return;
        }

        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = message;
        if (actText) actText.textContent = confirmText;
        if (iconEl) iconEl.className = `fa-solid ${icon}`;

        if (isDanger) {
            actBtn.className = "bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5";
            if (iconBox) iconBox.className = "w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xl flex-shrink-0";
        } else {
            actBtn.className = "bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-cyan-600/30 cursor-pointer flex items-center gap-1.5";
            if (iconBox) iconBox.className = "w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xl flex-shrink-0";
        }

        const onConfirm = () => {
            modal.classList.add("hidden");
            actBtn.removeEventListener("click", onConfirm);
            cancelBtn.removeEventListener("click", onCancel);
            resolve(true);
        };

        const onCancel = () => {
            modal.classList.add("hidden");
            actBtn.removeEventListener("click", onConfirm);
            cancelBtn.removeEventListener("click", onCancel);
            resolve(false);
        };

        actBtn.addEventListener("click", onConfirm, { once: true });
        cancelBtn.addEventListener("click", onCancel, { once: true });
        modal.classList.remove("hidden");
    });
}

function showToast(msg, iconClass = "fa-circle-check") {
    const toast = document.getElementById("toastNotification");
    const msgEl = document.getElementById("toastMsg");
    const iconEl = document.getElementById("toastIcon");

    if (!toast || !msgEl) return;
    msgEl.textContent = msg;
    if (iconEl) iconEl.className = `fa-solid ${iconClass} text-cyan-400 text-base`;

    toast.classList.remove("translate-y-20", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");

    if (toast.hideTimeout) clearTimeout(toast.hideTimeout);
    toast.hideTimeout = setTimeout(() => {
        toast.classList.add("translate-y-20", "opacity-0");
        toast.classList.remove("translate-y-0", "opacity-100");
    }, 3200);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeXml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

// ==========================================
// RUN ON PAGE LOAD
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    checkAuthSession();
});
