export interface FeatureRoute {
  id: string;
  label: string;
  href: `/${string}`;
  capability: string;
}

export interface FeatureModule {
  route: FeatureRoute;
  requiredCapability: string;
}
