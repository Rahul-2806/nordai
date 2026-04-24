from fastapi import APIRouter

router = APIRouter()


@router.get("/rules")
def get_alert_rules():
    return {"rules": [], "message": "Configure alerts via frontend"}


@router.post("/create")
def create_alert(rule: dict):
    return {"status": "created", "rule": rule}
