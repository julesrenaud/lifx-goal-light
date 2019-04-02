$('#advancedOptions').on('hide.bs.collapse show.bs.collapse', function() {
  var $icon = $(this).prev().find('.js-icon-see-more');
  var newText = $icon.text() === '+' ? '-' : '+';
  $icon.text(newText);
});

$('#goalLightSubmit').click(function() {
  $(this).find('span').toggleClass('invisible');

  setTimeout(() => {
    $(this).prop('disabled', function(i,v) { return !v; });
  }, 50);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}