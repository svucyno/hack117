// Apply theme and language before page renders
(function() {
    const savedTheme = localStorage.getItem('agripredict_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Global Translation Logic
    const savedLang = localStorage.getItem('agripredict_lang') || 'en';
    if (savedLang !== 'en') {
        const script = document.createElement('script');
        script.src = `https://translate.googleapis.com/translate_a/element.js?cb=googleTranslateElementInit`;
        document.head.appendChild(script);

        window.googleTranslateElementInit = function() {
            new window.google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,hi,or,te',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
            
            // Auto switch language after translator loads
            setTimeout(() => {
                const iframe = document.querySelector('.goog-te-menu-frame');
                if (!iframe) return;
                const innerDoc = iframe.contentDocument || iframe.contentWindow.document;
                const links = innerDoc.getElementsByTagName('a');
                for (let i = 0; i < links.length; i++) {
                    if (links[i].href.indexOf(savedLang) !== -1 || links[i].innerHTML.toLowerCase().includes(savedLang)) {
                        links[i].click();
                        break;
                    }
                }
            }, 1000);
            
            // Alternative generic approach since iframe content might be restricted
            setTimeout(() => {
                const selectElement = document.querySelector('.goog-te-combo');
                if (selectElement) {
                    selectElement.value = savedLang;
                    selectElement.dispatchEvent(new Event('change'));
                }
            }, 500);
        };
        
        // Ensure DOM is ready to append translate element
        document.addEventListener('DOMContentLoaded', () => {
             const translateDiv = document.createElement('div');
             translateDiv.id = 'google_translate_element';
             translateDiv.style.display = 'none'; // Hide ugly widget
             document.body.appendChild(translateDiv);
        });
    }
})();

// ===== AUTH GUARD LOGIC =====
// This script runs on protected pages (dashboard, prediction, map, settings)
// and redirects the user back to the login page if they are not authenticated.

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are using the Mock Auth (LocalStorage) or waiting for Firebase
    const currentUser = localStorage.getItem('agri_current_user');
    
    // In a real app with Firebase, you'd use auth.onAuthStateChanged()
    // For this MVP, if the mock user isn't in local storage, we boot them.
    if (!currentUser) {
        // Not logged in -> Redirect
        window.location.replace('/login.html');
    } else {
        // Optional: You can parse the user to get their role and hide/show Admin elements
        try {
            const userObj = JSON.parse(currentUser);
            console.log(`Logged in as: ${userObj.name} (Role: ${userObj.role})`);
            
            // If they are not an admin, we can hide admin-only links
            if (userObj.role !== 'admin') {
                const adminLinks = document.querySelectorAll('.admin-only');
                adminLinks.forEach(link => link.style.display = 'none');
            }
        } catch(e) {
            console.error("Error parsing user data", e);
        }
    }
});
