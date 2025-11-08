/**
 * IceCube - Coming Soon Page
 * Email subscription form handler with Supabase integration and analytics
 */

// Supabase configuration
const SUPABASE_URL = 'https://ysuhexvvgjoizrcdrxso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdWhleHZ2Z2pvaXpyY2RyeHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDQzODksImV4cCI6MjA3ODE4MDM4OX0.0UFYz-xd_QmUEdVcKWqRo6D4QcwvAmlKDKSdu7M4ENA';

// Initialize Supabase client
let supabase = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ==========================================
// Analytics Functions
// ==========================================

/**
 * Track an analytics event (anonymous, aggregated stats only)
 * @param {string} eventType - Type of event: 'page_views', 'email_submissions', 'email_duplicates', 'email_errors'
 */
async function trackEvent(eventType) {
    if (!supabase) return;

    try {
        await supabase.rpc('increment_stat', {
            stat_column: eventType,
            increment_by: 1
        });
    } catch (error) {
        // Silent fail for analytics
        console.debug('Analytics tracking failed:', error);
    }
}

// Track page view on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => trackEvent('page_views'));
} else {
    trackEvent('page_views');
}

// Form elements
const form = document.getElementById('emailForm');
const emailInput = document.getElementById('emailInput');
const submitButton = document.getElementById('submitButton');
const formMessage = document.getElementById('formMessage');
const consentCheckbox = document.getElementById('consentCheckbox');

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Shows form message to user
 * @param {string} message - Message text to display
 * @param {string} type - Message type ('success' or 'error')
 */
function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;

    if (type === 'success') {
        setTimeout(() => {
            formMessage.className = 'form-message';
        }, 5000);
    }
}

/**
 * Handles form submission
 * @param {Event} e - Form submit event
 */
async function handleSubmit(e) {
    e.preventDefault();

    const email = emailInput.value.trim();

    // Validate email
    if (!email) {
        showMessage('Please enter your email address', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    // Validate consent
    if (!consentCheckbox.checked) {
        showMessage('Please accept the privacy policy to continue', 'error');
        return;
    }

    // Check if Supabase is configured
    if (!supabase) {
        showMessage('Service not configured. Please contact administrator.', 'error');
        console.error('Supabase credentials not configured');
        return;
    }

    // Disable form while submitting
    submitButton.disabled = true;
    submitButton.textContent = 'SUBSCRIBING...';

    try {
        const { data, error } = await supabase
            .from('email_subscribers')
            .insert([{
                email: email.toLowerCase(),
                source: 'coming_soon_page'
            }])
            .select();

        if (error) {
            if (error.code === '23505') {
                showMessage('This email is already subscribed!', 'error');
                trackEvent('email_duplicates');
            } else {
                throw error;
            }
        } else {
            showMessage('Thank you! We\'ll notify you when we launch.', 'success');
            emailInput.value = '';
            trackEvent('email_submissions');
        }
    } catch (error) {
        console.error('Error submitting email:', error);
        showMessage('Something went wrong. Please try again later.', 'error');
        trackEvent('email_errors');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'SUBSCRIBE';
    }
}

/**
 * Clears error message when user starts typing
 */
function handleInput() {
    if (formMessage.classList.contains('error')) {
        formMessage.className = 'form-message';
    }
}

// Event listeners
form.addEventListener('submit', handleSubmit);
emailInput.addEventListener('input', handleInput);
