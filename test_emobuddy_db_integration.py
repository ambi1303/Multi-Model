#!/usr/bin/env python3

import asyncio
import aiohttp
import json
import tempfile
import os
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Service URLs
STT_SERVICE_URL = "http://localhost:8002"
CORE_SERVICE_URL = "http://localhost:8000"
INTEGRATED_BACKEND_URL = "http://localhost:9000"

# Test user (use existing user for now)
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"  # Example UUID
TEST_TOKEN = "test_token"  # We'll need to get a real token

class EmoBuddyDBIntegrationTest:
    def __init__(self):
        self.session = None
        self.test_results = {}

    async def start_session(self):
        """Start HTTP session"""
        self.session = aiohttp.ClientSession()
        logger.info("🔧 Starting EmoBuddy DB integration test")

    async def close_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
            logger.info("🔧 Closed test session")

    async def test_stt_service_health(self):
        """Test STT service health to verify it's running"""
        logger.info("🏥 Testing STT service health...")
        try:
            async with self.session.get(f"{STT_SERVICE_URL}/health") as response:
                if response.status == 200:
                    health_data = await response.json()
                    logger.info(f"✅ STT service is healthy: {health_data}")
                    
                    # Log important info
                    logger.info(f"   - Active sessions: {health_data.get('active_sessions', 0)}")
                    logger.info(f"   - Active core sessions: {health_data.get('active_core_sessions', 0)}")
                    logger.info(f"   - Core service URL: {health_data.get('core_service_url')}")
                    logger.info(f"   - Has service token: {health_data.get('has_service_token')}")
                    
                    return True
                else:
                    logger.error(f"❌ STT service health check failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ STT service health check error: {e}")
            return False

    async def test_core_service_health(self):
        """Test Core service health to verify it's running"""
        logger.info("🏥 Testing Core service health...")
        try:
            async with self.session.get(f"{CORE_SERVICE_URL}/health") as response:
                if response.status == 200:
                    health_data = await response.json()
                    logger.info(f"✅ Core service is healthy: {health_data}")
                    return True
                else:
                    logger.error(f"❌ Core service health check failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Core service health check error: {e}")
            return False

    async def test_speech_analysis_with_emobuddy(self):
        """Test speech analysis with EmoBuddy integration"""
        logger.info("🎤 Testing speech analysis with EmoBuddy...")
        
        try:
            # Create a minimal WAV file for testing
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                # Create a minimal WAV file (just headers)
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
            data.add_field('user_id', TEST_USER_ID)
            data.add_field('token', TEST_TOKEN)
            
            async with self.session.post(f"{STT_SERVICE_URL}/analyze-speech", data=data) as response:
                if response.status == 200:
                    response_data = await response.json()
                    logger.info("✅ Speech analysis successful")
                    logger.info(f"   - Has transcription: {bool(response_data.get('transcription'))}")
                    logger.info(f"   - Has sentiment: {bool(response_data.get('sentiment'))}")
                    logger.info(f"   - Has emotions: {bool(response_data.get('emotions'))}")
                    logger.info(f"   - Has EmoBuddy response: {bool(response_data.get('emo_buddy_response'))}")
                    logger.info(f"   - Session ID: {response_data.get('session_id')}")
                    
                    # Check EmoBuddy response
                    if response_data.get('emo_buddy_response'):
                        logger.info(f"   - EmoBuddy response (first 100 chars): {response_data.get('emo_buddy_response', '')[:100]}...")
                    
                    self.test_results['speech_analysis'] = {
                        'status': 'success',
                        'session_id': response_data.get('session_id'),
                        'has_emobuddy_response': bool(response_data.get('emo_buddy_response')),
                        'response_data': response_data
                    }
                    
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Speech analysis failed: {response.status} - {error_text}")
                    self.test_results['speech_analysis'] = {'status': 'failed', 'error': error_text}
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Speech analysis error: {e}")
            self.test_results['speech_analysis'] = {'status': 'error', 'error': str(e)}
            return False
        finally:
            # Clean up temp file
            if 'temp_file_path' in locals():
                try:
                    os.unlink(temp_file_path)
                except:
                    pass

    async def test_emobuddy_session_in_database(self):
        """Test if EmoBuddy session was created in database"""
        logger.info("🗄️ Testing EmoBuddy session database storage...")
        
        try:
            # Try to get EmoBuddy sessions from core service
            async with self.session.get(f"{CORE_SERVICE_URL}/emo-buddy/sessions/user/{TEST_USER_ID}") as response:
                if response.status == 200:
                    sessions = await response.json()
                    logger.info(f"✅ Retrieved {len(sessions)} EmoBuddy sessions from database")
                    
                    if sessions:
                        latest_session = sessions[0]
                        logger.info(f"   - Latest session UUID: {latest_session.get('session_uuid')}")
                        logger.info(f"   - Message count: {latest_session.get('message_count', 0)}")
                        logger.info(f"   - Session start: {latest_session.get('session_start')}")
                        logger.info(f"   - Is active: {latest_session.get('is_active_session')}")
                        
                        self.test_results['database_sessions'] = {
                            'status': 'success',
                            'session_count': len(sessions),
                            'latest_session': latest_session
                        }
                        
                        return True
                    else:
                        logger.warning("⚠️ No EmoBuddy sessions found in database")
                        self.test_results['database_sessions'] = {'status': 'no_sessions'}
                        return False
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to retrieve EmoBuddy sessions: {response.status} - {error_text}")
                    self.test_results['database_sessions'] = {'status': 'failed', 'error': error_text}
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Database session test error: {e}")
            self.test_results['database_sessions'] = {'status': 'error', 'error': str(e)}
            return False

    async def test_emobuddy_continue_conversation(self):
        """Test continuing EmoBuddy conversation"""
        logger.info("💬 Testing EmoBuddy conversation continuation...")
        
        speech_result = self.test_results.get('speech_analysis', {})
        session_id = speech_result.get('session_id')
        
        if not session_id:
            logger.error("❌ No session ID available for conversation test")
            return False
        
        try:
            # Test continuing conversation
            data = aiohttp.FormData()
            data.add_field('session_id', session_id)
            data.add_field('user_input', "I'm still feeling anxious about my work situation")
            data.add_field('user_id', TEST_USER_ID)
            data.add_field('token', TEST_TOKEN)
            
            async with self.session.post(f"{STT_SERVICE_URL}/continue-emo-buddy", data=data) as response:
                if response.status == 200:
                    response_data = await response.json()
                    logger.info("✅ EmoBuddy conversation continued successfully")
                    logger.info(f"   - Response: {response_data.get('response', '')[:100]}...")
                    logger.info(f"   - Should continue: {response_data.get('should_continue')}")
                    
                    self.test_results['conversation_continue'] = {
                        'status': 'success',
                        'response': response_data
                    }
                    
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to continue conversation: {response.status} - {error_text}")
                    self.test_results['conversation_continue'] = {'status': 'failed', 'error': error_text}
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Conversation continuation error: {e}")
            self.test_results['conversation_continue'] = {'status': 'error', 'error': str(e)}
            return False

    async def run_all_tests(self):
        """Run all EmoBuddy database integration tests"""
        logger.info("🚀 Starting EmoBuddy Database Integration Tests")
        logger.info("=" * 60)
        
        try:
            await self.start_session()
            
            # Test sequence
            tests = [
                ("STT Service Health", self.test_stt_service_health),
                ("Core Service Health", self.test_core_service_health),
                ("Speech Analysis with EmoBuddy", self.test_speech_analysis_with_emobuddy),
                ("EmoBuddy Session in Database", self.test_emobuddy_session_in_database),
                ("EmoBuddy Conversation Continue", self.test_emobuddy_continue_conversation),
            ]
            
            results = {}
            for test_name, test_func in tests:
                logger.info(f"\n🔍 Running: {test_name}")
                try:
                    results[test_name] = await test_func()
                    await asyncio.sleep(0.5)  # Brief pause between tests
                except Exception as e:
                    logger.error(f"❌ Test '{test_name}' crashed: {e}")
                    results[test_name] = False
            
            # Summary
            logger.info("\n" + "=" * 60)
            logger.info("📊 TEST RESULTS SUMMARY")
            logger.info("=" * 60)
            
            passed = sum(1 for result in results.values() if result)
            total = len(results)
            
            for test_name, result in results.items():
                status = "✅ PASS" if result else "❌ FAIL"
                logger.info(f"{test_name:.<40} {status}")
            
            logger.info("=" * 60)
            logger.info(f"📈 OVERALL: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
            
            if passed == total:
                logger.info("🎉 ALL TESTS PASSED - EmoBuddy database integration is working!")
            else:
                logger.warning(f"⚠️ {total-passed} test(s) failed")
                
                # Show detailed results
                logger.info("\n🔍 DETAILED RESULTS:")
                for key, value in self.test_results.items():
                    logger.info(f"   {key}: {value}")
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Test suite failed: {e}")
            return {}
        finally:
            await self.close_session()

async def main():
    """Main function to run the test"""
    tester = EmoBuddyDBIntegrationTest()
    results = await tester.run_all_tests()
    
    # Exit with appropriate code
    all_passed = all(results.values()) if results else False
    exit(0 if all_passed else 1)

if __name__ == "__main__":
    asyncio.run(main()) 