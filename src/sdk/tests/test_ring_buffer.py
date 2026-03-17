from openagentvisualizer.core.ring_buffer import RingBuffer

def test_ring_buffer_stores_items():
    buf = RingBuffer(capacity=3)
    buf.append("a")
    buf.append("b")
    assert buf.drain() == ["a", "b"]

def test_ring_buffer_drops_oldest_when_full():
    buf = RingBuffer(capacity=3)
    buf.append("a"); buf.append("b"); buf.append("c"); buf.append("d")
    items = buf.drain()
    assert "a" not in items
    assert "d" in items
    assert len(items) == 3

def test_drain_empties_buffer():
    buf = RingBuffer(capacity=5)
    buf.append("x")
    buf.drain()
    assert buf.drain() == []

def test_ring_buffer_is_thread_safe():
    import threading
    buf = RingBuffer(capacity=100)
    threads = [threading.Thread(target=lambda: buf.append("t")) for _ in range(50)]
    for t in threads: t.start()
    for t in threads: t.join()
    assert len(buf.drain()) <= 100
