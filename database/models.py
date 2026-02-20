from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class CachedFinancial(Base):
    __tablename__ = "cached_financials"

    id = Column(Integer, primary_key=True)
    ticker = Column(String(10), index=True, nullable=False)
    data_json = Column(Text, nullable=False)
    fetched_at = Column(DateTime, default=datetime.utcnow)


class ScreenerResult(Base):
    __tablename__ = "screener_results"

    id = Column(Integer, primary_key=True)
    template_name = Column(String(50), index=True)
    results_json = Column(Text, nullable=False)
    run_at = Column(DateTime, default=datetime.utcnow)


class InsiderTrade(Base):
    __tablename__ = "insider_trades"

    id = Column(Integer, primary_key=True)
    ticker = Column(String(10), index=True, nullable=False)
    insider_name = Column(String(200))
    title = Column(String(200))
    trade_type = Column(String(20))
    shares = Column(Integer)
    price = Column(Float)
    value = Column(Float)
    filing_date = Column(DateTime)
    fetched_at = Column(DateTime, default=datetime.utcnow)


class MacroSnapshot(Base):
    __tablename__ = "macro_snapshots"

    id = Column(Integer, primary_key=True)
    series_id = Column(String(30), index=True, nullable=False)
    category = Column(String(50))
    value = Column(Float)
    date = Column(String(10))
    fetched_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    alert_type = Column(String(50), nullable=False)
    name = Column(String(200), nullable=False)
    config_json = Column(Text, nullable=False)
    enabled = Column(Boolean, default=True)
    last_triggered = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(Integer, primary_key=True)
    alert_id = Column(Integer, index=True, nullable=False)
    message = Column(Text)
    delivered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SentimentCache(Base):
    __tablename__ = "sentiment_cache"

    id = Column(Integer, primary_key=True)
    url_hash = Column(String(64), unique=True, nullable=False)
    sentiment = Column(String(20))
    score = Column(Float)
    method = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
