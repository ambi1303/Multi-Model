from datetime import datetime
import pytz
from typing import Union

def ensure_timezone_aware(dt: Union[datetime, str], timezone: str = 'UTC') -> datetime:
    """Ensure datetime object is timezone-aware"""
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
    
    if dt.tzinfo is None:
        # Make timezone-aware
        tz = pytz.timezone(timezone)
        dt = tz.localize(dt)
    
    return dt

def normalize_datetime(dt: Union[datetime, str]) -> datetime:
    """Normalize datetime to UTC timezone-aware format"""
    dt = ensure_timezone_aware(dt)
    return dt.astimezone(pytz.UTC)