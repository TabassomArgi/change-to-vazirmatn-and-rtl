// اسکریپت مخصوص برای توییتر که فقط متن‌های فارسی را تغییر می‌دهد

// تشخیص متن‌های فارسی و عربی
function hasPersianOrArabic(text) {
  const persianPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return persianPattern.test(text);
}

// تابع اصلی برای پردازش توییت‌ها
function processTweets() {
  // فقط متن‌های اصلی توییت را انتخاب می‌کنیم
  const tweetTexts = document.querySelectorAll('[data-testid="tweetText"]');
  
  tweetTexts.forEach(tweetElement => {
    // بررسی می‌کنیم که آیا این توییت قبلاً پردازش شده است یا خیر
    if (tweetElement.getAttribute('data-processed') === 'true') {
      return;
    }
    
    // بررسی می‌کنیم که آیا این توییت متن فارسی دارد یا خیر
    if (hasPersianOrArabic(tweetElement.textContent)) {
      // فقط متن اصلی توییت را تغییر می‌دهیم، نه دکمه‌ها یا سایر عناصر
      tweetElement.style.fontFamily = "'Vazirmatn', sans-serif";
      tweetElement.style.direction = "rtl";
      tweetElement.style.textAlign = "right";
      
      // علامت‌گذاری می‌کنیم که این توییت پردازش شده است
      tweetElement.setAttribute('data-processed', 'true');
      
      // اطمینان حاصل می‌کنیم که دکمه‌های داخل توییت تحت تأثیر قرار نمی‌گیرند
      const buttons = tweetElement.querySelectorAll('div[role="button"], span[role="button"]');
      buttons.forEach(button => {
        button.style.direction = "ltr";
        button.style.textAlign = "left";
        button.style.fontFamily = "inherit";
      });
    }
  });
  
  // به طور خاص، دکمه‌های "show more" را پیدا و اصلاح می‌کنیم
  const showMoreButtons = document.querySelectorAll('[role="button"]');
  showMoreButtons.forEach(button => {
    if (button.textContent.includes("Show more") || 
        button.textContent.includes("show more") || 
        button.textContent.includes("more") ||
        button.textContent.includes("See more")) {
      button.style.direction = "ltr";
      button.style.textAlign = "left";
      button.style.fontFamily = "inherit";
      
      // همه عناصر فرزند را نیز اصلاح می‌کنیم
      const children = button.querySelectorAll('*');
      children.forEach(child => {
        child.style.direction = "ltr";
        child.style.textAlign = "left";
        child.style.fontFamily = "inherit";
      });
    }
  });
}

// اجرای اولیه با تأخیر برای اطمینان از بارگذاری کامل صفحه
setTimeout(() => {
  processTweets();
}, 2000);

// اجرای مجدد هنگام اسکرول
document.addEventListener('scroll', () => {
  setTimeout(processTweets, 500);
});

// نظارت بر تغییرات DOM برای توییت‌های جدید
const observer = new MutationObserver(() => {
  setTimeout(processTweets, 500);
});

// شروع نظارت بر تغییرات DOM
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// اجرای مجدد هر 3 ثانیه برای اطمینان از پوشش همه توییت‌ها
setInterval(processTweets, 3000);

// اضافه کردن فونت وزیرمتن به صفحه
const style = document.createElement('style');
style.textContent = `
@font-face {
  font-family: 'Vazirmatn';
  src: url('${chrome.runtime.getURL('fonts/Vazirmatn-Regular.woff2')}') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
`;
document.head.appendChild(style);

console.log("Twitter Persian Fix: Script loaded"); 