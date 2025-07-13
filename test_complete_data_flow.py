#!/usr/bin/env python3

import asyncio
import aiohttp
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import tempfile
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Service URLs
INTEGRATED_BACKEND_URL = "http://localhost:9000"
CORE_SERVICE_URL = "http://localhost:8000"
STT_SERVICE_URL = "http://localhost:8002"
EMO_BUDDY_SERVICE_URL = "http://localhost:8005"

# Test credentials
TEST_USER = {
    "email": "test@example.com",
    "password": "testpassword123"
}

class DatabaseFlowAuditor:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.user_id = None
        self.results = {
            "authentication": {"status": "pending", "details": {}},
            "speech_analysis": {"status": "pending", "details": {}},
            "emobuddy_integration": {"status": "pending", "details": {}},
            "database_storage": {"status": "pending", "details": {}},
            "issues_found": []
        }

    async def start_session(self):
        """Start HTTP session"""
        self.session = aiohttp.ClientSession()
        logger.info("🔧 Starting database flow audit session")

    async def close_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
            logger.info("🔧 Closed audit session")

    async def authenticate(self):
        """Test authentication flow"""
        logger.info("🔐 Testing authentication flow...")
        try:
            # Login to get token
            async with self.session.post(
                f"{INTEGRATED_BACKEND_URL}/auth/login",
                json=TEST_USER
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("access_token")
                    self.user_id = data.get("user", {}).get("id")
                    
                    self.results["authentication"]["status"] = "success"
                    self.results["authentication"]["details"] = {
                        "token_received": bool(self.auth_token),
                        "user_id_received": bool(self.user_id)
                    }
                    logger.info(f"✅ Authentication successful - User ID: {self.user_id}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Authentication failed: {response.status} - {error_text}")
                    self.results["authentication"]["status"] = "failed"
                    self.results["authentication"]["details"] = {"error": error_text}
                    return False
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            self.results["authentication"]["status"] = "error"
            self.results["authentication"]["details"] = {"error": str(e)}
            return False

    async def test_speech_analysis_flow(self):
        """Test speech analysis with EmoBuddy integration"""
        logger.info("🎤 Testing speech analysis flow...")
        
        if not self.auth_token or not self.user_id:
            logger.error("❌ Cannot test speech analysis - authentication required")
            return False

        try:
            # Create a dummy audio file for testing
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                # Create a minimal WAV file (just headers, no actual audio)
                temp_file.write(b'RIFF')
                temp_file.write((36).to_bytes(4, 'little'))
                temp_file.write(b'WAVE')
                temp_file.write(b'fmt ')
                temp_file.write((16).to_bytes(4, 'little'))
                temp_file.write((1).to_bytes(2, 'little'))  # PCM
                temp_file.write((1).to_bytes(2, 'little'))  # Mono
                temp_file.write((16000).to_bytes(4, 'little'))  # Sample rate
                temp_file.write((32000).to_bytes(4, 'little'))  # Byte rate
                temp_file.write((2).to_bytes(2, 'little'))  # Block align
                temp_file.write((16).to_bytes(2, 'little'))  # Bits per sample
                temp_file.write(b'data')
                temp_file.write((0).to_bytes(4, 'little'))  # Data size
                temp_file_path = temp_file.name

            # Test speech analysis
            data = aiohttp.FormData()
            data.add_field('file', open(temp_file_path, 'rb'), filename='test_audio.wav')
            data.add_field('user_id', self.user_id)

            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.post(
                f"{INTEGRATED_BACKEND_URL}/analyze-speech",
                data=data,
                headers=headers
            ) as response:
                response_data = await response.json() if response.status == 200 else await response.text()
                
                self.results["speech_analysis"]["status"] = "success" if response.status == 200 else "failed"
                self.results["speech_analysis"]["details"] = {
                    "response_status": response.status,
                    "has_transcription": bool(response_data.get("transcription")) if response.status == 200 else False,
                    "has_sentiment": bool(response_data.get("sentiment")) if response.status == 200 else False,
                    "has_emotions": bool(response_data.get("emotions")) if response.status == 200 else False,
                    "has_emobuddy_response": bool(response_data.get("emo_buddy_response")) if response.status == 200 else False,
                    "has_technical_report": bool(response_data.get("technical_report")) if response.status == 200 else False,
                    "has_gen_ai_insights": bool(response_data.get("gen_ai_insights")) if response.status == 200 else False,
                    "session_id": response_data.get("session_id") if response.status == 200 else None,
                    "response_data": response_data
                }
                
                if response.status == 200:
                    logger.info("✅ Speech analysis successful")
                    logger.info(f"   - EmoBuddy response: {bool(response_data.get('emo_buddy_response'))}")
                    logger.info(f"   - Technical report: {bool(response_data.get('technical_report'))}")
                    logger.info(f"   - Session ID: {response_data.get('session_id')}")
                    return True
                else:
                    logger.error(f"❌ Speech analysis failed: {response.status} - {response_data}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Speech analysis error: {e}")
            self.results["speech_analysis"]["status"] = "error"
            self.results["speech_analysis"]["details"] = {"error": str(e)}
            return False
        finally:
            # Clean up temp file
            if 'temp_file_path' in locals():
                try:
                    os.unlink(temp_file_path)
                except:
                    pass

    async def test_emobuddy_session_storage(self):
        """Test EmoBuddy session database storage"""
        logger.info("🤖 Testing EmoBuddy session storage...")
        
        if not self.auth_token or not self.user_id:
            logger.error("❌ Cannot test EmoBuddy - authentication required")
            return False

        try:
            # Test EmoBuddy session creation via Core Service
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.post(
                f"{CORE_SERVICE_URL}/emo-buddy/sessions",
                headers=headers
            ) as response:
                if response.status == 200:
                    session_data = await response.json()
                    session_uuid = session_data.get("session_uuid")
                    
                    logger.info(f"✅ EmoBuddy session created: {session_uuid}")
                    
                    # Test adding a message
                    message_data = {
                        "message_text": "Hello, I'm feeling stressed today.",
                        "is_user_message": True,
                        "sentiment": "negative"
                    }
                    
                    async with self.session.post(
                        f"{CORE_SERVICE_URL}/emo-buddy/sessions/{session_uuid}/messages",
                        json=message_data,
                        headers=headers
                    ) as msg_response:
                        if msg_response.status == 200:
                            logger.info("✅ EmoBuddy message added successfully")
                            
                            # Test getting session
                            async with self.session.get(
                                f"{CORE_SERVICE_URL}/emo-buddy/sessions/{session_uuid}",
                                headers=headers
                            ) as get_response:
                                if get_response.status == 200:
                                    session_info = await get_response.json()
                                    self.results["emobuddy_integration"]["status"] = "success"
                                    self.results["emobuddy_integration"]["details"] = {
                                        "session_created": True,
                                        "message_added": True,
                                        "session_retrieved": True,
                                        "session_uuid": session_uuid,
                                        "message_count": session_info.get("message_count", 0)
                                    }
                                    logger.info("✅ EmoBuddy session retrieval successful")
                                    return True
                                else:
                                    logger.error(f"❌ Failed to retrieve EmoBuddy session: {get_response.status}")
                        else:
                            logger.error(f"❌ Failed to add EmoBuddy message: {msg_response.status}")
                else:
                    logger.error(f"❌ Failed to create EmoBuddy session: {response.status}")
                    
            self.results["emobuddy_integration"]["status"] = "failed"
            return False
            
        except Exception as e:
            logger.error(f"❌ EmoBuddy session storage error: {e}")
            self.results["emobuddy_integration"]["status"] = "error"
            self.results["emobuddy_integration"]["details"] = {"error": str(e)}
            return False

    async def test_database_storage(self):
        """Test database storage for analysis results"""
        logger.info("💾 Testing database storage...")
        
        if not self.auth_token or not self.user_id:
            logger.error("❌ Cannot test database storage - authentication required")
            return False

        try:
            # Test getting user's speech analyses
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.get(
                f"{CORE_SERVICE_URL}/analyses/speech/user/{self.user_id}",
                headers=headers
            ) as response:
                if response.status == 200:
                    analyses = await response.json()
                    logger.info(f"✅ Retrieved {len(analyses)} speech analyses from database")
                    
                    self.results["database_storage"]["status"] = "success"
                    self.results["database_storage"]["details"] = {
                        "speech_analyses_count": len(analyses),
                        "latest_analysis": analyses[0] if analyses else None
                    }
                    return True
                else:
                    logger.error(f"❌ Failed to retrieve speech analyses: {response.status}")
                    self.results["database_storage"]["status"] = "failed"
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Database storage test error: {e}")
            self.results["database_storage"]["status"] = "error"
            self.results["database_storage"]["details"] = {"error": str(e)}
            return False

    async def identify_issues(self):
        """Identify issues with the database flow"""
        logger.info("🔍 Identifying database flow issues...")
        
        issues = []
        
        # Check authentication
        if self.results["authentication"]["status"] != "success":
            issues.append({
                "category": "authentication",
                "severity": "critical",
                "description": "Authentication flow is not working properly",
                "impact": "Users cannot access the system"
            })
        
        # Check speech analysis
        speech_details = self.results["speech_analysis"]["details"]
        if self.results["speech_analysis"]["status"] != "success":
            issues.append({
                "category": "speech_analysis",
                "severity": "critical",
                "description": "Speech analysis endpoint is not working",
                "impact": "Audio analysis feature is broken"
            })
        elif speech_details.get("has_emobuddy_response") is False:
            issues.append({
                "category": "speech_analysis",
                "severity": "major",
                "description": "EmoBuddy response is missing from speech analysis",
                "impact": "Users don't get therapeutic companion responses during audio analysis"
            })
        
        # Check EmoBuddy integration
        if self.results["emobuddy_integration"]["status"] != "success":
            issues.append({
                "category": "emobuddy_integration",
                "severity": "major",
                "description": "EmoBuddy session storage is not working",
                "impact": "EmoBuddy conversations are not being saved to database"
            })
        
        # Check database storage
        if self.results["database_storage"]["status"] != "success":
            issues.append({
                "category": "database_storage",
                "severity": "critical",
                "description": "Database storage is not working properly",
                "impact": "Analysis results are not being persisted"
            })
        
        # Check for missing EmoBuddy session creation during speech analysis
        if (self.results["speech_analysis"]["status"] == "success" and 
            self.results["speech_analysis"]["details"].get("has_emobuddy_response") and
            self.results["emobuddy_integration"]["status"] == "success"):
            # This suggests EmoBuddy works standalone but not integrated with speech analysis
            issues.append({
                "category": "integration",
                "severity": "major",
                "description": "EmoBuddy sessions are not being created during speech analysis",
                "impact": "EmoBuddy responses from audio analysis are not stored in database"
            })
        
        self.results["issues_found"] = issues
        
        # Log issues
        if issues:
            logger.warning(f"⚠️  Found {len(issues)} issues:")
            for issue in issues:
                logger.warning(f"   - {issue['severity'].upper()}: {issue['description']}")
        else:
            logger.info("✅ No issues found - database flow is working correctly")

    async def generate_report(self):
        """Generate comprehensive audit report"""
        logger.info("📋 Generating audit report...")
        
        report = {
            "audit_timestamp": datetime.now().isoformat(),
            "audit_summary": {
                "total_tests": 4,
                "passed_tests": sum(1 for result in self.results.values() if isinstance(result, dict) and result.get("status") == "success"),
                "failed_tests": sum(1 for result in self.results.values() if isinstance(result, dict) and result.get("status") == "failed"),
                "error_tests": sum(1 for result in self.results.values() if isinstance(result, dict) and result.get("status") == "error"),
                "issues_found": len(self.results["issues_found"])
            },
            "detailed_results": self.results,
            "recommendations": []
        }
        
        # Add recommendations based on issues
        for issue in self.results["issues_found"]:
            if issue["category"] == "integration":
                report["recommendations"].append({
                    "priority": "high",
                    "action": "Integrate EmoBuddy session creation with speech analysis flow",
                    "description": "Modify STT service to create EmoBuddy sessions in database during audio analysis"
                })
            elif issue["category"] == "speech_analysis":
                report["recommendations"].append({
                    "priority": "high",
                    "action": "Fix EmoBuddy integration in speech analysis",
                    "description": "Ensure EmoBuddy responses are properly generated and returned"
                })
            elif issue["category"] == "database_storage":
                report["recommendations"].append({
                    "priority": "critical",
                    "action": "Fix database storage connections",
                    "description": "Ensure all services can properly store and retrieve data from database"
                })
        
        # Save report to file
        report_filename = f"database_flow_audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"📁 Audit report saved to: {report_filename}")
        return report

    async def run_complete_audit(self):
        """Run complete database flow audit"""
        logger.info("🚀 Starting complete database flow audit...")
        
        try:
            await self.start_session()
            
            # Run tests in sequence
            await self.authenticate()
            await self.test_speech_analysis_flow()
            await self.test_emobuddy_session_storage()
            await self.test_database_storage()
            
            # Analyze results
            await self.identify_issues()
            report = await self.generate_report()
            
            # Print summary
            logger.info("\n" + "="*60)
            logger.info("📊 DATABASE FLOW AUDIT SUMMARY")
            logger.info("="*60)
            logger.info(f"Tests Run: {report['audit_summary']['total_tests']}")
            logger.info(f"Passed: {report['audit_summary']['passed_tests']}")
            logger.info(f"Failed: {report['audit_summary']['failed_tests']}")
            logger.info(f"Errors: {report['audit_summary']['error_tests']}")
            logger.info(f"Issues Found: {report['audit_summary']['issues_found']}")
            
            if self.results["issues_found"]:
                logger.info("\n⚠️  CRITICAL ISSUES FOUND:")
                for issue in self.results["issues_found"]:
                    logger.info(f"   - {issue['severity'].upper()}: {issue['description']}")
            else:
                logger.info("\n✅ ALL TESTS PASSED - Database flow is working correctly!")
            
            logger.info("="*60)
            
        except Exception as e:
            logger.error(f"❌ Audit failed with error: {e}")
        finally:
            await self.close_session()

async def main():
    """Main function to run the audit"""
    auditor = DatabaseFlowAuditor()
    await auditor.run_complete_audit()

if __name__ == "__main__":
    asyncio.run(main()) 