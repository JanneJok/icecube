/**
 * IceCube Contact Form
 * EmailJS integration for contact form popup
 */

// EmailJS configuration
const EMAILJS_PUBLIC_KEY = 'EV6UX6GIPG231yXUd';
const EMAILJS_SERVICE_ID = 'service_nnxux1e';
const EMAILJS_TEMPLATE_ID = 'template_evci98f';

// Initialize EmailJS
(function() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
})();

// Modal elements
const modal = document.getElementById('contactModal');
const closeBtn = document.querySelector('.close-modal');
const contactLinks = document.querySelectorAll('.contact-link');
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('contactSubmitBtn');
const formMessage = document.getElementById('contactFormMessage');

// Open modal when contact links are clicked
contactLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.add('active');
    });
});

// Close modal when X is clicked
if (closeBtn) {
    closeBtn.addEventListener('click', function() {
        modal.classList.remove('active');
        resetForm();
    });
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target === modal) {
        modal.classList.remove('active');
        resetForm();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
        resetForm();
    }
});

/**
 * Shows form message
 * @param {string} message - Message text
 * @param {string} type - 'success' or 'error'
 */
function showFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `contact-message ${type}`;

    if (type === 'success') {
        setTimeout(() => {
            formMessage.className = 'contact-message';
        }, 5000);
    }
}

/**
 * Resets the form
 */
function resetForm() {
    contactForm.reset();
    formMessage.className = 'contact-message';
}

/**
 * Handles form submission
 */
contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Check if EmailJS is loaded
    if (typeof emailjs === 'undefined') {
        showFormMessage('Email service not loaded. Please refresh the page.', 'error');
        return;
    }

    // Get form data
    const formData = new FormData(contactForm);
    const templateParams = {
        from_name: formData.get('from_name'),
        from_email: formData.get('from_email'),
        reply_to: formData.get('from_email'), // Same as from_email
        message: formData.get('message'),
        title: 'Message from Icecube' // Hardcoded title
    };

    // Validate
    if (!templateParams.from_name || !templateParams.from_email || !templateParams.message) {
        showFormMessage('Please fill in all fields', 'error');
        return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING...';

    try {
        // Send email via EmailJS
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        );

        if (response.status === 200) {
            showFormMessage('Thank you! Your message has been sent.', 'success');

            // Track contact submission if analytics exists
            if (window.analytics && typeof window.analytics.trackContactSubmission === 'function') {
                window.analytics.trackContactSubmission();
            }

            // Reset form after 2 seconds
            setTimeout(() => {
                resetForm();
                modal.classList.remove('active');
            }, 2000);
        } else {
            throw new Error('Failed to send message');
        }
    } catch (error) {
        console.error('EmailJS error:', error);
        showFormMessage('Something went wrong. Please try again later.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'SEND MESSAGE';
    }
});
