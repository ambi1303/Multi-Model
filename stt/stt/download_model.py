import os
import requests
import zipfile
import shutil
from tqdm import tqdm

def download_file(url, filename):
    """Download a file with progress bar"""
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    block_size = 1024
    progress_bar = tqdm(total=total_size, unit='iB', unit_scale=True)
    
    with open(filename, 'wb') as f:
        for data in response.iter_content(block_size):
            progress_bar.update(len(data))
            f.write(data)
    progress_bar.close()

def main():
    # Create model directory
    model_dir = os.path.join(os.path.dirname(__file__), "api", "model")
    os.makedirs(model_dir, exist_ok=True)
    
    # Download small English model
    model_url = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
    zip_path = os.path.join(model_dir, "model.zip")
    
    print("Downloading Vosk model...")
    download_file(model_url, zip_path)
    
    print("Extracting model...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(model_dir)
    
    # Move model files to correct location
    extracted_dir = os.path.join(model_dir, "vosk-model-small-en-us-0.15")
    for item in os.listdir(extracted_dir):
        shutil.move(os.path.join(extracted_dir, item), model_dir)
    
    # Clean up
    os.rmdir(extracted_dir)
    os.remove(zip_path)
    
    print("Model downloaded and extracted successfully!")

if __name__ == "__main__":
    main() 