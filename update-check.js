// يفحص إذا فيه نسخة جديدة من الموقع، ويعيد التحميل تلقائياً
// الرقم يتغيّر من ملف version.json. كل ما تغيّره، الزوار يتحدّثون تلقائياً.
(function () {
  var KEY = "olympiadAppVersion";
  fetch("version.json?t=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      var latest = String(j.v);
      var saved = localStorage.getItem(KEY);
      localStorage.setItem(KEY, latest);
      // إذا الرقم تغيّر، نعيد التحميل بعنوان جديد (ما يتخزن عند المتصفح)
      if (saved && saved !== latest) {
        location.replace(location.pathname + "?u=" + latest);
      }
    })
    .catch(function () { /* بدون نت أو خطأ: نكمل عادي */ });
})();
