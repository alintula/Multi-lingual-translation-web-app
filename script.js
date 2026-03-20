// ─── Element References ───────────────────────────────────────────────────────
const inputText   = document.getElementById('inputText');
const outputText  = document.getElementById('outputText');
const charCount   = document.getElementById('charCount');
const sourceLang  = document.getElementById('sourceLang');
const targetLang  = document.getElementById('targetLang');
const translateBtn = document.getElementById('translateBtn');
const swapBtn     = document.getElementById('swapBtn');
const themeToggle = document.getElementById('themeToggle');
const loader      = document.getElementById('loader');
const errorMsg    = document.getElementById('errorMsg');

// ─── 1. Core Translation (GET request – MyMemory requires query params) ───────
async function handleTranslate() {
    const text = inputText.value.trim();
    if (!text) {
        showError('Please enter some text to translate.');
        return;
    }

    hideError();
    showLoader(true);
    outputText.value = '';

    const src  = sourceLang.value;         // e.g. "en" or "autodetect"
    const tgt  = targetLang.value;         // e.g. "fr"
    const pair = `${src}|${tgt}`;

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}`;
        const res  = await fetch(url);

        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const data = await res.json();

        if (data.responseStatus === 200) {
            outputText.value = data.responseData.translatedText;
        } else {
            throw new Error(data.responseDetails || 'Translation failed.');
        }
    } catch (err) {
        showError(`Translation error: ${err.message}`);
        console.error('Translation Error:', err);
    } finally {
        showLoader(false);
    }
}

// ─── 2. Translate button click ─────────────────────────────────────────────────
translateBtn.addEventListener('click', handleTranslate);

// ─── 3. Real-time translation with debounce (Bonus Feature) ───────────────────
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

const debouncedTranslate = debounce(handleTranslate, 800);
inputText.addEventListener('input', debouncedTranslate);

// Also re-translate when language selection changes
sourceLang.addEventListener('change', handleTranslate);
targetLang.addEventListener('change', handleTranslate);

// ─── 4. Character counter ─────────────────────────────────────────────────────
inputText.addEventListener('input', () => {
    const length = inputText.value.length;
    charCount.textContent = `${length}/500`;

    // Visual warning near limit
    charCount.style.color = length >= 450 ? '#ef4444' : 'var(--text-secondary)';
});

// ─── 5. Swap languages (swaps selects AND textarea content) ───────────────────
swapBtn.addEventListener('click', () => {
    // Swap language values
    const tempLang = sourceLang.value;
    sourceLang.value = targetLang.value;

    // Can't set sourceLang to autodetect on swap – fall back to 'en'
    if (sourceLang.value === 'autodetect') sourceLang.value = 'en';
    targetLang.value = tempLang === 'autodetect' ? 'en' : tempLang;

    // Swap textarea content
    const tempText   = inputText.value;
    inputText.value  = outputText.value;
    outputText.value = tempText;

    // Update char count
    charCount.textContent = `${inputText.value.length}/500`;

    // Translate with new config
    if (inputText.value.trim()) handleTranslate();
});

// ─── 6. Copy text ─────────────────────────────────────────────────────────────
function copyText(id) {
    const el   = document.getElementById(id);
    const text = el.value;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector(`[onclick="copyText('${id}')"]`);
        const original = btn.innerHTML;
        btn.innerHTML = '✓ Copied';
        btn.style.color = '#22c55e';
        setTimeout(() => {
            btn.innerHTML = original;
            btn.style.color = '';
        }, 1500);
    }).catch(() => {
        // Fallback for older browsers
        el.select();
        document.execCommand('copy');
    });
}

// ─── 7. Text-to-Speech ────────────────────────────────────────────────────────
function speak(id) {
    const text = document.getElementById(id).value;
    if (!text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance  = new SpeechSynthesisUtterance(text);
    utterance.lang   = id === 'outputText' ? targetLang.value : sourceLang.value;
    utterance.rate   = 0.95;
    utterance.pitch  = 1;
    window.speechSynthesis.speak(utterance);
}

// ─── 8. Dark mode toggle (Bonus Feature) ─────────────────────────────────────
if (themeToggle) {
    // Restore saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const next   = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', next);
    });
}

// ─── 9. Loading indicator helpers ─────────────────────────────────────────────
function showLoader(visible) {
    if (!loader) return;
    loader.style.display = visible ? 'block' : 'none';
    translateBtn.disabled = visible;
    translateBtn.style.opacity = visible ? '0.7' : '1';
}

// ─── 10. Error display helpers ────────────────────────────────────────────────
function showError(message) {
    if (!errorMsg) return;
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
}

function hideError() {
    if (!errorMsg) return;
    errorMsg.style.display = 'none';
}

// ─── 11. Auto-translate on page load (Requirement #2) ────────────────────────
window.addEventListener('DOMContentLoaded', handleTranslate);
