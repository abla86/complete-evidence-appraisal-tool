from __future__ import annotations

import math
from typing import Literal

import polars as pl
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from scipy.stats import norm

app = FastAPI(title="Python Meta Pipeline", version="1.1.0")


class Effect(BaseModel):
    events_treatment: int = Field(ge=0)
    total_treatment: int = Field(gt=0)
    events_control: int = Field(ge=0)
    total_control: int = Field(gt=0)


class MetaStudy(BaseModel):
    study_id: str
    effect: float
    standard_error: float = Field(gt=0)


class MetaAnalysisRequest(BaseModel):
    measure: Literal["log_effect"] = "log_effect"
    studies: list[MetaStudy] = Field(min_length=2)


@app.get("/health")
def health():
    return {"status": "ok", "service": "python-meta-pipeline"}


@app.post("/meta/odds-ratio")
def odds_ratio(x: Effect):
    a, b = x.events_treatment, x.total_treatment - x.events_treatment
    c, d = x.events_control, x.total_control - x.events_control
    if min(a, b, c, d) <= 0:
        raise HTTPException(400, "Continuity correction required for zero cells")
    value = (a * d) / (b * c)
    se = math.sqrt(1 / a + 1 / b + 1 / c + 1 / d)
    z = norm.ppf(0.975)
    return {
        "measure": "odds_ratio",
        "estimate": value,
        "ci95": [math.exp(math.log(value) - z * se), math.exp(math.log(value) + z * se)],
    }


@app.post("/meta/risk-ratio")
def risk_ratio(x: Effect):
    rt = x.events_treatment / x.total_treatment
    rc = x.events_control / x.total_control
    if rt <= 0 or rc <= 0:
        raise HTTPException(400, "Zero event risk requires a prespecified correction")
    value = rt / rc
    se = math.sqrt(
        1 / x.events_treatment
        - 1 / x.total_treatment
        + 1 / x.events_control
        - 1 / x.total_control
    )
    z = norm.ppf(0.975)
    return {
        "measure": "risk_ratio",
        "estimate": value,
        "ci95": [math.exp(math.log(value) - z * se), math.exp(math.log(value) + z * se)],
    }


@app.post("/meta/random-effects")
def random_effects(x: MetaAnalysisRequest):
    frame = pl.DataFrame(
        [{"study_id": s.study_id, "effect": s.effect, "se": s.standard_error} for s in x.studies]
    )
    weights_fixed = 1.0 / (frame["se"] ** 2)
    fixed_effect = float((weights_fixed * frame["effect"]).sum() / weights_fixed.sum())
    q = float((weights_fixed * (frame["effect"] - fixed_effect) ** 2).sum())
    k = frame.height
    c = float(weights_fixed.sum() - (weights_fixed.pow(2).sum() / weights_fixed.sum()))
    tau2 = max(0.0, (q - (k - 1)) / c) if c > 0 else 0.0
    weights_random = 1.0 / (frame["se"] ** 2 + tau2)
    pooled = float((weights_random * frame["effect"]).sum() / weights_random.sum())
    se_pooled = math.sqrt(1.0 / float(weights_random.sum()))
    z = norm.ppf(0.975)
    i2 = max(0.0, (q - (k - 1)) / q) * 100 if q > 0 else 0.0
    return {
        "model": "DerSimonian-Laird random-effects",
        "studies": k,
        "pooled_effect": pooled,
        "standard_error": se_pooled,
        "ci95": [pooled - z * se_pooled, pooled + z * se_pooled],
        "tau2": tau2,
        "q": q,
        "i2_percent": i2,
    }
