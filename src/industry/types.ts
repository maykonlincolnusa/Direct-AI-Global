import { SourceConnectorType } from '../connectors/types';
import { BusinessDomain, IndustryType } from '../models/canonical';

export interface IndustryKpi {
  key: string;
  label: string;
  domain: BusinessDomain;
  outcome: 'revenue' | 'efficiency' | 'risk' | 'retention';
  description: string;
}

export interface IndustryActionTemplate {
  title: string;
  why: string;
  impact: 'revenue' | 'efficiency' | 'risk' | 'retention';
  horizon: 'now' | 'next' | 'later';
}

export interface IndustryPack {
  key: IndustryType;
  label: string;
  description: string;
  keywords: string[];
  requiredDomains: BusinessDomain[];
  recommendedConnectors: SourceConnectorType[];
  kpis: IndustryKpi[];
  actionTemplates: IndustryActionTemplate[];
}

export interface IndustryAssessmentCandidate {
  industry: IndustryType;
  label: string;
  score: number;
  reasons: string[];
}

export interface ConnectorRecommendation {
  connectorType: SourceConnectorType;
  domain: BusinessDomain;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface DomainCoverage {
  present: boolean;
  entityCount: number;
  connectorCount: number;
  score: number;
}

export interface DataReadinessReport {
  overallScore: number;
  freshnessScore: number;
  sourceBreadth: number;
  missingDomains: BusinessDomain[];
  confidence: 'low' | 'medium' | 'high';
  domainCoverage: Record<BusinessDomain, DomainCoverage>;
}

export interface BusinessMetricCard {
  key: string;
  label: string;
  value: number;
  unit: 'count' | 'currency' | 'ratio';
  narrative: string;
}

export interface IndustryAssessment {
  primaryIndustry: IndustryType;
  label: string;
  description: string;
  confidence: 'low' | 'medium' | 'high';
  candidates: IndustryAssessmentCandidate[];
  signals: string[];
  recommendedConnectors: ConnectorRecommendation[];
  readiness: DataReadinessReport;
  kpis: IndustryKpi[];
  businessMetrics: BusinessMetricCard[];
}

export interface ExecutionPriority {
  title: string;
  why: string;
  impact: 'revenue' | 'efficiency' | 'risk' | 'retention';
  horizon: 'now' | 'next' | 'later';
}

export interface TenantExecutionPlan {
  primaryIndustry: IndustryType;
  readinessScore: number;
  priorities: ExecutionPriority[];
  kpiFocus: IndustryKpi[];
  connectorRecommendations: ConnectorRecommendation[];
}
