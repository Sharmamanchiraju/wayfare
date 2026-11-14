from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class SavedPlace(Base):
    __tablename__ = "saved_places"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    trip_id: Mapped[Optional[int]] = mapped_column(ForeignKey("trips.id", ondelete="SET NULL"))
    place_name: Mapped[Optional[str]] = mapped_column(String(255))
    latitude: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 8))
    longitude: Mapped[Optional[float]] = mapped_column(DECIMAL(11, 8))
    place_type: Mapped[Optional[str]] = mapped_column(String(100))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="saved_places")
    trip = relationship("Trip", back_populates="saved_places")
