// بررسی تب‌ها وقتی صفحه کاملاً بارگذاری می‌شود یا فعال می‌شود
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkAndApplyStyles(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (tab.url) {
      checkAndApplyStyles(activeInfo.tabId, tab.url);
    }
  });
});

// تابع بررسی سایت در لیست فعال‌ها و اعمال استایل‌ها
function checkAndApplyStyles(tabId, url) {
  try {
    // برای فایل های محلی یا URL های خاص مانند chrome://, مانیج کردن خطا
    const hostname = new URL(url).hostname;
    
    chrome.storage.sync.get(['enabledSites'], function(data) {
      const enabledSites = data.enabledSites || [];
      
      // بررسی آیا این سایت در لیست سایت‌های فعال است
      const isEnabled = enabledSites.includes(hostname);
      
      // ارسال وضعیت به popup برای به‌روزرسانی تیک باکس
      chrome.runtime.sendMessage({
        action: "updateCheckbox",
        hostname: hostname,
        isEnabled: isEnabled
      });
      
      if (isEnabled) {
        // اعمال CSS فقط در صورتی که سایت در لیست فعال‌ها باشد
        chrome.scripting.insertCSS({
          target: { tabId: tabId },
          files: ['content.css']
        }).catch(err => console.error('Error inserting CSS:', err));
      }
    });
  } catch (error) {
    console.error("Error processing URL:", error);
  }
}

// هنگام نصب افزونه یا به‌روزرسانی
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['enabledSites'], function(data) {
    if (!data.enabledSites) {
      // ایجاد یک آرایه خالی برای سایت‌های فعال شده در صورتی که وجود نداشته باشد
      chrome.storage.sync.set({ enabledSites: [] });
    }
  });
});

// گوش دادن به پیام های ارسالی از popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleSite") {
    chrome.storage.sync.get(['enabledSites'], function(data) {
      let enabledSites = data.enabledSites || [];
      const hostname = message.hostname;
      
      if (message.enable) {
        // اضافه کردن سایت به لیست فعال اگر قبلاً وجود نداشته باشد
        if (!enabledSites.includes(hostname)) {
          enabledSites.push(hostname);
        }
      } else {
        // حذف سایت از لیست فعال
        enabledSites = enabledSites.filter(site => site !== hostname);
      }
      
      // ذخیره لیست به روز شده
      chrome.storage.sync.set({ enabledSites: enabledSites }, function() {
        // بعد از ذخیره، استایل ها را مجدداً اعمال کنید
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            checkAndApplyStyles(tabs[0].id, tabs[0].url);
            
            // اگر سایت فعال شده، CSS را اعمال کنید، در غیر این صورت تب را ریلود کنید تا CSS حذف شود
            if (message.enable) {
              chrome.scripting.insertCSS({
                target: { tabId: tabs[0].id },
                files: ['content.css']
              }).catch(err => console.error('Error inserting CSS:', err));
            } else {
              chrome.tabs.reload(tabs[0].id);
            }
          }
        });
        
        sendResponse({success: true});
      });
    });
    return true; // برای نگه داشتن کانال پیام رسانی باز برای sendResponse غیرهمزمان
  }
  
  if (message.action === "getCurrentHostname") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url) {
        try {
          const hostname = new URL(tabs[0].url).hostname;
          sendResponse({hostname: hostname});
        } catch (error) {
          sendResponse({hostname: ""});
        }
      } else {
        sendResponse({hostname: ""});
      }
    });
    return true; // برای نگه داشتن کانال پیام رسانی باز برای sendResponse غیرهمزمان
  }
});