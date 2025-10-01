import { ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import type { RiskFactor, RiskLevel } from 'lib/interfaces';
import analytics from './analytics';

export const RiskFactorScore: Record<string, number> = {
  allowlist: -100,
  blocklist: 100,
  closed_source: 40,
  deprecated: 100,
  eoa: 100,
  excessive_expiration: 60,
  exploit: 100,
  phishing_risk: 40,
  proxy: 20,
  suspicious_address: 60,
  unsafe: 40,
  uninitialized: 40,
};

export const filterUnknownRiskFactors = (riskFactors: RiskFactor[]): RiskFactor[] => {
  return riskFactors.filter((riskFactor) => {
    if (RiskFactorScore[riskFactor.type] === undefined) {
      analytics.track('Unknown Risk Factor', riskFactor);
      return false;
    }

    return true;
  });
};

export const getRiskFactorScore = (riskFactor: RiskFactor): number => {
  return RiskFactorScore[riskFactor.type] ?? 0;
};

export const calculateRiskScore = (riskFactors: RiskFactor[]): number => {
  const riskScore = riskFactors.reduce((acc, riskFactor) => acc + getRiskFactorScore(riskFactor), 0);
  return Math.max(Math.min(riskScore, 100), 0);
};

export const getRiskLevel = (riskFactors: RiskFactor[]): RiskLevel => {
  if (riskFactors.length === 0) return 'unknown';

  const riskScore = calculateRiskScore(riskFactors);

  if (riskScore >= 75) return 'high';
  if (riskScore <= 25) return 'low';

  return 'medium';
};

export const getRiskIcon = (riskFactor: RiskFactor) => {
  const score = getRiskFactorScore(riskFactor);

  if (score > 75) {
    return <ExclamationCircleIcon className=" text-red-500 h-5" />;
  }

  if (score > 0) {
    return <ExclamationTriangleIcon className="text-yellow-500 h-5" />;
  }

  // Green is only used for negative risk factors (e.g. allowlist)
  return <InformationCircleIcon className="text-green-500 h-5" />;
};
