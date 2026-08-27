import { ai } from './ai/model-loader.js';

const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const downloadBanner = document.getElementById('download-banner');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const statusBadge = document.getElementById('status-badge');

let conversation = [];
let isModelReady = false;

// 1. بدء تهيئة النموذج عند أول تحميل
async function init() {
    try {
        downloadBanner.style.display = 'flex';
        progressText.innerText = 'جاري تنزيل نموذج الذكاء الاصطناعي إلى الذاكرة المحلية...';

        await ai.loadModel((percent) => {
            progressBar.style.width = `${percent}%`;
            progressText.innerText = `جاري التنزيل والتثبيت: ${percent}%`;
        });

        isModelReady = true;
        downloadBanner.style.display = 'none';
        statusBadge.innerText = 'النموذج يعمل محلياً ✅';
        statusBadge.classList.add('ready');
        sendBtn.disabled = false;
        userInput.disabled = false;
        
        appendMessage('system', 'تم تحميل النموذج بنجاح وهو يعمل الآن محلياً بالكامل على جهازك دون إنترنت!');
    } catch (err) {
        progressText.innerText = 'حدث خطأ أثناء تحميل النموذج، يرجى التحديث.';
        console.error(err);
    }
}

function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `msg ${role}`;
    msg.innerText = text;
    chatHistory.appendChild(msg);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return msg;
}

// 2. إرسال وتوليد الرد
async function handleSend() {
    const text = userInput.value.trim();
    if (!text || !isModelReady) return;

    appendMessage('user', text);
    conversation.push({ role: 'user', content: text });
    userInput.value = '';
    
    sendBtn.disabled = true;
    const aiBubble = appendMessage('ai', 'يفكر...');

    try {
        const response = await ai.generate(conversation);
        aiBubble.innerText = response;
        conversation.push({ role: 'assistant', content: response });
    } catch (error) {
        aiBubble.innerText = 'عذراً، حدث خطأ أثناء المعالجة.';
    } finally {
        sendBtn.disabled = false;
    }
}

// الأحداث
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// بدء التشغيل
init();
