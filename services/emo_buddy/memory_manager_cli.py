#!/usr/bin/env python3
"""
Emo Buddy Memory Manager CLI

Utility for managing Emo Buddy's conversation memory and session data.

Usage:
    python memory_manager_cli.py --clear
    python memory_manager_cli.py --stats
    python memory_manager_cli.py --backup
    python memory_manager_cli.py --help
"""

import os
import sys
import argparse
import logging
import shutil
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from emo_buddy.memory_manager import ConversationMemory
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MemoryManagerCLI:
    """Command-line interface for memory management"""
    
    def __init__(self):
        self.memory = ConversationMemory()
    
    def clear_memory(self, confirm: bool = False):
        """Clear all memory with confirmation"""
        if not confirm:
            print("⚠️  WARNING: This will permanently delete ALL conversation memory!")
            print("   • All past conversations will be lost")
            print("   • Emotional patterns will be reset") 
            print("   • Session history will be cleared")
            print("   • Memory vectors will be deleted")
            
            confirmation = input("\n🤔 Are you sure you want to continue? (type 'YES' to confirm): ")
            if confirmation != "YES":
                print("❌ Memory clearing cancelled.")
                return False
        
        try:
            # Get stats before clearing
            stats = self.get_memory_stats()
            
            # Clear memory
            self.memory.clear_memory()
            
            print("✅ Memory cleared successfully!")
            print(f"   • Deleted {stats['total_sessions']} sessions")
            print(f"   • Deleted {stats['total_memories']} memory entries")
            print(f"   • Freed {stats['memory_size_mb']:.2f} MB of storage")
            print("\n🆕 Emo Buddy will start fresh with no previous conversations.")
            
            return True
            
        except Exception as e:
            logger.error(f"Error clearing memory: {e}")
            print(f"❌ Error clearing memory: {e}")
            return False
    
    def get_memory_stats(self):
        """Get detailed memory statistics"""
        try:
            total_sessions = len(self.memory.sessions)
            total_memories = len(self.memory.metadata)
            
            # Calculate memory directory size
            memory_dir = Path(self.memory.memory_dir)
            memory_size = 0
            if memory_dir.exists():
                for file_path in memory_dir.rglob('*'):
                    if file_path.is_file():
                        memory_size += file_path.stat().st_size
            
            memory_size_mb = memory_size / (1024 * 1024)
            
            # Get emotion patterns
            emotion_patterns = self.memory.get_emotion_patterns()
            
            # Get crisis history
            crisis_history = self.memory.get_crisis_history()
            
            return {
                "total_sessions": total_sessions,
                "total_memories": total_memories,
                "memory_size_mb": memory_size_mb,
                "emotion_patterns": emotion_patterns,
                "crisis_history": crisis_history
            }
            
        except Exception as e:
            logger.error(f"Error getting memory stats: {e}")
            return {
                "total_sessions": 0,
                "total_memories": 0,
                "memory_size_mb": 0.0,
                "emotion_patterns": {},
                "crisis_history": []
            }
    
    def display_stats(self):
        """Display detailed memory statistics"""
        print("\n📊 EMO BUDDY MEMORY STATISTICS")
        print("=" * 50)
        
        stats = self.get_memory_stats()
        
        print(f"🗂️  Total Sessions: {stats['total_sessions']}")
        print(f"🧠 Memory Entries: {stats['total_memories']}")
        print(f"💾 Storage Used: {stats['memory_size_mb']:.2f} MB")
        
        # Emotion patterns
        if stats['emotion_patterns'].get('emotions_frequency'):
            print(f"\n💭 Most Common Emotions:")
            emotions = stats['emotion_patterns']['emotions_frequency']
            for emotion, count in sorted(emotions.items(), key=lambda x: x[1], reverse=True)[:5]:
                print(f"   • {emotion}: {count} times")
        
        # Techniques used
        if stats['emotion_patterns'].get('techniques_frequency'):
            print(f"\n🔧 Most Used Techniques:")
            techniques = stats['emotion_patterns']['techniques_frequency']
            for technique, count in sorted(techniques.items(), key=lambda x: x[1], reverse=True)[:5]:
                print(f"   • {technique.upper()}: {count} times")
        
        # Crisis history
        crisis_count = len(stats['crisis_history'])
        if crisis_count > 0:
            print(f"\n⚠️  Crisis Indicators: {crisis_count} detected")
            recent_crisis = stats['crisis_history'][0] if stats['crisis_history'] else None
            if recent_crisis:
                print(f"   • Most recent: Level {recent_crisis['level']} ({recent_crisis['timestamp'][:10]})")
        else:
            print(f"\n✅ Crisis Indicators: None detected")
        
        print("\n" + "=" * 50)
    
    def backup_memory(self):
        """Create a backup of current memory"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_dir = f"emo_buddy_memory_backup_{timestamp}"
            
            if os.path.exists(self.memory.memory_dir):
                shutil.copytree(self.memory.memory_dir, backup_dir)
                
                backup_size = sum(
                    os.path.getsize(os.path.join(dirpath, filename))
                    for dirpath, dirnames, filenames in os.walk(backup_dir)
                    for filename in filenames
                ) / (1024 * 1024)
                
                print(f"✅ Memory backed up successfully!")
                print(f"   • Location: {backup_dir}")
                print(f"   • Size: {backup_size:.2f} MB")
                print(f"   • Sessions: {len(self.memory.sessions)}")
                print(f"   • Memories: {len(self.memory.metadata)}")
                
                return backup_dir
            else:
                print("📂 No memory directory found - nothing to backup.")
                return None
                
        except Exception as e:
            logger.error(f"Error creating backup: {e}")
            print(f"❌ Error creating backup: {e}")
            return None
    
    def restore_memory(self, backup_dir: str):
        """Restore memory from backup"""
        try:
            if not os.path.exists(backup_dir):
                print(f"❌ Backup directory not found: {backup_dir}")
                return False
            
            # Clear current memory first
            print("🧹 Clearing current memory...")
            self.memory.clear_memory()
            
            # Remove memory directory if it exists
            if os.path.exists(self.memory.memory_dir):
                shutil.rmtree(self.memory.memory_dir)
            
            # Restore from backup
            shutil.copytree(backup_dir, self.memory.memory_dir)
            
            # Reinitialize memory
            self.memory = ConversationMemory()
            
            print(f"✅ Memory restored successfully from {backup_dir}")
            self.display_stats()
            
            return True
            
        except Exception as e:
            logger.error(f"Error restoring backup: {e}")
            print(f"❌ Error restoring backup: {e}")
            return False

def main():
    """Main CLI function"""
    parser = argparse.ArgumentParser(
        description="Emo Buddy Memory Manager - Manage conversation memory and session data"
    )
    
    parser.add_argument(
        "--clear", 
        action="store_true", 
        help="Clear all conversation memory (PERMANENT)"
    )
    
    parser.add_argument(
        "--stats", 
        action="store_true", 
        help="Display memory statistics"
    )
    
    parser.add_argument(
        "--backup", 
        action="store_true", 
        help="Create a backup of current memory"
    )
    
    parser.add_argument(
        "--restore", 
        metavar="BACKUP_DIR", 
        help="Restore memory from backup directory"
    )
    
    parser.add_argument(
        "--force", 
        action="store_true", 
        help="Skip confirmation prompts (use with caution)"
    )
    
    args = parser.parse_args()
    
    # Show help if no arguments
    if not any(vars(args).values()):
        parser.print_help()
        return
    
    try:
        cli = MemoryManagerCLI()
        
        if args.stats:
            cli.display_stats()
        
        if args.backup:
            cli.backup_memory()
        
        if args.restore:
            cli.restore_memory(args.restore)
        
        if args.clear:
            cli.clear_memory(confirm=args.force)
            
    except Exception as e:
        logger.error(f"CLI error: {e}")
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 