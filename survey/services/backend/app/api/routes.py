from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.survey import SurveyResponse, SurveyResponseCreate, SurveyResponseUpdate
from app.services import run_all_models, get_survey_responses, create_survey_response, update_survey_response

router = APIRouter()

@router.get("/")
def health_check():
    return {"status": "ok"}

@router.post("/analyze")
async def analyze_survey(survey_data: SurveyResponseCreate):
    try:
        # Create initial survey response
        survey_response = await create_survey_response(survey_data)
        
        # Run analysis
        analysis_result = run_all_models()
        
        # Update survey with analysis results
        updated_response = await update_survey_response(
            survey_response.id,
            SurveyResponseUpdate(
                sentiment_score=analysis_result.get("sentiment_score"),
                emotion_analysis=analysis_result.get("emotion_analysis"),
                text_analysis=analysis_result.get("text_analysis")
            )
        )
        
        return updated_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/surveys", response_model=List[SurveyResponse])
async def get_surveys():
    try:
        return await get_survey_responses()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/surveys/{survey_id}", response_model=SurveyResponse)
async def get_survey(survey_id: int):
    try:
        survey = await get_survey_responses(survey_id)
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")
        return survey
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
