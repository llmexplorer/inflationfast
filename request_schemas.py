from pydantic import BaseModel
from typing import List, Dict


class IdsInput(BaseModel):
    ids: List[str]


class PricesByCategoryInput(BaseModel):
    start_date: str
    end_date: str

class CostPerCalorieInput(BaseModel):
    item_id: str