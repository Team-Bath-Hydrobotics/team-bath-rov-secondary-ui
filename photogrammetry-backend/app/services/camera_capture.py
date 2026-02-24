import cv2
import os
import time
import threading
#  from app.config import settings

class CameraCaptureService:
    def __init__(self):
        self._capture_events = {} 
        self._frame_counts = {}

    def start_capture(self, job_id: str, rtsp_url: str = None, interval: float = 2.0):
        """Starts a background capture thread"""
        url = rtsp_url or settings.DEFAULT_RTSP_URL
        sec = interval or settings.DEFAULT_CAPTURE_INTERVAL
        
        stop_event = threading.Event()
        self._capture_events[job_id] = stop_event
        self._frame_counts[job_id] = 0
        
        thread = threading.Thread(
            target=self._capture_loop, 
            args=(job_id, url, sec, stop_event),
            daemon=True
        )
        thread.start()

    def _capture_loop(self, job_id: str, rtsp_url: str, interval: float, stop_event: threading.Event):
        upload_dir = f"data/uploads/{job_id}"
        os.makedirs(upload_dir, exist_ok=True)
        
        cap = cv2.VideoCapture(rtsp_url)
        
        retries = 0
        while not cap.isOpened() and retries < 3:
            time.sleep(2)
            cap = cv2.VideoCapture(rtsp_url)
            retries += 1

        if not cap.isOpened():
            print(f"Connection failed for {job_id}")
            return

        while not stop_event.is_set():
            ret, frame = cap.read()
            if ret:
                self._frame_counts[job_id] += 1
                filename = f"frame_{self._frame_counts[job_id]:04d}.jpg"
                filepath = os.path.join(upload_dir, filename)
                
                # JPEG quality set to 95 for photogrammetry suitability
                cv2.imwrite(filepath, frame, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
            
            time.sleep(interval)
        
        cap.release()

    def stop_capture(self, job_id: str) -> int:
        """Stops capture via threading Event and returns frame count"""
        if job_id in self._capture_events:
            self._capture_events[job_id].set()
            count = self._frame_counts.get(job_id, 0)
            del self._capture_events[job_id]
            return count
        return 0

    def get_capture_status(self, job_id: str):
        """Returns active status and current count"""
        return {
            "active": job_id in self._capture_events,
            "frame_count": self._frame_counts.get(job_id, 0)
        }