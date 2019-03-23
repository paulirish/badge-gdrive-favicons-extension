

(function() {
  'use strict';

  var save = document.querySelector('#save');

  function saveOptions() {
    const trs = Array.from(document.querySelector('form').querySelectorAll('tbody tr'));
    const formData = trs.map(e => {
      return {
        substring: e.querySelectorAll('input')[0].value,
        color: e.querySelectorAll('input')[1].value,
      };
    });

    chrome.storage.sync.set({options: JSON.stringify(formData)}, function() {
      save.innerHTML = 'Options Saved!';

      setTimeout(function() {
        save.innerHTML = 'Save';
      }, 1000);
    });
  }

  function getUserDefinedSettings() {
    chrome.storage.sync.get(['options'], function(data) {
      if (!data.options) {
        console.log('nothing yet');
      } else {
        JSON.parse(data.options).forEach((row, i) => {
          const elem = document.querySelector('form').querySelectorAll('tbody tr')[i];
          elem.querySelectorAll('input')[0].value = row.substring;
          elem.querySelectorAll('input')[1].value = row.color;
        });
      }
    });
  }

  function init() {
    getUserDefinedSettings();
    version.innerHTML = 'Version ' + chrome.runtime.getManifest().version;
    save.addEventListener('click', saveOptions);
  }

  init();
})();
