from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.database import get_db
from app.db.models import User
from app.schemas.persona import PersonaCreate, PersonaUpdate, PersonaResponse
from app.services import persona_service
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/personas", tags=["personas"])

@router.post("/", response_model=PersonaResponse)
async def create_persona(
    persona_in: PersonaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return await persona_service.create_persona(db, current_user.id, persona_in)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[PersonaResponse])
async def list_personas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await persona_service.get_personas(db, current_user.id)

@router.get("/{persona_id}", response_model=PersonaResponse)
async def get_persona(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    persona = await persona_service.get_persona(db, persona_id, current_user.id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return persona

@router.put("/{persona_id}", response_model=PersonaResponse)
async def update_persona(
    persona_id: int,
    persona_in: PersonaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_persona = await persona_service.get_persona(db, persona_id, current_user.id)
    if not db_persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    try:
        return await persona_service.update_persona(db, db_persona, persona_in)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.delete("/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_persona(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_persona = await persona_service.get_persona(db, persona_id, current_user.id)
    if not db_persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    await persona_service.delete_persona(db, db_persona)
