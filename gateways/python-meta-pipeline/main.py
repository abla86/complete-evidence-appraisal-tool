from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import math
app=FastAPI(title="Python Meta Pipeline",version="1.0.0")
class Effect(BaseModel):
    events_treatment:int
    total_treatment:int
    events_control:int
    total_control:int
@app.get("/health")
def health(): return {"status":"ok","service":"python-meta-pipeline"}
@app.post("/meta/odds-ratio")
def odds_ratio(x:Effect):
    a,b=x.events_treatment,x.total_treatment-x.events_treatment;c,d=x.events_control,x.total_control-x.events_control
    if min(a,b,c,d)<=0: raise HTTPException(400,"Continuity correction required for zero cells")
    value=(a*d)/(b*c);se=math.sqrt(1/a+1/b+1/c+1/d)
    return {"measure":"odds_ratio","estimate":value,"ci95":[math.exp(math.log(value)-1.96*se),math.exp(math.log(value)+1.96*se)]}
@app.post("/meta/risk-ratio")
def risk_ratio(x:Effect):
    if min(x.total_treatment,x.total_control)<=0: raise HTTPException(400,"Totals must be positive")
    rt=x.events_treatment/x.total_treatment;rc=x.events_control/x.total_control
    if rt<=0 or rc<=0: raise HTTPException(400,"Zero event risk requires a prespecified correction")
    value=rt/rc;se=math.sqrt(1/x.events_treatment-1/x.total_treatment+1/x.events_control-1/x.total_control)
    return {"measure":"risk_ratio","estimate":value,"ci95":[math.exp(math.log(value)-1.96*se),math.exp(math.log(value)+1.96*se)]}
