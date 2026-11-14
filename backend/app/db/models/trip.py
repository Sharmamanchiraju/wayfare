from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import String, DateTime, Date, ForeignKey, JSON, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class Trip(Base):
    __tablename__ = "trips"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    persona_id: Mapped[Optional[int]] = mapped_column(ForeignKey("personas.id", ondelete="SET NULL"))
    destination: Mapped[Optional[str]] = mapped_column(String(255))
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    budget: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2))
    status: Mapped[Optional[str]] = mapped_column(String(50))
    conversation_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True)
    trip_data: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="trips")
    persona = relationship("Persona", back_populates="trips")
    messages = relationship("Message", back_populates="trip", cascade="all, delete-orphan", order_by="Message.id")
    saved_places = relationship("SavedPlace", back_populates="trip")
