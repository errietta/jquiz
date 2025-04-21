// Register the service worker
if ('serviceWorker' in navigator) {
  // Wait for the 'load' event to not block other work
  window.addEventListener('load', async () => {

    if (window.Capacitor) {
      console.log('Capacitor detected, not registering service worker');
      return;
    }

    // Try to register the service worker.
    try {
      // Capture the registration for later use, if needed
      let reg;

      reg = await navigator.serviceWorker.register('/service-worker.js');

      console.log('Service worker registered! 😎', reg);

      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              const updateNotification = document.createElement('div');
              updateNotification.style.position = 'fixed';
              updateNotification.style.bottom = '10px';
              updateNotification.style.left = '50%';
              updateNotification.style.transform = 'translateX(-50%)';
              updateNotification.style.background = 'rgba(0, 0, 0, 0.8)';
              updateNotification.style.color = '#fff';
              updateNotification.style.padding = '10px';
              updateNotification.style.borderRadius = '5px';
              updateNotification.style.zIndex = '1000';
              updateNotification.innerText = 'New update available. Refresh to update.';
              
              const refreshButton = document.createElement('button');
              refreshButton.innerText = 'Refresh';
              refreshButton.style.marginLeft = '10px';
              refreshButton.style.padding = '5px 10px';
              refreshButton.style.border = 'none';
              refreshButton.style.borderRadius = '5px';
              refreshButton.style.background = '#2196f3';
              refreshButton.style.color = '#fff';
              refreshButton.style.cursor = 'pointer';
              refreshButton.onclick = () => {
                window.location.reload();
              };

              updateNotification.appendChild(refreshButton);
              document.body.appendChild(updateNotification);
            }
          }
        };
      };
    } catch (err) {
      console.log('😥 Service worker registration failed: ', err);
    }
  });
}