"""
Tests for gravity_map layout with large node lists and different edge configurations.
"""
from __future__ import annotations

import random
import time
from gravity_map import (
    GravityLayoutConfig,
    compute_gravity_layout,
)


def _assert_positions(positions: dict, center_id, node_count: int) -> None:
    """Sanity checks on layout output."""
    assert len(positions) == node_count
    assert center_id in positions
    cx, cy = positions[center_id]
    assert cx == 0.0 and cy == 0.0
    # All positions should be finite
    for nid, (x, y) in positions.items():
        assert isinstance(x, (int, float)) and isinstance(y, (int, float))
        assert abs(x) != float("inf") and abs(y) != float("inf")


def test_large_star_graph() -> None:
    """Large star: center connected to many nodes with varying weights."""
    n = 80
    center_id = 0
    nodes = [center_id] + list(range(1, n))
    edges = [(center_id, i, random.uniform(0.5, 10.0)) for i in range(1, n)]
    config = GravityLayoutConfig(iterations=300, step_size=0.02)
    t0 = time.perf_counter()
    positions = compute_gravity_layout(nodes, edges, center_id, config=config)
    elapsed = time.perf_counter() - t0
    _assert_positions(positions, center_id, n)
    print(f"  large_star: {n} nodes, {len(edges)} edges -> {elapsed:.2f}s, center at origin OK")


def test_large_sparse_chain() -> None:
    """Sparse chain/tree: long path from center with branches."""
    n = 100
    center_id = 0
    nodes = list(range(n))
    edges = []
    for i in range(n - 1):
        w = random.uniform(1.0, 5.0)
        edges.append((i, i + 1, w))
    # Add a few lateral edges
    for _ in range(20):
        a, b = random.sample(range(n), 2)
        if a > b:
            a, b = b, a
        if b - a > 2:
            edges.append((a, b, random.uniform(0.3, 2.0)))
    config = GravityLayoutConfig(iterations=250, step_size=0.015)
    t0 = time.perf_counter()
    positions = compute_gravity_layout(nodes, edges, center_id, config=config)
    elapsed = time.perf_counter() - t0
    _assert_positions(positions, center_id, n)
    print(f"  large_sparse_chain: {n} nodes, {len(edges)} edges -> {elapsed:.2f}s OK")


def test_dense_mesh() -> None:
    """Dense mesh: each node connected to several others with mixed weights."""
    n = 60
    center_id = 0
    nodes = list(range(n))
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            if random.random() < 0.15:  # ~15% of pairs connected
                w = random.uniform(0.2, 8.0)
                edges.append((i, j, w))
    # Ensure center has at least some edges
    if not any(e[0] == center_id or e[1] == center_id for e in edges):
        for j in range(1, min(10, n)):
            edges.append((center_id, j, random.uniform(2.0, 6.0)))
    config = GravityLayoutConfig(iterations=200, k_repulse=0.08, step_size=0.01)
    t0 = time.perf_counter()
    positions = compute_gravity_layout(nodes, edges, center_id, config=config)
    elapsed = time.perf_counter() - t0
    _assert_positions(positions, center_id, n)
    print(f"  dense_mesh: {n} nodes, {len(edges)} edges -> {elapsed:.2f}s OK")


def test_very_large_no_edges() -> None:
    """Very large list of points with no edges: all on unit circle."""
    n = 200
    center_id = "center"
    nodes = [center_id] + [f"n{i}" for i in range(n - 1)]
    edges = []
    t0 = time.perf_counter()
    positions = compute_gravity_layout(nodes, edges, center_id)
    elapsed = time.perf_counter() - t0
    _assert_positions(positions, center_id, n)
    # Check all non-center are roughly at radius 1
    from math import sqrt
    for nid, (x, y) in positions.items():
        if nid == center_id:
            continue
        r = sqrt(x * x + y * y)
        assert 0.99 <= r <= 1.01, f"Expected unit circle, got r={r}"
    print(f"  very_large_no_edges: {n} nodes, 0 edges -> {elapsed:.2f}s, unit circle OK")


def test_mixed_weights_and_ids() -> None:
    """Mixed node ID types and wide weight range."""
    nodes = ["center", "a", "b", "c", 1, 2, 3, (4,), (5,)]
    edges = [
        ("center", "a", 10.0),
        ("center", "b", 1.0),
        ("center", 3, 5.0),
        ("a", 1, 8.0),
        ("a", (4,), 0.5),
        ("b", 2, 3.0),
        (3, (5,), 2.0),
    ]
    positions = compute_gravity_layout(nodes, edges, "center")
    _assert_positions(positions, "center", len(nodes))
    assert positions["center"] == (0.0, 0.0)
    print("  mixed_weights_and_ids: 9 nodes, 7 edges -> OK")


def run_all() -> None:
    """Run all tests and print summary."""
    seed = 42
    random.seed(seed)
    print("Testing gravity_map with large lists and different edges (seed=%d)" % seed)
    test_large_star_graph()
    test_large_sparse_chain()
    test_dense_mesh()
    test_very_large_no_edges()
    test_mixed_weights_and_ids()
    print("All tests passed.")


if __name__ == "__main__":
    run_all()
