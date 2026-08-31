from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://skincare:skincare_dev@localhost:5432/skincare"

    # Analysis
    match_threshold: int = 85
    score_beneficial_threshold: float = 2.0
    score_caution_threshold: float = -1.0

    # Position weights
    position_weight_top: float = 1.0
    position_weight_mid: float = 0.5
    position_weight_low: float = 0.2

    # Feedback engine
    learning_rate: float = 0.01
    min_feedback_threshold: int = 20
    max_delta: float = 2.0

    # CSV path
    master_csv_path: str = "data/master_expanded.csv"

    # AI API
    gemini_api_key: str = ""
    deepseek_api_key: str = ""
    openrouter_api_key: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
