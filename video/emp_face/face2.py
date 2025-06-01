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

    # Perform emotion analysis
    try:
        analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        emotion = analysis[0]['dominant_emotion']
        emotion_counter[emotion] += 1

        # Display emotion on screen
        cv2.putText(frame, f"Emotion: {emotion}", (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    except Exception as e:
        print(f"Error in analysis: {e}")
    
    # Show the frame
    cv2.imshow("Facial Emotion Recognition", frame)

    # Press 'q' to exit early
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Determine most common emotion
if emotion_counter:
    most_common_emotion = emotion_counter.most_common(1)[0][0]
    print(f"\n Likely emotional state based on facial expression (most shown in 10s): {most_common_emotion}")
else:
    print("\nNo emotions detected.")

# Release resources
cap.release()
cv2.destroyAllWindows()
