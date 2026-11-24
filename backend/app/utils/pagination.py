"""Pagination helper for `items / page / per_page / total` envelopes."""
from __future__ import annotations

from typing import Any, Sequence


def paginate_items(items: Sequence[Any], page: int, per_page: int, total: int) -> dict:
    """Compose the standard paginated envelope.

    `items` is the already-sliced window for the requested page.
    """
    p = max(1, int(page) if page else 1)
    pp = max(1, min(100, int(per_page) if per_page else 10))
    return {
        "items": list(items),
        "page": p,
        "per_page": pp,
        "total": int(total),
    }


__all__ = ["paginate_items"]
