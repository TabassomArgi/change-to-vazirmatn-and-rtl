document.addEventListener('DOMContentLoaded', function() {
    const siteToggle = document.getElementById('site-toggle');
    const hostnameDisplay = document.getElementById('hostname');
    const statusText = document.getElementById('status-text');
    
    // درخواست نام هاست فعلی از background script
    chrome.runtime.sendMessage({action: "getCurrentHostname"}, function(response) {
        if (response && response.hostname) {
            const hostname = response.hostname;
            hostnameDisplay.textContent = hostname;
            
            // بررسی وضعیت فعال یا غیرفعال بودن سایت فعلی
            chrome.storage.sync.get(['enabledSites'], function(data) {
                const enabledSites = data.enabledSites || [];
                siteToggle.checked = enabledSites.includes(hostname);
                updateStatusText(siteToggle.checked);
            });
        } else {
            hostnameDisplay.textContent = "سایتی در دسترس نیست";
            siteToggle.disabled = true;
        }
    });
    
    // اضافه کردن گوش دهنده برای تغییر وضعیت تیک باکس
    siteToggle.addEventListener('change', function() {
        const hostname = hostnameDisplay.textContent;
        if (hostname && hostname !== "سایتی در دسترس نیست") {
            // ارسال وضعیت جدید به background script
            chrome.runtime.sendMessage({
                action: "toggleSite", 
                hostname: hostname, 
                enable: siteToggle.checked
            }, function(response) {
                if (response && response.success) {
                    updateStatusText(siteToggle.checked);
                }
            });
        }
    });
    
    // تابع به‌روزرسانی متن وضعیت
    function updateStatusText(isEnabled) {
        statusText.textContent = isEnabled ? "فعال" : "غیرفعال";
    }
    
    // گوش دادن به پیام‌ها از background برای به‌روزرسانی تیک باکس
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "updateCheckbox" && hostnameDisplay.textContent === message.hostname) {
            siteToggle.checked = message.isEnabled;
            updateStatusText(message.isEnabled);
        }
    });
});