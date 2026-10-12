export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return;
  }

  const installPromptState = {
    deferredPrompt: null,
  };

  const beforeInstallPromptHandler = (event) => {
    event.preventDefault();
    installPromptState.deferredPrompt = event;
    window.__appInstallPrompt = event;
  };

  window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

  navigator.serviceWorker
    .register('/service-worker.js', { scope: '/' })
    .then((registration) => {
      // eslint-disable-next-line no-console
      console.info('[pwa] Service worker registered:', registration.scope);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.warn('[pwa] Service worker registration failed:', error);
    });

  window.promptInstallApp = async () => {
    if (!installPromptState.deferredPrompt) {
      return false;
    }

    installPromptState.deferredPrompt.prompt();
    const choice = await installPromptState.deferredPrompt.userChoice;
    installPromptState.deferredPrompt = null;
    window.__appInstallPrompt = null;
    return choice.outcome === 'accepted';
  };
}
