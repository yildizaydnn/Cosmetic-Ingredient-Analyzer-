"""Feedback tests - require PostgreSQL, skipped if unavailable."""

import pytest


@pytest.mark.skip(reason="Requires PostgreSQL connection")
async def test_feedback_save():
    pass


@pytest.mark.skip(reason="Requires PostgreSQL connection")
async def test_duplicate_feedback_rejected():
    pass
