/**
 * Represents the combined analysis data from multiple sources,
 * including ML predictions and survey results.
 */
export interface CombinedAnalysisResponse {
  message: string;
  mlResult?: {
    burnout_score: number;
    risk_level: 'Low' | 'Medium' | 'High';
  };
  surveyResult?: {
    [key: string]: any; 
  };
  breakdown?: Array<{
    category: string;
    score: number;
    description: string;
  }>;
}

/**
 * An extended interface used by the survey result component,
 * adding more specific, structured data fields.
 */
export interface ExtendedAnalysisResponse extends CombinedAnalysisResponse {
  riskLevel?: 'Low' | 'Medium' | 'High';
  burnoutScore?: number;
  mental_health_summary?: string;
  source?: string;
  recommendations?: {
    title: string;
    description: string;
    icon: string;
  }[];
  employeeData?: {
    designation_encoded?: number;
    gender_encoded?: number;
    company_type_encoded?: number;
    wfh_setup_available_encoded?: number;
    mental_fatigue_score?: number;
    resource_allocation?: number;
  };
  surveyResults?: {
    stress_level?: number;
    job_satisfaction?: number;
    work_life_balance?: number;
    emotional_exhaustion?: number;
  };
} 