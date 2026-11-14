from datetime import datetime
from typing import Optional, List
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class Persona(Base):
    __tablename__ = "personas"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    travel_style: Mapped[Optional[str]] = mapped_column(String(255))
    budget_min: Mapped[Optional[int]] = mapped_column(Integer)
    budget_max: Mapped[Optional[int]] = mapped_column(Integer)
    trip_duration: Mapped[Optional[int]] = mapped_column(Integer)
    description: Mapped[Optional[str]] = mapped_column(Text)
    preferred_destination: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="personas")
    trips = relationship("Trip", back_populates="persona")
