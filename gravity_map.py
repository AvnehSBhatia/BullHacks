from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Hashable, Iterable, List, Mapping, Sequence, Tuple

NodeId = Hashable
Edge = Tuple[NodeId, NodeId, float]
Positions = Dict[NodeId, Tuple[float, float]]


@dataclass
class GravityLayoutConfig:
    iterations: int = 500
    k_attract: float = 1.0
    k_repulse: float = 0.1
    k_center: float = 0.01
    step_size: float = 0.01
    max_radius: float | None = None


def compute_gravity_layout(
    nodes: Iterable[NodeId],
    edges: Iterable[Edge],
    center_id: NodeId,
    *,
    config: GravityLayoutConfig | None = None,
) -> Positions:
    """Compute a 2D gravity-style layout for a weighted graph.

    Args:
        nodes: Iterable of node identifiers.
        edges: Iterable of (u, v, weight) triples with weight > 0 and larger meaning stronger/closer.
        center_id: Node that will be pinned at the origin.
        config: Optional configuration for the force-directed refinement.

    Returns:
        Mapping from node_id to (x, y) coordinates.
    """
    if config is None:
        config = GravityLayoutConfig()

    node_list = list(nodes)
    if center_id not in node_list:
        raise ValueError("center_id must be included in nodes.")

    edge_list = list(edges)
    if not edge_list:
        # Degenerate: just put center at origin and others on a unit circle.
        from math import cos, pi, sin

        positions: Positions = {}
        n = len(node_list)
        if n == 0:
            return positions

        positions[center_id] = (0.0, 0.0)
        others = [n_id for n_id in node_list if n_id != center_id]
        m = len(others)
        if m == 0:
            return positions

        for i, nid in enumerate(others):
            theta = 2.0 * pi * i / m
            positions[nid] = (cos(theta), sin(theta))
        return positions

    # Build adjacency with normalized weights and derived edge lengths.
    adj, lengths = _build_adjacency_and_lengths(node_list, edge_list)

    # Compute shortest-path distances from center using edge lengths.
    dist_to_center = _dijkstra(center_id, node_list, adj, lengths)

    # Map distances to radial coordinates.
    radii = _compute_radii(dist_to_center, config.max_radius)

    # Initialize positions using polar coordinates (radius, evenly spaced angle).
    positions = _initialize_positions(node_list, center_id, radii)

    # Refine layout using force-directed iterations.
    positions = _refine_positions(
        positions,
        node_list,
        center_id,
        adj,
        lengths,
        config=config,
    )

    return positions


def _build_adjacency_and_lengths(
    nodes: Sequence[NodeId],
    edges: Sequence[Edge],
) -> Tuple[Dict[NodeId, List[Tuple[NodeId, float]]], Dict[Tuple[NodeId, NodeId], float]]:
    """Build adjacency list and length mapping from raw edge weights."""
    adj: Dict[NodeId, List[Tuple[NodeId, float]]] = {n: [] for n in nodes}

    weights: List[float] = [max(e[2], 0.0) for e in edges]
    if not weights:
        return adj, {}

    w_min = min(weights)
    w_max = max(weights)
    eps = 1e-9
    denom = max(w_max - w_min, eps)

    def norm(w: float) -> float:
        # Map into [0, 1]; stronger edges near 1.
        if denom <= eps:
            return 1.0
        v = (w - w_min) / denom
        if v < 0.0:
            return 0.0
        if v > 1.0:
            return 1.0
        return v

    lengths: Dict[Tuple[NodeId, NodeId], float] = {}

    for u, v, w in edges:
        w = max(w, 0.0)
        w_norm = norm(w)
        # Convert weight to target length: stronger (bigger) weight -> shorter length,
        # but keep lengths within a reasonable numeric range to avoid instability.
        # Here we map w_norm=1 -> length=1, w_norm=0 -> length=3 linearly.
        length = 1.0 + (1.0 - w_norm) * 2.0
        adj.setdefault(u, []).append((v, w_norm))
        adj.setdefault(v, []).append((u, w_norm))
        lengths[(u, v)] = length
        lengths[(v, u)] = length

    # Ensure all nodes appear in adjacency even if isolated.
    for n in nodes:
        adj.setdefault(n, [])

    return adj, lengths


def _dijkstra(
    source: NodeId,
    nodes: Sequence[NodeId],
    adj: Mapping[NodeId, Sequence[Tuple[NodeId, float]]],
    lengths: Mapping[Tuple[NodeId, NodeId], float],
) -> Dict[NodeId, float]:
    """Dijkstra over edge lengths starting from source."""
    import heapq

    dist: Dict[NodeId, float] = {n: float("inf") for n in nodes}
    dist[source] = 0.0

    heap: List[Tuple[float, NodeId]] = [(0.0, source)]
    visited: Dict[NodeId, bool] = {}

    while heap:
        d, u = heapq.heappop(heap)
        if visited.get(u):
            continue
        visited[u] = True

        for v, _w_norm in adj.get(u, []):
            length = lengths.get((u, v), float("inf"))
            nd = d + length
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(heap, (nd, v))

    return dist


def _compute_radii(
    dist_to_center: Mapping[NodeId, float],
    max_radius: float | None,
) -> Dict[NodeId, float]:
    """Map distances to radii, optionally clamping by max_radius."""
    finite_dists = [d for d in dist_to_center.values() if d < float("inf")]
    if not finite_dists:
        return {n: 0.0 for n in dist_to_center}

    max_dist = max(finite_dists) or 1.0
    base_scale = 1.0 / max_dist

    if max_radius is not None:
        r_scale = max_radius / max_dist
    else:
        r_scale = base_scale

    radii: Dict[NodeId, float] = {}
    for n, d in dist_to_center.items():
        if d == float("inf"):
            # Disconnected nodes get pushed farther out.
            r = (max_radius or 1.0) * 1.5
        else:
            r = r_scale * d
        radii[n] = r
    return radii


def _initialize_positions(
    nodes: Sequence[NodeId],
    center_id: NodeId,
    radii: Mapping[NodeId, float],
) -> Positions:
    """Initialize node positions in polar coordinates (r, evenly spaced angle)."""
    from math import cos, pi, sin

    positions: Positions = {}
    positions[center_id] = (0.0, 0.0)

    others = [n for n in nodes if n != center_id]
    m = len(others)
    if m == 0:
        return positions

    for i, n in enumerate(others):
        r = radii.get(n, 0.0)
        theta = 2.0 * pi * i / m
        positions[n] = (r * cos(theta), r * sin(theta))

    return positions


def _refine_positions(
    positions: Positions,
    nodes: Sequence[NodeId],
    center_id: NodeId,
    adj: Mapping[NodeId, Sequence[Tuple[NodeId, float]]],
    lengths: Mapping[Tuple[NodeId, NodeId], float],
    *,
    config: GravityLayoutConfig,
) -> Positions:
    """Iterative force-directed refinement respecting center pinning and edge strengths."""
    from math import sqrt

    # Work on a mutable copy.
    pos: Dict[NodeId, List[float]] = {
        n: [positions.get(n, (0.0, 0.0))[0], positions.get(n, (0.0, 0.0))[1]]
        for n in nodes
    }

    eta = config.step_size
    eps = 1e-9

    node_index = list(nodes)
    n_nodes = len(node_index)

    for it in range(config.iterations):
        # Optional cooling schedule.
        cooling = 1.0 - (it / max(config.iterations, 1))
        step = eta * cooling

        # Initialize forces.
        fx: Dict[NodeId, float] = {n: 0.0 for n in nodes}
        fy: Dict[NodeId, float] = {n: 0.0 for n in nodes}

        # Attractive forces along edges (springs toward ideal length).
        seen: set = set()
        for (u, v), length in lengths.items():
            key = frozenset({u, v})
            if key in seen:
                continue
            seen.add(key)
            ux, uy = pos[u]
            vx, vy = pos[v]
            dx = vx - ux
            dy = vy - uy
            d = sqrt(dx * dx + dy * dy) + eps

            # Spring force proportional to (current_length - ideal_length).
            force_mag = config.k_attract * (d - length)
            fx_u = force_mag * dx / d
            fy_u = force_mag * dy / d

            fx[u] += fx_u
            fy[u] += fy_u
            fx[v] -= fx_u
            fy[v] -= fy_u

        # Repulsive forces between all pairs (basic O(N^2); ok for small graphs).
        for i in range(n_nodes):
            u = node_index[i]
            ux, uy = pos[u]
            for j in range(i + 1, n_nodes):
                v = node_index[j]
                vx, vy = pos[v]
                dx = vx - ux
                dy = vy - uy
                d2 = dx * dx + dy * dy + eps
                d = sqrt(d2)
                # Inverse-square repulsion.
                rep_mag = config.k_repulse / d2
                fx_u = rep_mag * dx / d
                fy_u = rep_mag * dy / d

                fx[u] -= fx_u
                fy[u] -= fy_u
                fx[v] += fx_u
                fy[v] += fy_u

        # Global gravity toward center for all non-center nodes.
        cx, cy = pos[center_id]
        for n in nodes:
            if n == center_id:
                continue
            x, y = pos[n]
            dx = x - cx
            dy = y - cy
            fx[n] -= config.k_center * dx
            fy[n] -= config.k_center * dy

        # Integrate positions.
        for n in nodes:
            if n == center_id:
                # Keep center pinned at origin.
                pos[n][0] = 0.0
                pos[n][1] = 0.0
                continue

            pos[n][0] += step * fx[n]
            pos[n][1] += step * fy[n]

    return {n: (pos[n][0], pos[n][1]) for n in nodes}


def _example_usage() -> None:
    """Simple manual test for the layout algorithm."""
    nodes = ["center", "a", "b", "c", "d", "e"]
    edges: List[Edge] = [
        ("center", "a", 5.0),
        ("center", "b", 3.0),
        ("center", "c", 1.0),
        ("a", "d", 4.0),
        ("b", "e", 2.0),
        ("d", "e", 1.5),
    ]

    layout = compute_gravity_layout(nodes, edges, center_id="center")
    # for nid, (x, y) in layout.items():
    #     print(f"{nid}: ({x:.3f}, {y:.3f})")
    print(layout)


if __name__ == "__main__":
    _example_usage()

