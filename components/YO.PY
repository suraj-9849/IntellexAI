def solve(N, H, Q, Jump):
    edges = []
    for i in range(N):
        for j in range(N):
            if j + 1 < N:
                w = abs(H[i][j] - H[i][j+1])
                edges.append((w, i*N+j, i*N+j+1))
            if i + 1 < N:
                w = abs(H[i][j] - H[i+1][j])
                edges.append((w, i*N+j, (i+1)*N+j))

    edges.sort()

    parent = list(range(N*N))
    size = [1] * (N*N)

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        px, py = find(x), find(y)
        if px == py:
            return
        if size[px] < size[py]:
            px, py = py, px
        parent[py] = px
        size[px] += size[py]

    sorted_queries = sorted(enumerate(Jump), key=lambda x: x[1])

    ans = [0] * Q
    edge_idx = 0

    for orig_idx, jump in sorted_queries:
        while edge_idx < len(edges) and edges[edge_idx][0] <= jump:
            _, u, v = edges[edge_idx]
            union(u, v)
            edge_idx += 1
        ans[orig_idx] = size[find(0)]

    return ans