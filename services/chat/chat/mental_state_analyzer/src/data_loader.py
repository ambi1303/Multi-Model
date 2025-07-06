import json
from typing import Dict, List
from datetime import datetime

class DataLoader:
    def __init__(self, file_path: str):
        self.file_path = file_path
        
    def load_data(self) -> Dict:
        """Load and parse the JSON file containing chat messages."""
        try:
            with open(self.file_path, 'r') as f:
                data = json.load(f)
            return data
        except FileNotFoundError:
            raise FileNotFoundError(f"Input file not found: {self.file_path}")
        except json.JSONDecodeError:
            raise ValueError(f"Invalid JSON format in file: {self.file_path}")
            
    def preprocess_messages(self, data: Dict) -> List[Dict]:
        """Preprocess messages by converting timestamps and cleaning text."""
        messages = data.get('messages', [])
        processed_messages = []
        
        for msg in messages:
            processed_msg = {
                'timestamp': datetime.fromisoformat(msg['timestamp']),
                'text': msg['text'].strip(),
                'person_id': data.get('person_id')
            }
            processed_messages.append(processed_msg)
            
        return processed_messages 