# NOTE: This is a dummy service for development/testing only. Not used in production.
# The real survey backend is in survey/survey/backend.py

from typing import List, Optional
from app.models.survey import SurveyResponse, SurveyResponseCreate, SurveyResponseUpdate
import json
import os
from datetime import datetime

# In-memory storage for demo purposes
# In production, replace with proper database
SURVEY_STORAGE = []

def run_all_models():
    """
    Run all analysis models on the survey data
    """
    # TODO: Implement actual model analysis
    return {
        "sentiment_score": 0.75,
        "emotion_analysis": {
            "joy": 0.6,
            "sadness": 0.1,
            "anger": 0.05,
            "fear": 0.05,
            "surprise": 0.2
        },
        "text_analysis": {
            "keywords": ["positive", "satisfied", "good"],
            "topics": ["service", "quality", "experience"]
        }
    }

async def create_survey_response(survey_data: SurveyResponseCreate) -> SurveyResponse:
    """
    Create a new survey response
    """
    survey = SurveyResponse(
        id=len(SURVEY_STORAGE) + 1,
        user_id=survey_data.user_id,
        responses=survey_data.responses
    )
    SURVEY_STORAGE.append(survey)
    return survey

async def get_survey_responses(survey_id: Optional[int] = None) -> List[SurveyResponse]:
    """
    Get survey responses, optionally filtered by ID
    """
    if survey_id:
        return next((s for s in SURVEY_STORAGE if s.id == survey_id), None)
    return SURVEY_STORAGE

async def update_survey_response(survey_id: int, update_data: SurveyResponseUpdate) -> SurveyResponse:
    """
    Update a survey response with analysis results
    """
    survey = await get_survey_responses(survey_id)
    if not survey:
        raise ValueError(f"Survey {survey_id} not found")
    
    # Update fields
    if update_data.sentiment_score is not None:
        survey.sentiment_score = update_data.sentiment_score
    if update_data.emotion_analysis is not None:
        survey.emotion_analysis = update_data.emotion_analysis
    if update_data.text_analysis is not None:
        survey.text_analysis = update_data.text_analysis
    
    return survey
