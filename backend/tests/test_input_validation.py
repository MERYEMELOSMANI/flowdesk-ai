import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient
from app.api.routes_tickets import TicketPatchRequest
from app.main import app
from app.services import db

@pytest.mark.parametrize("field,value", [("estimated_hours", -1), ("estimated_hours", 25), ("sla_deadline_hours", 0), ("title", "x"), ("description", "x")])
def test_ticket_patch_rejects_invalid_fields(field, value):
    with pytest.raises(ValidationError):
        TicketPatchRequest(**{field: value})

def test_bad_csv_returns_validation_error_without_partial_import(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DB_DIR", str(tmp_path))
    monkeypatch.setattr(db, "DB_PATH", str(tmp_path / "test.db"))
    with TestClient(app, raise_server_exceptions=False) as client:
        before = client.get("/api/tickets").json()
        csv = "title,description,estimated_hours\nValid ticket,Valid description,2\nBad ticket,Invalid hours,nope\n"
        response = client.post("/api/tickets/import-csv", files={"file": ("tickets.csv", csv, "text/csv")})
        assert response.status_code == 422
        assert client.get("/api/tickets").json() == before
