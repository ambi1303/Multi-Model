import cv2
from deepface import DeepFace
from collections import Counter
import time

# Initialize webcam
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not access webcam.")
    exit()

emotion_counter = Counter()
start_time = time.time()
duration = 10  # seconds

print("🔬 High-Accuracy Emotion Recognition")
print("=" * 40)
print("🎯 Target emotions: Happy, Sad, Surprise, Angry")
print("Capturing emotions for 10 seconds...")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Error: Could not capture frame.")
        break

    current_time = time.time()
    elapsed_time = current_time - start_time

    if elapsed_time > duration:
        break

    # Perform emotion analysis (exactly like reference code)
    try:
        analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        emotion = analysis[0]['dominant_emotion']
        emotion_counter[emotion] += 1

        # Display emotion on screen
        cv2.putText(frame, f"Emotion: {emotion}", (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Show time remaining
        time_remaining = max(0, duration - elapsed_time)
        cv2.putText(frame, f"Time: {time_remaining:.1f}s", (20, 90),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    except Exception as e:
        print(f"Error in analysis: {e}")
    
    # Show the frame
    cv2.imshow("🔬 High-Accuracy Emotion Recognition", frame)

    # Press 'q' to exit early
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Advanced Results Analysis
if emotion_counter:
    most_common_emotion = emotion_counter.most_common(1)[0][0]
    total_detections = sum(emotion_counter.values())
    
    print(f"\n🎯 ANALYSIS RESULTS")
    print("=" * 30)
    print(f"🏆 Most prominent emotion: {most_common_emotion.upper()}")
    print(f"⏱️  Analysis duration: {duration} seconds")
    print(f"📊 Total detections: {total_detections}")
    
    print(f"\n📈 EMOTION FREQUENCY ANALYSIS:")
    print("-" * 30)
    
    for emotion, count in emotion_counter.most_common():
        percentage = (count / total_detections) * 100
        
        # Highlight target emotions
        if emotion in ['happy', 'sad', 'surprise', 'angry']:
            print(f"🎭 {emotion.upper()}: {count} times ({percentage:.1f}%)")
        else:
            print(f"   {emotion.capitalize()}: {count} times ({percentage:.1f}%)")
    
    # Detailed analysis for target emotions
    print(f"\n🎯 TARGET EMOTIONS DETAILED ANALYSIS:")
    print("-" * 40)
    target_emotions = ['happy', 'sad', 'surprise', 'angry']
    
    for emotion in target_emotions:
        if emotion in emotion_counter:
            count = emotion_counter[emotion]
            percentage = (count / total_detections) * 100
            
            # Provide interpretation
            if percentage >= 40:
                intensity = "STRONG"
            elif percentage >= 20:
                intensity = "MODERATE"
            elif percentage >= 10:
                intensity = "MILD"
            else:
                intensity = "MINIMAL"
            
            print(f"🎭 {emotion.upper()}: {intensity} presence ({percentage:.1f}%)")
    
    # Overall confidence assessment
    if total_detections >= 20:
        confidence_level = "VERY HIGH"
    elif total_detections >= 15:
        confidence_level = "HIGH"
    elif total_detections >= 10:
        confidence_level = "MEDIUM"
    else:
        confidence_level = "LOW"
    
    print(f"\n📊 ANALYSIS CONFIDENCE: {confidence_level} ({total_detections} detections)")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    print("-" * 20)
    if most_common_emotion in target_emotions:
        print(f"✅ Primary emotion '{most_common_emotion}' detected with high accuracy")
    else:
        print(f"⚠️  Primary emotion '{most_common_emotion}' detected (not in target set)")
    
    # Check for emotional complexity
    target_emotion_count = sum(1 for emotion in target_emotions if emotion in emotion_counter)
    if target_emotion_count >= 3:
        print("🔄 Multiple target emotions detected - complex emotional state")
    elif target_emotion_count >= 2:
        print("🔄 Two target emotions detected - mixed emotional state")
    
else:
    print("\n❌ No emotions detected.")
    print("💡 Try adjusting lighting, facial expression, or camera position.")

# Release resources
cap.release()
cv2.destroyAllWindows()
