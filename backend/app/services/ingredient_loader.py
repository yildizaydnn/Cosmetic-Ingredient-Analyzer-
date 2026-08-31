import os
import pandas as pd

from app.config import settings

_ingredient_index: dict[str, dict] = {}


def get_ingredient_index() -> dict[str, dict]:
    return _ingredient_index


async def load_ingredient_index() -> None:
    global _ingredient_index, _csv_columns

    df = pd.read_csv(settings.master_csv_path, dtype=str, keep_default_na=False)
    _csv_columns = list(df.columns)

    # Convert score columns to float
    score_cols = [
        "score_dry", "score_oily", "score_combination", "score_normal",
        "score_sensitive", "score_mature", "score_pregnancy_safe",
    ]
    for col in score_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    if "product_frequency" in df.columns:
        df["product_frequency"] = pd.to_numeric(df["product_frequency"], errors="coerce").fillna(0).astype(int)

    index = {}
    for _, row in df.iterrows():
        key = row["name_normalized"]
        index[key] = row.to_dict()

    _ingredient_index = index
    print(f"[LOADER] Loaded {len(_ingredient_index)} ingredients from CSV")


_csv_columns: list[str] = []


def save_new_ingredient(row: dict) -> None:
    """AI'dan dönen ingredient'i bellek cache'e ve CSV'ye kaydeder."""
    global _ingredient_index

    key = row["name_normalized"]

    # Zaten varsa kaydetme
    if key in _ingredient_index:
        return

    # Bellek cache'e ekle
    _ingredient_index[key] = row

    # CSV'ye ekle — kolon sırasını mevcut CSV ile eşleştir
    csv_path = settings.master_csv_path

    if _csv_columns:
        # Sadece CSV'de olan kolonları, doğru sırayla yaz
        ordered = {col: row.get(col, "") for col in _csv_columns}
        df_new = pd.DataFrame([ordered])
        df_new.to_csv(csv_path, mode="a", header=False, index=False)
    else:
        df_new = pd.DataFrame([row])
        df_new.to_csv(csv_path, mode="a", header=False, index=False)

    print(f"[LOADER] Saved new ingredient: {row['name']} (total: {len(_ingredient_index)})")
