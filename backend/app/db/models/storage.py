from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON, Integer, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class CacheEntry(Base):
    __tablename__ = "api_cache"
    
    key: Mapped[str] = mapped_column(String(255), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class RateLimitBucket(Base):
    __tablename__ = "api_rate_limits"
    
    bucket: Mapped[str] = mapped_column(String(255), primary_key=True)
    next_available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

class IdempotencyClaim(Base):
    __tablename__ = "idempotency_keys"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scoped_key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="in_flight")
    response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
