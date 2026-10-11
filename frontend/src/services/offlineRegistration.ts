let registrationTask: Promise<ServiceWorkerRegistration> | undefined;
export let offlineRegistrationError = '';

export function registerOfflineWorker() {
  if (!registrationTask) {
    offlineRegistrationError = '';
    registrationTask = navigator.serviceWorker.register('/offline-sw.js', { updateViaCache: 'none' })
      .catch((error: unknown) => {
        offlineRegistrationError = error instanceof Error ? error.message : 'Registration failed';
        registrationTask = undefined;
        throw error;
      });
  }
  return registrationTask;
}
