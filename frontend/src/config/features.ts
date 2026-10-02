// Feature flags for Kabadiwala Connect platform
// Allows live switching of experimental / proposed regulatory modules during demos

export const getEprMarketplaceFeatureState = (): boolean => {
  const stored = localStorage.getItem('sih_epr_marketplace_enabled');
  if (stored !== null) {
    return stored === 'true';
  }
  return false; // Disabled by default for streamlined informal trade & zero friction
};

export const setEprMarketplaceFeatureState = (enabled: boolean): void => {
  localStorage.setItem('sih_epr_marketplace_enabled', String(enabled));
  // Dispatch custom window event so all components update state immediately
  window.dispatchEvent(new Event('epr_feature_toggle_changed'));
};
