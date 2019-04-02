$('#advancedOptions').on('hide.bs.collapse show.bs.collapse', function() {
  var $icon = $(this).prev().find('.js-icon-see-more');
  var newText = $icon.text() === '+' ? '-' : '+';
  $icon.text(newText);
});

$('#goalLight').submit(function() {
  var $btn = $('#goalLightSubmit');

  $btn.find('span').toggleClass('invisible');
  $btn.prop('disabled', true);
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