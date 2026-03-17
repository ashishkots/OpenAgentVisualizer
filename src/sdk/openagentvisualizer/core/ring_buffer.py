import threading
from collections import deque


class RingBuffer:
    def __init__(self, capacity: int = 1000):
        self._capacity = capacity
        self._buf: deque = deque(maxlen=capacity)
        self._lock = threading.Lock()

    def append(self, item) -> None:
        with self._lock:
            self._buf.append(item)

    def drain(self) -> list:
        with self._lock:
            items = list(self._buf)
            self._buf.clear()
            return items

    def __len__(self) -> int:
        with self._lock:
            return len(self._buf)
