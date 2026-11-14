from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List, Optional
from app.db.models import Persona
from app.schemas.persona import PersonaCreate, PersonaUpdate

async def get_persona_by_name(db: AsyncSession, name: str, user_id: int) -> Optional[Persona]:
    result = await db.execute(select(Persona).filter(Persona.name == name, Persona.user_id == user_id))
    return result.scalars().first()

async def create_persona(db: AsyncSession, user_id: int, persona_in: PersonaCreate) -> Persona:
    existing = await get_persona_by_name(db, persona_in.name, user_id)
    if existing:
        raise ValueError("A persona with this name already exists.")
        
    db_persona = Persona(**persona_in.model_dump(), user_id=user_id)
    db.add(db_persona)
    await db.commit()
    await db.refresh(db_persona)
    return db_persona

async def get_personas(db: AsyncSession, user_id: int) -> List[Persona]:
    result = await db.execute(select(Persona).filter(Persona.user_id == user_id))
    return result.scalars().all()

async def get_persona(db: AsyncSession, persona_id: int, user_id: int) -> Optional[Persona]:
    result = await db.execute(select(Persona).filter(Persona.id == persona_id, Persona.user_id == user_id))
    return result.scalars().first()

async def update_persona(db: AsyncSession, db_persona: Persona, persona_in: PersonaUpdate) -> Persona:
    update_data = persona_in.model_dump(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_persona.name:
        existing = await get_persona_by_name(db, update_data["name"], db_persona.user_id)
        if existing:
            raise ValueError("A persona with this name already exists.")
            
    for field, value in update_data.items():
        setattr(db_persona, field, value)
    await db.commit()
    await db.refresh(db_persona)
    return db_persona

async def delete_persona(db: AsyncSession, db_persona: Persona) -> None:
    await db.delete(db_persona)
    await db.commit()
