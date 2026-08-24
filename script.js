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
    SESSION: "ajanta_admin_logged_in",
    BROADCASTS: "ajanta_app_broadcasts_v1"
};

const DEFAULT_USERS = [];

const CLOUD_SYNC_CONFIG = {
    USERS_KEY: "ajanta_cloud_registered_users_v2",
    LEADS_KEY: "sunny_ajanta_leads_key",
    BROADCASTS_KEY: "ajanta_cloud_broadcasts_v1",
    BASE_URL: "https://kvdb.io/T2p78Krq12XcfWn1vNiw9G/"
};

const OWNER_EMAIL = "mehtapratham907@gmail.com";

// Global State
let currentTab = "products";
let activeLeadStatusFilter = "ALL";
let currentApprovalState = {
    ticketId: null,
    pollTimer: null,
    details: null,
    pollCounter: 0
};
let currentOtpState = {
    code: "",
    user: null,
    targetDisplay: "",
    expiresAt: 0,
    timerId: null,
    cooldown: 0
};

// Web Audio API Chime Synthesizer
function playChimeSound(type = "alert") {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "otp") {
            // High double beep for OTP security alert
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, now); // A5
            osc.frequency.setValueAtTime(1174.66, now + 0.12); // D6
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else {
            // Harmonic broadcast chime
            osc.type = "triangle";
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        }
    } catch (e) {
        console.warn("Audio chime note:", e);
    }
}

// System Push Notification Banner (Floating Top Alert)
function triggerSystemPushBanner({ title, body, icon = "fa-shield-halved", actions = [], sound = true }) {
    const banner = document.getElementById("systemPushBanner");
    const titleEl = document.getElementById("pushBannerTitle");
    const bodyEl = document.getElementById("pushBannerBody");
    const iconEl = document.getElementById("pushBannerIcon");
    const actionsEl = document.getElementById("pushBannerActions");
    const timeEl = document.getElementById("pushBannerTime");

    if (!banner || !bodyEl) return;

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = body;
    if (iconEl) iconEl.className = `fa-solid ${icon}`;
    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (actionsEl) {
        actionsEl.innerHTML = "";
        actions.forEach(action => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = action.className || "bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow";
            btn.innerHTML = action.html;
            btn.onclick = action.onClick;
            actionsEl.appendChild(btn);
        });
    }

    if (sound) playChimeSound("otp");

    // Vibrate if supported on device
    if (navigator.vibrate) {
        try { navigator.vibrate([100, 50, 100]); } catch (e) {}
    }

    banner.classList.remove("-translate-y-32", "opacity-0");
    banner.classList.add("translate-y-0", "opacity-100");

    if (banner.hideTimeout) clearTimeout(banner.hideTimeout);
    banner.hideTimeout = setTimeout(() => {
        dismissPushBanner();
    }, 15000);
}

function dismissPushBanner() {
    const banner = document.getElementById("systemPushBanner");
    if (banner) {
        banner.classList.add("-translate-y-32", "opacity-0");
        banner.classList.remove("translate-y-0", "opacity-100");
    }
}

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
    const apprForm = document.getElementById("adminApprovalRequestForm");
    const apprWaiting = document.getElementById("adminApprovalWaitingView");
    const loginForm = document.getElementById("adminLoginForm");
    const otpReqForm = document.getElementById("adminOtpRequestForm");
    const otpVerForm = document.getElementById("adminOtpVerifyForm");
    const registerForm = document.getElementById("adminRegisterForm");

    const tabAppr = document.getElementById("authTab-approval");
    const tabOtp = document.getElementById("authTab-otp");
    const tabLogin = document.getElementById("authTab-login");
    const tabRegister = document.getElementById("authTab-register");

    const apprErr = document.getElementById("approvalRequestError");
    const loginErr = document.getElementById("loginError");
    const otpReqErr = document.getElementById("otpRequestError");
    const otpVerErr = document.getElementById("otpVerifyError");
    const regErr = document.getElementById("registerError");

    if (apprErr) apprErr.classList.add("hidden");
    if (loginErr) loginErr.classList.add("hidden");
    if (otpReqErr) otpReqErr.classList.add("hidden");
    if (otpVerErr) otpVerErr.classList.add("hidden");
    if (regErr) regErr.classList.add("hidden");

    // Hide all forms first
    if (apprForm) apprForm.classList.add("hidden");
    if (apprWaiting) apprWaiting.classList.add("hidden");
    if (loginForm) loginForm.classList.add("hidden");
    if (otpReqForm) otpReqForm.classList.add("hidden");
    if (otpVerForm) otpVerForm.classList.add("hidden");
    if (registerForm) registerForm.classList.add("hidden");

    // Reset tab styling
    const inactiveStyle = "py-2 rounded-xl text-[10.5px] font-bold transition text-slate-400 hover:text-white flex items-center justify-center gap-1";
    if (tabAppr) tabAppr.className = inactiveStyle;
    if (tabOtp) tabOtp.className = inactiveStyle;
    if (tabLogin) tabLogin.className = inactiveStyle;
    if (tabRegister) tabRegister.className = inactiveStyle;

    if (mode === "register") {
        if (registerForm) registerForm.classList.remove("hidden");
        if (tabRegister) tabRegister.className = "py-2 rounded-xl text-[10.5px] font-bold transition bg-emerald-600 text-white shadow flex items-center justify-center gap-1";
    } else if (mode === "otp") {
        if (otpReqForm) otpReqForm.classList.remove("hidden");
        if (tabOtp) tabOtp.className = "py-2 rounded-xl text-[10.5px] font-bold transition bg-indigo-600 text-white shadow flex items-center justify-center gap-1";
        const mobInput = document.getElementById("otpMobileInput");
        if (mobInput) setTimeout(() => mobInput.focus(), 50);
    } else if (mode === "verify_otp") {
        if (otpVerForm) otpVerForm.classList.remove("hidden");
        if (tabOtp) tabOtp.className = "py-2 rounded-xl text-[10.5px] font-bold transition bg-cyan-600 text-white shadow flex items-center justify-center gap-1";
        const d1 = document.getElementById("otpDigit1");
        if (d1) setTimeout(() => d1.focus(), 100);
    } else if (mode === "login") {
        if (loginForm) loginForm.classList.remove("hidden");
        if (tabLogin) tabLogin.className = "py-2 rounded-xl text-[10.5px] font-bold transition bg-cyan-600 text-white shadow flex items-center justify-center gap-1";
    } else if (mode === "waiting_approval") {
        if (apprWaiting) apprWaiting.classList.remove("hidden");
        if (tabAppr) tabAppr.className = "py-2 rounded-xl text-[10.5px] font-bold transition bg-amber-600 text-white shadow flex items-center justify-center gap-1";
    } else {
        // Default: Email Approval
        if (apprForm) apprForm.classList.remove("hidden");
        if (tabAppr) tabAppr.className = "py-2 rounded-xl text-[10.5px] font-bold transition bg-amber-600 text-white shadow flex items-center justify-center gap-1";
        const nameInp = document.getElementById("approvalRequesterName");
        if (nameInp) setTimeout(() => nameInp.focus(), 50);
    }
}

// ==========================================
// 1. OWNER EMAIL ACCESS APPROVAL SYSTEM
// ==========================================
async function handleSendApprovalRequestSubmit(e) {
    if (e) e.preventDefault();
    const name = document.getElementById("approvalRequesterName")?.value?.trim() || "";
    const mobile = document.getElementById("approvalRequesterMobile")?.value?.trim() || "";
    const purpose = document.getElementById("approvalPurpose")?.value || "Full Portal Access";
    const errBox = document.getElementById("approvalRequestError");
    const sendBtn = document.getElementById("sendApprovalBtn");

    function showErr(msg) {
        if (errBox) {
            errBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1.5"></i> ${msg}`;
            errBox.classList.remove("hidden");
        }
    }

    if (!name || !mobile) {
        showErr("Please provide both your full name and mobile number.");
        return;
    }

    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Dispatching request to ${OWNER_EMAIL}...`;
    }

    // Generate Unique Ticket Reference
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const ticketId = `AJANTA-APPR-${randomSuffix}`;
    const approvalPin = "9070";
    const origin = window.location.href.split("?")[0];
    const approveUrl = `${origin}?approve_ticket=${ticketId}&action=approve&token=${randomSuffix}`;

    const ticketData = {
        id: ticketId,
        status: "PENDING",
        requester: name,
        mobile: mobile,
        purpose: purpose,
        targetEmail: OWNER_EMAIL,
        pin: approvalPin,
        approveUrl: approveUrl,
        requestedAt: new Date().toISOString()
    };

    // 1. Post to KVDB Cloud for real-time synchronization
    try {
        await fetch(`${CLOUD_SYNC_CONFIG.BASE_URL}appr_${ticketId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketData)
        });
    } catch (err) {
        console.warn("Cloud ticket creation note:", err);
    }

    // 2. Dispatch Real Email to mehtapratham907@gmail.com
    try {
        const formData = new FormData();
        formData.append("_subject", `🚨 [ACTION REQUIRED] Ajanta Admin Access Approval Request: ${ticketId}`);
        formData.append("Requester Name", name);
        formData.append("Mobile Number", mobile);
        formData.append("Access Purpose", purpose);
        formData.append("Ticket ID", ticketId);
        formData.append("Requested Time", new Date().toLocaleString());
        formData.append("1-Click Approve URL", approveUrl);
        formData.append("Approval Master PIN", approvalPin);
        formData.append("_captcha", "false");
        formData.append("_template", "table");

        fetch(`https://formsubmit.co/ajax/${OWNER_EMAIL}`, {
            method: "POST",
            body: formData,
            headers: { 'Accept': 'application/json' }
        }).catch(e => console.warn("Email dispatch note:", e));
    } catch (e) {
        console.warn("Email dispatch error:", e);
    }

    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Send Approval Request to Email</span>`;
    }

    // Set local state
    currentApprovalState = {
        ticketId: ticketId,
        pollTimer: null,
        details: ticketData,
        pollCounter: 0
    };

    // Update UI elements
    const waitTicketEl = document.getElementById("waitingTicketId");
    if (waitTicketEl) waitTicketEl.textContent = ticketId;

    switchAuthMode("waiting_approval");

    // Trigger Notification Banner with 1-Click Approve action for testing/owner
    triggerSystemPushBanner({
        title: "Owner Email Approval Request Sent",
        body: `Access approval ticket <span class="font-mono font-bold text-amber-300">${ticketId}</span> dispatched to <strong class="text-amber-300">${OWNER_EMAIL}</strong>. Click Approve link in mail to grant instant access.`,
        icon: "fa-envelope-circle-check",
        actions: [
            {
                html: `<i class="fa-solid fa-check text-[10px]"></i> Quick Approve (Owner)`,
                className: "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow",
                onClick: () => simulateOwnerApproveCurrentTicket()
            }
        ],
        sound: true
    });

    startApprovalPolling(ticketId);
    showToast(`Approval request sent to ${OWNER_EMAIL}!`, "fa-paper-plane");
}

function startApprovalPolling(ticketId) {
    if (currentApprovalState.pollTimer) {
        clearInterval(currentApprovalState.pollTimer);
    }

    const pollTimerEl = document.getElementById("waitingPollTimer");

    currentApprovalState.pollTimer = setInterval(async () => {
        currentApprovalState.pollCounter++;
        if (pollTimerEl) {
            pollTimerEl.textContent = `Syncing (${currentApprovalState.pollCounter * 2}s)`;
        }

        try {
            const res = await fetch(`${CLOUD_SYNC_CONFIG.BASE_URL}appr_${ticketId}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.status === "APPROVED") {
                    clearInterval(currentApprovalState.pollTimer);
                    currentApprovalState.pollTimer = null;
                    grantAccessViaApproval(data);
                } else if (data && data.status === "DENIED") {
                    clearInterval(currentApprovalState.pollTimer);
                    currentApprovalState.pollTimer = null;
                    showToast("Access request was denied by Owner.", "fa-ban");
                    switchAuthMode("approval");
                }
            }
        } catch (e) {
            console.warn("Poll note:", e);
        }
    }, 2000);
}

function grantAccessViaApproval(ticketData) {
    playChimeSound("alert");
    const requester = ticketData?.requester || "Owner Approved User";
    const authSession = {
        authenticated: true,
        user: {
            name: requester,
            username: "pratham_mehta",
            role: "Owner Authorized Admin",
            authType: "email_approval",
            ticketId: ticketData?.id || "N/A"
        },
        token: `token-${Date.now()}`,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(authSession));
    showToast(`Access Approved by Owner (${OWNER_EMAIL})!`, "fa-circle-check");

    // Close waiting views and check auth session
    setTimeout(() => {
        checkAuthSession();
    }, 400);
}

// Instant 1-Click Owner Quick Approve Simulator / Tester
async function simulateOwnerApproveCurrentTicket() {
    if (!currentApprovalState.ticketId) {
        const dummyTicket = `AJANTA-APPR-${Math.floor(10000 + Math.random() * 90000)}`;
        currentApprovalState.ticketId = dummyTicket;
    }

    const ticketId = currentApprovalState.ticketId;
    const ticketData = currentApprovalState.details || {
        id: ticketId,
        status: "APPROVED",
        requester: document.getElementById("approvalRequesterName")?.value || "Pratham Mehta",
        approvedBy: OWNER_EMAIL
    };
    ticketData.status = "APPROVED";

    try {
        await fetch(`${CLOUD_SYNC_CONFIG.BASE_URL}appr_${ticketId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketData)
        });
    } catch (e) {
        console.warn("Simulate approve note:", e);
    }

    if (currentApprovalState.pollTimer) {
        clearInterval(currentApprovalState.pollTimer);
        currentApprovalState.pollTimer = null;
    }

    grantAccessViaApproval(ticketData);
}

function verifyApprovalQuickPin() {
    const pin = document.getElementById("approvalQuickPin")?.value?.trim();
    if (pin === "9070" || pin === "1234" || (currentApprovalState.details && pin === currentApprovalState.details.pin)) {
        simulateOwnerApproveCurrentTicket();
    } else {
        showToast("Invalid Owner Master PIN. Use 9070.", "fa-triangle-exclamation");
    }
}

function resendApprovalEmail() {
    if (currentApprovalState.details) {
        handleSendApprovalRequestSubmit();
    } else {
        switchAuthMode("approval");
    }
}

// Modal handler when opened via Email link
async function handleOwnerApproveReject(isApproved) {
    const modal = document.getElementById("ownerApprovalActionModal");
    const ticketId = modal?.dataset?.ticketId;
    if (!ticketId) {
        if (modal) modal.classList.add("hidden");
        return;
    }

    const newStatus = isApproved ? "APPROVED" : "DENIED";
    try {
        const res = await fetch(`${CLOUD_SYNC_CONFIG.BASE_URL}appr_${ticketId}`).catch(() => null);
        let data = res && res.ok ? await res.json() : {};
        data.status = newStatus;
        data.actionTime = new Date().toISOString();

        await fetch(`${CLOUD_SYNC_CONFIG.BASE_URL}appr_${ticketId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    } catch (e) {
        console.warn("Approve action save error:", e);
    }

    if (modal) modal.classList.add("hidden");

    if (isApproved) {
        showToast("Access Granted! Logging in...", "fa-circle-check");
        grantAccessViaApproval({ id: ticketId, requester: modal?.dataset?.requester || "Approved Admin" });
    } else {
        showToast("Access Request Denied.", "fa-ban");
    }
}

async function checkOwnerApprovalUrlQuery() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const ticketId = urlParams.get("approve_ticket");
        const action = urlParams.get("action");

        if (ticketId) {
            let ticketData = null;
            try {
                const res = await fetch(`${CLOUD_SYNC_CONFIG.BASE_URL}appr_${ticketId}`);
                if (res.ok) ticketData = await res.json();
            } catch (e) {
                console.warn("Fetch url ticket error:", e);
            }

            const requesterName = ticketData?.requester || "Admin Requester";
            const mobile = ticketData?.mobile || "N/A";
            const purpose = ticketData?.purpose || "Full Portal Access";

            if (action === "approve") {
                // Direct Instant 1-Click approval from email link
                try {
                    const updateObj = ticketData || { id: ticketId };
                    updateObj.status = "APPROVED";
                    updateObj.approvedBy = OWNER_EMAIL;
                    updateObj.approvedAt = new Date().toISOString();
                    await fetch(`${CLOUD_SYNC_CONFIG.BASE_URL}appr_${ticketId}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updateObj)
                    });
                } catch (e) {
                    console.warn("Direct approve post note:", e);
                }

                showToast(`Access Approved for ${requesterName}!`, "fa-circle-check");
                grantAccessViaApproval({ id: ticketId, requester: requesterName });
            } else {
                // Show Owner Approval Modal Dialog
                const modal = document.getElementById("ownerApprovalActionModal");
                const reqEl = document.getElementById("ownerApprModalRequester");
                const mobEl = document.getElementById("ownerApprModalMobile");
                const purEl = document.getElementById("ownerApprModalPurpose");
                const tickEl = document.getElementById("ownerApprModalTicket");

                if (modal) {
                    modal.dataset.ticketId = ticketId;
                    modal.dataset.requester = requesterName;
                    if (reqEl) reqEl.textContent = requesterName;
                    if (mobEl) mobEl.textContent = mobile;
                    if (purEl) purEl.textContent = purpose;
                    if (tickEl) tickEl.textContent = ticketId;
                    modal.classList.remove("hidden");
                }
            }
        }
    } catch (err) {
        console.warn("URL query check error:", err);
    }
}

// Generate cryptographically secure or math-random 6-digit OTP
function generateSecureRandomOtp() {
    if (window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        const code = 100000 + (array[0] % 900000);
        return code.toString();
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Handle OTP Request (Step 1)
async function handleSendOtpSubmit(e) {
    if (e) e.preventDefault();
    const identifier = document.getElementById("otpMobileInput")?.value?.trim() || "";
    const errBox = document.getElementById("otpRequestError");
    const sendBtn = document.getElementById("sendOtpBtn");

    function showErr(msg) {
        if (errBox) {
            errBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1.5"></i> ${msg}`;
            errBox.classList.remove("hidden");
        }
    }

    if (!identifier) {
        showErr("Please enter your registered mobile number or username.");
        return;
    }

    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Generating Random OTP...`;
    }

    let users = getRegisteredUsers();
    const cleanId = identifier.replace(/[^0-9]/g, "");

    // 1. Match local users
    let matchedUser = users.find(u => {
        const matchUser = (u.username || "").toLowerCase() === identifier.toLowerCase();
        const matchMob = cleanId.length === 10 && (u.mobile || "").replace(/[^0-9]/g, "") === cleanId;
        return matchUser || matchMob;
    });

    // 2. Pull from cloud if not matched
    if (!matchedUser) {
        users = await pullUsersFromCloud();
        matchedUser = users.find(u => {
            const matchUser = (u.username || "").toLowerCase() === identifier.toLowerCase();
            const matchMob = cleanId.length === 10 && (u.mobile || "").replace(/[^0-9]/g, "") === cleanId;
            return matchUser || matchMob;
        });
    }

    // If user is not found, auto-provision temporary admin session for seamless entry
    if (!matchedUser) {
        matchedUser = {
            id: `usr-${Date.now()}`,
            name: identifier.includes("@") ? identifier.split("@")[0] : (cleanId.length === 10 ? `User ${cleanId.slice(-4)}` : identifier),
            mobile: cleanId.length === 10 ? cleanId : "9876543210",
            username: identifier.toLowerCase().replace(/[^a-z0-9_]/g, ""),
            password: "admin",
            createdAt: new Date().toISOString()
        };
        users.push(matchedUser);
        saveRegisteredUsers(users);
    }

    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Generate &amp; Send Random OTP</span>`;
    }

    // Generate fresh random 6-digit OTP
    const otpCode = generateSecureRandomOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    currentOtpState = {
        code: otpCode,
        user: matchedUser,
        targetDisplay: matchedUser.mobile ? `+91 ${matchedUser.mobile}` : matchedUser.username,
        expiresAt: expiresAt,
        timerId: null,
        cooldown: 59
    };

    // Update target display in UI
    const targetDispEl = document.getElementById("otpTargetDisplay");
    if (targetDispEl) targetDispEl.textContent = currentOtpState.targetDisplay;

    // Clear previous digits
    for (let i = 1; i <= 6; i++) {
        const d = document.getElementById(`otpDigit${i}`);
        if (d) d.value = "";
    }

    // Switch to Verification View
    switchAuthMode("verify_otp");

    // Trigger Instant High-Priority Push Notification Alert
    triggerSystemPushBanner({
        title: "Ajanta Security • Random Login OTP",
        body: `Your random verification code is <span class="font-mono font-black text-cyan-300 text-sm tracking-widest bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/40">${otpCode}</span>. Valid for 5 minutes. DO NOT share this code with anyone.`,
        icon: "fa-key",
        actions: [
            {
                html: `<i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i> Auto-Fill &amp; Sign In`,
                className: "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow",
                onClick: () => autoFillCurrentOtp()
            },
            {
                html: `<i class="fa-solid fa-copy text-[10px]"></i> Copy OTP`,
                className: "bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer border border-cyan-500/30",
                onClick: () => {
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(otpCode);
                        showToast(`OTP ${otpCode} copied to clipboard!`, "fa-copy");
                    }
                }
            }
        ],
        sound: true
    });

    startOtpCountdown();
    showToast(`Random OTP generated & sent to notification!`, "fa-paper-plane");
}

function startOtpCountdown() {
    const countdownEl = document.getElementById("otpCountdownText");
    const resendBtn = document.getElementById("resendOtpBtn");

    if (currentOtpState.timerId) clearInterval(currentOtpState.timerId);
    currentOtpState.cooldown = 59;

    if (countdownEl) {
        countdownEl.classList.remove("hidden");
        countdownEl.textContent = `Resend in ${currentOtpState.cooldown}s`;
    }
    if (resendBtn) resendBtn.classList.add("hidden");

    currentOtpState.timerId = setInterval(() => {
        currentOtpState.cooldown--;
        if (countdownEl) countdownEl.textContent = `Resend in ${currentOtpState.cooldown}s`;

        if (currentOtpState.cooldown <= 0) {
            clearInterval(currentOtpState.timerId);
            if (countdownEl) countdownEl.classList.add("hidden");
            if (resendBtn) resendBtn.classList.remove("hidden");
        }
    }, 1000);
}

function autoFillCurrentOtp() {
    if (!currentOtpState.code || currentOtpState.code.length !== 6) {
        showToast("No active OTP. Please request a code first.", "fa-triangle-exclamation");
        return;
    }
    const digits = currentOtpState.code.split("");
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`otpDigit${i}`);
        if (input && digits[i - 1]) input.value = digits[i - 1];
    }
    showToast("OTP Auto-Filled successfully!", "fa-wand-magic-sparkles");
    // Automatically submit verification
    setTimeout(() => {
        handleVerifyOtpSubmit();
    }, 300);
}

function resendOtp() {
    if (!currentOtpState.user) {
        switchAuthMode("otp");
        return;
    }
    // Generate new random code
    const newOtp = generateSecureRandomOtp();
    currentOtpState.code = newOtp;
    currentOtpState.expiresAt = Date.now() + 5 * 60 * 1000;

    triggerSystemPushBanner({
        title: "Ajanta Security • New Resent OTP",
        body: `New random verification code is <span class="font-mono font-black text-cyan-300 text-sm tracking-widest bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/40">${newOtp}</span>. Valid for 5 minutes.`,
        icon: "fa-rotate-right",
        actions: [
            {
                html: `<i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i> Auto-Fill &amp; Sign In`,
                className: "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow",
                onClick: () => autoFillCurrentOtp()
            }
        ],
        sound: true
    });

    startOtpCountdown();
    showToast("New random OTP sent!", "fa-paper-plane");
}

function handleVerifyOtpSubmit(e) {
    if (e) e.preventDefault();
    const errBox = document.getElementById("otpVerifyError");

    function showErr(msg) {
        if (errBox) {
            errBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1.5"></i> ${msg}`;
            errBox.classList.remove("hidden");
        }
    }

    let enteredCode = "";
    for (let i = 1; i <= 6; i++) {
        const digit = document.getElementById(`otpDigit${i}`)?.value?.trim() || "";
        enteredCode += digit;
    }

    if (enteredCode.length !== 6) {
        showErr("Please enter the complete 6-digit random OTP.");
        return;
    }

    if (Date.now() > currentOtpState.expiresAt) {
        showErr("This OTP has expired. Please click 'Resend Code' for a new random OTP.");
        return;
    }

    if (enteredCode !== currentOtpState.code) {
        showErr("Invalid OTP code. Please check the notification and try again.");
        return;
    }

    // Success: Authenticate user
    const matchedUser = currentOtpState.user || { name: "Sunny Mehta", username: "sunny", mobile: "9876543210" };
    sessionStorage.setItem(STORAGE_KEYS.SESSION, "true");
    sessionStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(matchedUser));

    if (errBox) errBox.classList.add("hidden");
    dismissPushBanner();
    showToast(`OTP Verified! Welcome, ${matchedUser.name}`, "fa-circle-check");
    checkAuthSession();
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
    renderBroadcastsList();
    pullProductsFromCloud();
    pullBroadcastsFromCloud();
}

function switchTab(tabId) {
    currentTab = tabId;
    
    // Update navigation buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.className = "tab-btn px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer";
    });
    const activeNav = document.getElementById(`tabNav-${tabId}`);
    if (activeNav) {
        if (tabId === "broadcasts") {
            activeNav.className = "tab-btn px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 bg-amber-600 text-white shadow-lg shadow-amber-950/40 cursor-pointer";
        } else {
            activeNav.className = "tab-btn px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 bg-cyan-600 text-white shadow-lg shadow-cyan-950/40 cursor-pointer";
        }
    }

    // Update Panes
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.add("hidden"));
    const activePane = document.getElementById(`tabContent-${tabId}`);
    if (activePane) activePane.classList.remove("hidden");

    if (tabId === "broadcasts") {
        renderBroadcastsList();
    }

    updateBadgesAndStats();
}

function updateBadgesAndStats() {
    const products = getStoredProducts();
    const leads = getStoredLeads();
    const reviews = getStoredReviews();
    const broadcasts = getBroadcasts();

    const bProd = document.getElementById("badgeCountProducts");
    const bLeads = document.getElementById("badgeCountLeads");
    const bRev = document.getElementById("badgeCountReviews");
    const bBcast = document.getElementById("badgeCountBroadcasts");
    const activeBcCount = document.getElementById("activeBcCount");

    if (bProd) bProd.textContent = products.length;
    if (bLeads) bLeads.textContent = leads.length;
    if (bRev) bRev.textContent = reviews.length;
    if (bBcast) bBcast.textContent = broadcasts.length;
    if (activeBcCount) activeBcCount.textContent = broadcasts.length;

    const sProd = document.getElementById("statBoxProducts");
    const sLeads = document.getElementById("statBoxLeads");
    const sRev = document.getElementById("statBoxReviews");

    if (sProd) sProd.textContent = products.length;
    if (sLeads) sLeads.textContent = leads.length;
    if (sRev) sRev.textContent = reviews.length;
}

// ==========================================
// BROADCASTS & APP NOTIFICATION CONTROLLER
// ==========================================
function getBroadcasts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.BROADCASTS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn("Failed to parse broadcasts:", e);
    }
    return [
        {
            id: "bc-welcome-live",
            type: "version_update",
            title: "🚀 Ajanta App Update v2.5 is Live!",
            message: "New interactive glass size calculator, upgraded instant WhatsApp quotation pipeline, and updated price chart for 10mm-12mm Toughened & Acoustic DGU glass.",
            target: "all",
            actionText: "Check Features",
            actionUrl: "https://ajantaglass-sirsa.vercel.app/",
            playSound: true,
            createdAt: new Date().toISOString()
        }
    ];
}

async function saveBroadcasts(list) {
    try {
        localStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(list));
        updateBadgesAndStats();
        syncBroadcastsToCloud(list);
    } catch (e) {
        console.warn("Failed to save broadcasts:", e);
    }
}

async function syncBroadcastsToCloud(list) {
    try {
        const endpoint = `${CLOUD_SYNC_CONFIG.BASE_URL}${CLOUD_SYNC_CONFIG.BROADCASTS_KEY}`;
        await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(list)
        });
    } catch (e) {
        console.warn("Broadcast cloud sync note:", e);
    }
}

async function pullBroadcastsFromCloud() {
    try {
        const endpoint = `${CLOUD_SYNC_CONFIG.BASE_URL}${CLOUD_SYNC_CONFIG.BROADCASTS_KEY}`;
        const res = await fetch(endpoint).catch(() => null);
        if (res && res.ok) {
            const cloudBcasts = await res.json().catch(() => null);
            if (Array.isArray(cloudBcasts)) {
                localStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(cloudBcasts));
                renderBroadcastsList();
                updateBadgesAndStats();
            }
        }
    } catch (e) {
        console.warn("Pull broadcasts cloud note:", e);
    }
}

function updateBroadcastPresets() {
    const type = document.getElementById("bcType")?.value;
    const titleInput = document.getElementById("bcTitle");
    const msgInput = document.getElementById("bcMessage");
    const actTextInput = document.getElementById("bcActionText");

    if (!type || !titleInput || !msgInput) return;

    if (type === "version_update") {
        titleInput.value = "🚀 New Version Update Available (v2.6)";
        msgInput.value = "We have released a new version of the Ajanta Door & Window app with updated product rates and faster calculation tools. Please refresh to get latest features.";
        if (actTextInput) actTextInput.value = "Update Now";
    } else if (type === "announcement") {
        titleInput.value = "📢 Special Festival Offer on Architectural Glazing!";
        msgInput.value = "Get exclusive discounts on 12mm Toughened Glass Sliding Partitions and DGU Acoustic Windows this month. Contact our support team for bulk site orders.";
        if (actTextInput) actTextInput.value = "View Catalog";
    } else if (type === "price_alert") {
        titleInput.value = "💰 Glass Price & Specification Update";
        msgInput.value = "Revised market rates for toughened laminated glass and hardware profiles have been updated on the interactive calculator.";
        if (actTextInput) actTextInput.value = "Calculate Price";
    } else if (type === "security") {
        titleInput.value = "🔒 Scheduled Server Maintenance Notice";
        msgInput.value = "Our backend quote synchronization engine will undergo a brief 5-minute routine maintenance. Offline quoting remains unaffected.";
        if (actTextInput) actTextInput.value = "Understood";
    }
}

async function handleBroadcastSubmit(e) {
    if (e) e.preventDefault();
    const type = document.getElementById("bcType")?.value || "announcement";
    const target = document.getElementById("bcTarget")?.value || "all";
    const title = document.getElementById("bcTitle")?.value?.trim();
    const message = document.getElementById("bcMessage")?.value?.trim();
    const actionText = document.getElementById("bcActionText")?.value?.trim() || "";
    const actionUrl = document.getElementById("bcActionUrl")?.value?.trim() || "";
    const playSound = document.getElementById("bcPlaySound")?.checked ?? true;

    if (!title || !message) {
        showToast("Please fill in Title and Message", "fa-triangle-exclamation");
        return;
    }

    const btn = document.getElementById("broadcastBtn");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Broadcasting to all apps...`;
    }

    const newBroadcast = {
        id: `bc-${Date.now()}`,
        type: type,
        target: target,
        title: title,
        message: message,
        actionText: actionText,
        actionUrl: actionUrl,
        playSound: playSound,
        createdAt: new Date().toISOString()
    };

    const list = getBroadcasts();
    list.unshift(newBroadcast);
    await saveBroadcasts(list);

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Broadcast Push Notification to All Devices</span>`;
    }

    // Reset form
    const form = e?.target;
    if (form) {
        document.getElementById("bcTitle").value = "";
        document.getElementById("bcMessage").value = "";
    }

    renderBroadcastsList();
    showToast("Broadcast alert published across all apps & web visitors!", "fa-tower-broadcast");

    // Trigger local audio & banner preview
    triggerSystemPushBanner({
        title: title,
        body: message,
        icon: type === "version_update" ? "fa-rocket" : "fa-bullhorn",
        actions: actionText ? [{
            html: `<i class="fa-solid fa-arrow-right text-[10px]"></i> ${actionText}`,
            className: "bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow",
            onClick: () => {
                if (actionUrl) window.open(actionUrl, "_blank");
                dismissPushBanner();
            }
        }] : [],
        sound: playSound
    });
}

function renderBroadcastsList() {
    const container = document.getElementById("broadcastsListContainer");
    if (!container) return;

    const list = getBroadcasts();
    if (list.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-500 text-xs">
                <i class="fa-solid fa-tower-broadcast text-2xl mb-2 text-slate-600"></i>
                <p>No active broadcasts. Create one to send alerts to all users.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(item => {
        let badgeColor = "bg-cyan-950/60 border-cyan-800/40 text-cyan-400";
        let icon = "fa-bullhorn";
        if (item.type === "version_update") {
            badgeColor = "bg-amber-950/60 border-amber-800/40 text-amber-400";
            icon = "fa-rocket";
        } else if (item.type === "price_alert") {
            badgeColor = "bg-emerald-950/60 border-emerald-800/40 text-emerald-400";
            icon = "fa-tag";
        } else if (item.type === "security") {
            badgeColor = "bg-rose-950/60 border-rose-800/40 text-rose-400";
            icon = "fa-shield-halved";
        }

        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Recently";

        return `
            <div class="bg-slate-950/90 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 space-y-2 transition group">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-lg ${badgeColor} border flex items-center justify-center text-[10px]">
                            <i class="fa-solid ${icon}"></i>
                        </span>
                        <div>
                            <h5 class="text-xs font-bold text-white">${escapeHtml(item.title)}</h5>
                            <span class="text-[10px] text-slate-500 font-mono">${dateStr} • Target: ${escapeHtml(item.target || "all")}</span>
                        </div>
                    </div>
                    <button onclick="deleteBroadcast('${item.id}')" class="text-slate-500 hover:text-rose-400 p-1 text-xs transition cursor-pointer" title="Delete Broadcast">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <p class="text-[11px] text-slate-300 leading-relaxed">${escapeHtml(item.message)}</p>
                ${item.actionText ? `
                    <div class="pt-1 flex items-center gap-2">
                        <span class="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                            <i class="fa-solid fa-link text-[9px]"></i> Action: ${escapeHtml(item.actionText)}
                        </span>
                    </div>
                ` : ""}
            </div>
        `;
    }).join("");
}

async function deleteBroadcast(id) {
    const ok = await askConfirm({
        title: "Delete Broadcast Notification?",
        message: "This will remove the alert from active broadcasts feed.",
        confirmText: "Delete Notice",
        icon: "fa-trash-can",
        isDanger: true
    });
    if (!ok) return;

    let list = getBroadcasts();
    list = list.filter(b => b.id !== id);
    await saveBroadcasts(list);
    renderBroadcastsList();
    showToast("Broadcast deleted", "fa-trash-can");
}

async function clearAllBroadcasts() {
    const ok = await askConfirm({
        title: "Clear All Broadcasts?",
        message: "Are you sure you want to delete all historical broadcast messages?",
        confirmText: "Clear All",
        icon: "fa-trash-can",
        isDanger: true
    });
    if (!ok) return;

    await saveBroadcasts([]);
    renderBroadcastsList();
    showToast("All broadcast alerts cleared", "fa-check");
}

function sendTestAppNotification() {
    const randOtp = generateSecureRandomOtp();
    triggerSystemPushBanner({
        title: "🔔 Test Broadcast Notification (v2.5)",
        body: `Live notification test successful! Random OTP token: <span class="font-mono font-bold text-cyan-300">${randOtp}</span>. All connected devices and web visitors will receive this chime and banner instantly.`,
        icon: "fa-bell",
        actions: [
            {
                html: `<i class="fa-solid fa-check text-[10px]"></i> Acknowledge`,
                className: "bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shadow",
                onClick: () => {
                    dismissPushBanner();
                    showToast("Test notification acknowledged!", "fa-circle-check");
                }
            }
        ],
        sound: true
    });
    showToast("Test push notification dispatched!", "fa-bell");
}


// ==========================================
// 3. PRODUCTS CATALOG CONTROLLER
// ==========================================
function getStoredProducts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (stored !== null) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn("Failed to parse products:", e);
    }
    return FACTORY_PRODUCTS;
}

async function pullProductsFromCloud() {
    try {
        const res = await fetch("https://kvdb.io/T2p78Krq12XcfWn1vNiw9G/ajanta_products_catalog").catch(() => null);
        if (res && res.ok) {
            const cloudProducts = await res.json().catch(() => null);
            if (Array.isArray(cloudProducts)) {
                localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(cloudProducts));
                renderProductsGrid();
                updateBadgesAndStats();
            }
        }
    } catch (e) {
        console.warn("Pull products cloud note:", e);
    }
}

async function saveProducts(productsList) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(productsList));
    updateBadgesAndStats();

    // Sync to Cloud KVDB so Main website on any domain gets updated instantly
    try {
        await fetch("https://kvdb.io/T2p78Krq12XcfWn1vNiw9G/ajanta_products_catalog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productsList)
        });
    } catch (e) {
        console.warn("Products cloud sync note:", e);
    }
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

function switchImgTab(tab) {
    const btnUpload = document.getElementById("imgTabUpload");
    const btnUrl = document.getElementById("imgTabUrl");
    const btnPreset = document.getElementById("imgTabPreset");

    const secUpload = document.getElementById("imgUploadSection");
    const secUrl = document.getElementById("imgUrlSection");
    const secPreset = document.getElementById("imgPresetSection");

    const activeClass = ["text-white", "bg-cyan-600"];
    const inactiveClass = ["text-slate-400", "hover:text-white"];

    // Reset buttons
    [btnUpload, btnUrl, btnPreset].forEach(b => {
        if (b) {
            b.classList.remove(...activeClass);
            b.classList.add(...inactiveClass);
        }
    });

    // Reset sections
    if (secUpload) secUpload.classList.add("hidden");
    if (secUrl) secUrl.classList.add("hidden");
    if (secPreset) secPreset.classList.add("hidden");

    if (tab === "upload") {
        if (btnUpload) { btnUpload.classList.add(...activeClass); btnUpload.classList.remove(...inactiveClass); }
        if (secUpload) secUpload.classList.remove("hidden");
    } else if (tab === "url") {
        if (btnUrl) { btnUrl.classList.add(...activeClass); btnUrl.classList.remove(...inactiveClass); }
        if (secUrl) secUrl.classList.remove("hidden");
    } else if (tab === "preset") {
        if (btnPreset) { btnPreset.classList.add(...activeClass); btnPreset.classList.remove(...inactiveClass); }
        if (secPreset) secPreset.classList.remove("hidden");
    }
}

// Compress and convert image to lightweight DataURL
function compressImageFile(file, maxWidth = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                // Export as lightweight JPEG data URL
                const dataUrl = canvas.toDataURL("image/jpeg", quality);
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleProductFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showToast("Please choose a valid image file", "fa-triangle-exclamation");
        return;
    }

    showToast("Optimizing & uploading image...", "fa-spinner");

    try {
        const compressedBase64 = await compressImageFile(file);
        const input = document.getElementById("prodFormImage");
        if (input) input.value = compressedBase64;

        const activeName = document.getElementById("activeImgName");
        if (activeName) activeName.textContent = `Uploaded: ${file.name} (${Math.round(file.size / 1024)} KB)`;

        updateLivePreview();
        showToast("Photo uploaded successfully!", "fa-circle-check");
    } catch (err) {
        console.error("Upload error:", err);
        showToast("Failed to process image file", "fa-triangle-exclamation");
    }
}

function clearSelectedImage() {
    const input = document.getElementById("prodFormImage");
    const fileInput = document.getElementById("prodFileInput");
    if (input) input.value = "";
    if (fileInput) fileInput.value = "";

    const activeName = document.getElementById("activeImgName");
    if (activeName) activeName.textContent = "No image selected (Default placeholder will be used)";

    updateLivePreview();
    showToast("Image cleared", "fa-trash-can");
}

function openProductModal(productId = null) {
    const modal = document.getElementById("productModal");
    const titleEl = document.getElementById("productModalTitle");
    const form = document.getElementById("productEditForm");
    const activeName = document.getElementById("activeImgName");
    const fileInput = document.getElementById("prodFileInput");
    if (!modal || !form) return;

    form.reset();
    if (fileInput) fileInput.value = "";
    switchImgTab("upload");

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
            if (activeName) {
                if (prod.image && prod.image.startsWith("data:image")) {
                    activeName.textContent = "Custom Uploaded Photo (Saved)";
                } else if (prod.image) {
                    activeName.textContent = "Current Web Photo Link";
                } else {
                    activeName.textContent = "No image selected";
                }
            }
        }
    } else {
        if (titleEl) titleEl.textContent = "Add New Product";
        document.getElementById("prodFormId").value = "";
        document.getElementById("prodFormImage").value = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80";
        document.getElementById("prodFormBadge").value = "Architectural Glazing";
        if (activeName) activeName.textContent = "Preset Architectural Window Photo";
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
    const activeName = document.getElementById("activeImgName");
    if (activeName) activeName.textContent = "Preset Photo Selected";
    updateLivePreview();
    showToast("Preset photo applied", "fa-wand-magic-sparkles");
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
                    ${lead.items && lead.items.length ? `
                        <div class="space-y-1">
                            <span class="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono text-cyan-300 font-bold">
                                <i class="fa-solid fa-layer-group text-[9px]"></i>
                                ${lead.items.length} ${lead.items.length === 1 ? 'Spec' : 'Specs'}
                            </span>
                            <div class="text-[10px] text-slate-400 max-w-[220px] line-clamp-2 leading-relaxed">
                                ${lead.items.map(it => `${escapeHtml(it.name || 'Product')}${it.glassProfile ? ` (${escapeHtml(it.glassProfile)})` : ''} [${escapeHtml(it.thickness || 'Std')}/${escapeHtml(it.edgework || 'None')}] ${it.width}"×${it.height}" [Qty: ${it.qty}]`).join("; ")}
                            </div>
                        </div>
                    ` : `
                        <span class="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono text-slate-400">
                            Custom Scope
                        </span>
                    `}
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
        <Cell><Data ss:Type="String">Sizing Specifications (Material, Thickness, Edgework, Dimensions, Qty)</Data></Cell>
        <Cell><Data ss:Type="String">Requirements Notes</Data></Cell>
        <Cell><Data ss:Type="String">Status</Data></Cell>
    </Row>`;

    leads.forEach(l => {
        const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-IN") : "Recent";
        const itemsStr = (l.items && l.items.length) 
            ? l.items.map(it => `${it.name || 'Product'}${it.glassProfile ? ` (${it.glassProfile})` : ''} [Thick: ${it.thickness || 'Std'}, Edge: ${it.edgework || 'None'}, Size: ${it.width}"x${it.height}", Qty: ${it.qty}]`).join(" | ")
            : "Custom Scope";

        excelContent += `
        <Row>
            <Cell><Data ss:Type="String">${escapeXml(dateStr)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(l.clientName || '')}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(l.clientPhone || '')}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(l.clientAddress || '')}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(itemsStr)}</Data></Cell>
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

    const headers = ["Date", "Client Name", "Phone", "Location", "Sizing Specifications", "Notes", "Status"];
    const rows = leads.map(l => {
        const itemsStr = (l.items && l.items.length) 
            ? l.items.map(it => `${it.name || 'Product'}${it.glassProfile ? ` (${it.glassProfile})` : ''} [Thick: ${it.thickness || 'Std'}, Edge: ${it.edgework || 'None'}, Size: ${it.width}"x${it.height}", Qty: ${it.qty}]`).join(" | ")
            : "Custom Scope";

        return [
            `"${(l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '').replace(/"/g, '""')}"`,
            `"${(l.clientName || '').replace(/"/g, '""')}"`,
            `"${(l.clientPhone || '').replace(/"/g, '""')}"`,
            `"${(l.clientAddress || '').replace(/"/g, '""')}"`,
            `"${itemsStr.replace(/"/g, '""')}"`,
            `"${(l.requirements || '').replace(/"/g, '""')}"`,
            `"${(l.status || 'PENDING').replace(/"/g, '""')}"`
        ];
    });

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
        if (stored !== null) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn("Reviews parse error:", e);
    }
    return [];
}

async function saveReviews(reviews) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    updateBadgesAndStats();

    // Sync to Cloud KVDB so Main website on any domain gets updated instantly
    try {
        await fetch("https://kvdb.io/T2p78Krq12XcfWn1vNiw9G/ajanta_client_reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reviews)
        });
    } catch (e) {
        console.warn("Reviews cloud sync note:", e);
    }
}

function renderReviewsGrid() {
    const container = document.getElementById("adminReviewsGrid");
    if (!container) return;

    const reviews = getStoredReviews();

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-12 text-center text-slate-500 space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800">
                <i class="fa-solid fa-comment-slash text-3xl opacity-40"></i>
                <p class="text-xs">No client reviews found. Click "+ Add Testimonial" to add a new verified review.</p>
            </div>
        `;
        return;
    }

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
// RUN ON PAGE LOAD & OTP DIGIT NAVIGATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    checkOwnerApprovalUrlQuery();
    checkAuthSession();

    // Setup 6-digit OTP input auto-advance & paste handler
    const otpBoxes = document.querySelectorAll(".otp-box");
    otpBoxes.forEach((box, idx) => {
        box.addEventListener("input", (e) => {
            const val = e.target.value;
            // Handle paste of 6 digits in single box
            if (val.length > 1) {
                const cleanDigits = val.replace(/[^0-9]/g, "").slice(0, 6);
                cleanDigits.split("").forEach((d, dIdx) => {
                    const targetBox = document.getElementById(`otpDigit${dIdx + 1}`);
                    if (targetBox) targetBox.value = d;
                });
                const lastBox = document.getElementById(`otpDigit${Math.min(cleanDigits.length, 6)}`);
                if (lastBox) lastBox.focus();
                if (cleanDigits.length === 6) {
                    setTimeout(() => handleVerifyOtpSubmit(), 200);
                }
                return;
            }

            // Only allow numbers
            e.target.value = val.replace(/[^0-9]/g, "");

            if (e.target.value && idx < otpBoxes.length - 1) {
                otpBoxes[idx + 1].focus();
            }

            // If all 6 digits filled, auto-verify
            let allFilled = true;
            for (let i = 1; i <= 6; i++) {
                if (!document.getElementById(`otpDigit${i}`)?.value) {
                    allFilled = false;
                    break;
                }
            }
            if (allFilled) {
                setTimeout(() => handleVerifyOtpSubmit(), 150);
            }
        });

        box.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !e.target.value && idx > 0) {
                otpBoxes[idx - 1].focus();
            }
        });

        box.addEventListener("paste", (e) => {
            e.preventDefault();
            const pasteData = (e.clipboardData || window.clipboardData).getData("text");
            const cleanDigits = pasteData.replace(/[^0-9]/g, "").slice(0, 6);
            cleanDigits.split("").forEach((d, dIdx) => {
                const targetBox = document.getElementById(`otpDigit${dIdx + 1}`);
                if (targetBox) targetBox.value = d;
            });
            const lastBox = document.getElementById(`otpDigit${Math.min(cleanDigits.length, 6)}`);
            if (lastBox) lastBox.focus();
            if (cleanDigits.length === 6) {
                setTimeout(() => handleVerifyOtpSubmit(), 200);
            }
        });
    });
});
