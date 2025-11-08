/**
 * IceCube Analytics Tracker
 * Tracks page views and user events to Supabase
 */

// Supabase configuration (reuse from app.js)
const ANALYTICS_SUPABASE_URL = 'https://ysuhexvvgjoizrcdrxso.supabase.co';
const ANALYTICS_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdWhleHZ2Z2pvaXpyY2RyeHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDQzODksImV4cCI6MjA3ODE4MDM4OX0.0UFYz-xd_QmUEdVcKWqRo6D4QcwvAmlKDKSdu7M4ENA';

let analyticsClient = null;

// Initialize Supabase client for analytics
if (ANALYTICS_SUPABASE_URL && ANALYTICS_SUPABASE_ANON_KEY && window.supabase) {
    analyticsClient = window.supabase.createClient(ANALYTICS_SUPABASE_URL, ANALYTICS_SUPABASE_ANON_KEY);
}

/**
 * Track an analytics event
 * @param {string} eventType - Type of event: 'page_views', 'email_submissions', 'email_duplicates', 'email_errors'
 */
async function trackEvent(eventType) {
    if (!analyticsClient) {
        console.warn('Analytics client not initialized');
        return;
    }

    try {
        // Call the increment_stat function
        const { error } = await analyticsClient.rpc('increment_stat', {
            stat_column: eventType,
            increment_by: 1
        });

        if (error) {
            console.error('Analytics tracking error:', error);
        }
    } catch (error) {
        console.error('Analytics tracking failed:', error);
    }
}

/**
 * Track page view on load
 */
function trackPageView() {
    trackEvent('page_views');
}

/**
 * Track successful email submission
 */
function trackEmailSubmission() {
    trackEvent('email_submissions');
}

/**
 * Track duplicate email attempt
 */
function trackEmailDuplicate() {
    trackEvent('email_duplicates');
}

/**
 * Track email submission error
 */
function trackEmailError() {
    trackEvent('email_errors');
}

// Auto-track page view when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
} else {
    trackPageView();
}

// Export functions for use in app.js
window.analytics = {
    trackPageView,
    trackEmailSubmission,
    trackEmailDuplicate,
    trackEmailError
};
