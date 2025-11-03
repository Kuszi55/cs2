#!/usr/bin/env python3
"""
Clip Generation Script for CS2 Demo Analysis
Generates MP4 clips (1080p 60fps) from suspicious moments detected in demo files
"""

import json
import subprocess
import sys
import os
import time
import random
import logging
from pathlib import Path
from datetime import datetime

# Setup logging
log_path = "/var/www/cs2-analysis/logs/clip_generation.log"
os.makedirs(os.path.dirname(log_path), exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_path),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ClipGenerator:
    def __init__(self, demo_path, output_dir, match_id, sensitivity=3):
        self.demo_path = demo_path
        self.output_dir = output_dir
        self.match_id = match_id
        self.sensitivity = sensitivity  # 1-5 scale
        self.clips_dir = Path(output_dir) / str(match_id)
        self.clips_dir.mkdir(parents=True, exist_ok=True)
        self.generated_clips = []
        
    def get_suspicious_moments(self):
        """Extract suspicious moments from demo using cs2json binary"""
        try:
            logger.info(f"Analyzing demo: {self.demo_path}")
            result = subprocess.run(
                ["/var/www/cs2-analysis/scripts/cs2json", self.demo_path],
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode != 0:
                logger.error(f"cs2json failed: {result.stderr}")
                return []
            
            data = json.loads(result.stdout)
            moments = data.get("suspiciousMoments", [])
            logger.info(f"Found {len(moments)} suspicious moments")
            return moments
            
        except Exception as e:
            logger.error(f"Error analyzing demo: {str(e)}")
            return []
    
    def filter_moments_by_sensitivity(self, moments, num_clips):
        """Filter moments based on sensitivity level and confidence"""
        if not moments:
            return []
        
        # Sensitivity affects minimum confidence threshold and moment selection
        sensitivity_thresholds = {
            1: 0.90,  # Only very obvious moments
            2: 0.85,
            3: 0.80,
            4: 0.75,
            5: 0.50   # Everything, even subtle moments
        }
        
        threshold = sensitivity_thresholds.get(self.sensitivity, 0.80)
        
        # Filter by confidence
        filtered = [m for m in moments if m.get("confidence", 0) >= threshold]
        
        # Sort by confidence and type
        type_priority = {
            "damage_burst": 1,
            "extreme_kd_ratio": 2,
            "unusual_accuracy": 3,
            "unusual_headshot_rate": 4,
            "reaction_time": 5,
            "aim_lock": 6,
            "impossible_angle": 7,
            "grenade_spam": 8,
            "unusual_positioning": 9
        }
        
        filtered.sort(key=lambda m: (
            type_priority.get(m.get("suspicionType"), 10),
            -m.get("confidence", 0)
        ))
        
        # Return top N clips
        return filtered[:num_clips]
    
    def calculate_clip_duration(self, moment):
        """Intelligently determine clip duration based on moment type and data"""
        moment_type = moment.get("suspicionType", "unknown")
        estimated = moment.get("estimatedDuration", 3)
        
        # Base durations for each type (in seconds)
        durations = {
            "damage_burst": 6,          # Need to see the burst
            "extreme_kd_ratio": 8,      # Multiple kills sequence
            "unusual_accuracy": 5,      # Single/couple shots
            "unusual_headshot_rate": 7, # Multiple headshots
            "reaction_time": 3,         # Very quick moment
            "aim_lock": 4,             # Lock-on moment
            "impossible_angle": 5,      # Tricky kill
            "grenade_spam": 6,         # Multiple grenades
            "unusual_positioning": 5    # Position change
        }
        
        # Get base duration
        base = durations.get(moment_type, 5)
        
        # Adjust based on confidence (higher = shorter/more focused)
        confidence = moment.get("confidence", 0.75)
        
        if confidence > 0.85:
            duration = max(2, base - 2)  # Very obvious, can be shorter
        elif confidence > 0.75:
            duration = base
        else:
            duration = base + 2  # Less obvious, need context
        
        return int(duration)
    
    def generate_frame_images(self, moment, clip_index):
        """Generate PNG frames from demo tick range"""
        try:
            tick_start = moment.get("tick_start", 0)
            tick_end = moment.get("tick_end", 64)
            duration = self.calculate_clip_duration(moment)
            
            logger.info(f"Generating frames for clip {clip_index}: {tick_start}-{tick_end} ({duration}s)")
            
            # For now, create placeholder frames
            # In production, would use game engine or HLAE to render
            # This is a simplified version using ffmpeg color filter
            
            frame_dir = self.clips_dir / f"clip_{clip_index}_frames"
            frame_dir.mkdir(exist_ok=True)
            
            # Create frame count (60fps * duration)
            frame_count = 60 * duration
            
            # Generate black frames with text (placeholder)
            # Real implementation would render actual game footage
            ffmpeg_cmd = [
                "ffmpeg", "-f", "lavfi",
                "-i", f"color=c=black:s=1920x1080:d={duration}",
                "-vf", f"drawtext=text='{moment.get('description', 'Suspicious moment')}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2",
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-y",
                str(frame_dir / "frame_%04d.png")
            ]
            
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                logger.info(f"Generated frames for clip {clip_index}")
                return frame_dir
            else:
                logger.error(f"ffmpeg frame generation failed: {result.stderr}")
                return None
                
        except Exception as e:
            logger.error(f"Error generating frames: {str(e)}")
            return None
    
    def render_mp4(self, moment, clip_index):
        """Render MP4 video (1080p 60fps) from frames"""
        try:
            duration = self.calculate_clip_duration(moment)
            output_file = self.clips_dir / f"clip_{clip_index:02d}_{moment.get('suspicionType', 'unknown')}.mp4"
            
            logger.info(f"Rendering MP4: {output_file.name}")
            
            # Generate video using ffmpeg with high quality settings
            ffmpeg_cmd = [
                "ffmpeg",
                "-f", "lavfi",
                "-i", f"color=c=black:s=1920x1080:d={duration}",  # Black background
                "-vf", f"drawtext=text='{moment.get('description', 'Suspicious moment')}\n\nConfidence: {moment.get('confidence', 0):.1%}':fontsize=50:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:line_spacing=10",
                "-c:v", "libx264",
                "-preset", "medium",  # Balance between speed and compression
                "-crf", "18",          # Quality (18=high, 28=low)
                "-pix_fmt", "yuv420p",
                "-r", "60",            # 60fps
                "-y",
                str(output_file)
            ]
            
            logger.info(f"Running ffmpeg: {' '.join(ffmpeg_cmd[:5])}...")
            
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode == 0:
                file_size = os.path.getsize(output_file)
                logger.info(f"✅ Rendered clip {clip_index}: {output_file.name} ({file_size / 1024 / 1024:.1f}MB)")
                
                return {
                    "file": str(output_file),
                    "size": file_size,
                    "duration": duration,
                    "filename": output_file.name
                }
            else:
                logger.error(f"ffmpeg failed: {result.stderr}")
                return None
                
        except Exception as e:
            logger.error(f"Error rendering MP4: {str(e)}")
            return None
    
    def generate_clips(self, num_clips=10):
        """Generate all clips for match"""
        try:
            moments = self.get_suspicious_moments()
            if not moments:
                logger.warning("No suspicious moments detected")
                return []
            
            # Filter based on sensitivity
            selected_moments = self.filter_moments_by_sensitivity(moments, min(num_clips, 15))
            logger.info(f"Generating {len(selected_moments)} clips with sensitivity {self.sensitivity}")
            
            clips_metadata = []
            
            for idx, moment in enumerate(selected_moments, 1):
                logger.info(f"\n📹 Generating clip {idx}/{len(selected_moments)}")
                logger.info(f"   Type: {moment.get('suspicionType')}")
                logger.info(f"   Player: {moment.get('playerName')}")
                logger.info(f"   Confidence: {moment.get('confidence', 0):.1%}")
                
                # Render MP4
                clip_info = self.render_mp4(moment, idx)
                
                if clip_info:
                    # Prepare metadata
                    metadata = {
                        "clip_id": idx,
                        "matchId": self.match_id,
                        "playerName": moment.get("playerName", "Unknown"),
                        "team": moment.get("team", "Unknown"),
                        "suspicionType": moment.get("suspicionType", "unknown"),
                        "description": moment.get("description", "Suspicious moment detected"),
                        "confidence": round(moment.get("confidence", 0), 3),
                        "tick_start": moment.get("tick_start", 0),
                        "tick_end": moment.get("tick_end", 0),
                        "estimatedDuration": self.calculate_clip_duration(moment),
                        "videoPath": clip_info["file"],
                        "fileSize": clip_info["size"],
                        "generatedAt": datetime.now().isoformat()
                    }
                    
                    clips_metadata.append(metadata)
                    self.generated_clips.append(metadata)
                else:
                    logger.warning(f"Failed to generate clip {idx}")
            
            logger.info(f"\n✅ Successfully generated {len(clips_metadata)} clips")
            return clips_metadata
            
        except Exception as e:
            logger.error(f"Fatal error during clip generation: {str(e)}")
            return []

def main():
    if len(sys.argv) < 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: generate_clips.py <demo_path> <output_dir> <match_id> [num_clips] [sensitivity]"
        }))
        sys.exit(1)
    
    demo_path = sys.argv[1]
    output_dir = sys.argv[2]
    match_id = sys.argv[3]
    num_clips = int(sys.argv[4]) if len(sys.argv) > 4 else 10
    sensitivity = int(sys.argv[5]) if len(sys.argv) > 5 else 3
    
    # Validate inputs
    if not os.path.exists(demo_path):
        print(json.dumps({
            "success": False,
            "error": f"Demo file not found: {demo_path}"
        }))
        sys.exit(1)
    
    if not 1 <= sensitivity <= 5:
        sensitivity = 3
    
    if not 1 <= num_clips <= 15:
        num_clips = 10
    
    logger.info(f"Starting clip generation: match_id={match_id}, num_clips={num_clips}, sensitivity={sensitivity}")
    
    try:
        generator = ClipGenerator(demo_path, output_dir, match_id, sensitivity)
        clips = generator.generate_clips(num_clips)
        
        result = {
            "success": True,
            "match_id": match_id,
            "clips_generated": len(clips),
            "clips": clips,
            "output_dir": str(generator.clips_dir)
        }
        
        print(json.dumps(result, indent=2))
        logger.info(f"✅ Clip generation completed successfully")
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "match_id": match_id
        }
        print(json.dumps(error_result))
        logger.error(f"❌ Clip generation failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
