#!/usr/bin/env python3
import cgitb
cgitb.enable()

print("Content-Type: application/json")
print("Access-Control-Allow-Origin: *")
print("")

import json
import os
import cgi
import pandas as pd
import joblib

BASE_DIR = "/home/student/solermig/capstone_project"
DATA_PATH = os.path.join(BASE_DIR, "data/processed/model_ready_dataset.csv")
REGRESSOR_PATH = os.path.join(BASE_DIR, "models/employment_growth_regressor.joblib")
CLASSIFIER_PATH = os.path.join(BASE_DIR, "models/employment_trend_classifier.joblib")

FEATURE_COLS = [
    "lag_employment_growth_pct",
    "lag_unemployment_rate",
    "lag_cpi",
    "lag_federal_funds_rate",
    "lag_labor_force_participation",
    "roll3_emp_growth",
    "roll3_unrate",
    "sector_code_PAYEMS",
    "sector_code_USCONS",
    "sector_code_USPBS",
]

try:
    form = cgi.FieldStorage()
    sector = form.getfirst("sector", "PAYEMS")
    allowed = {"PAYEMS", "USCONS", "USPBS"}
    if sector not in allowed:
        raise ValueError("Invalid sector. Use PAYEMS, USCONS, or USPBS.")

    df = pd.read_csv(DATA_PATH)
    df["DATE"] = pd.to_datetime(df["DATE"])
    df_encoded = pd.get_dummies(df, columns=["sector_code"], drop_first=False)

    for required_col in FEATURE_COLS:
        if required_col not in df_encoded.columns:
            df_encoded[required_col] = 0

    latest_sector_row = df_encoded[df_encoded[f"sector_code_{sector}"] == 1].sort_values("DATE").iloc[-1]
    features = pd.DataFrame([latest_sector_row[FEATURE_COLS]])

    regressor = joblib.load(REGRESSOR_PATH)
    classifier = joblib.load(CLASSIFIER_PATH)

    growth = round(float(regressor.predict(features)[0]), 4)
    trend = str(classifier.predict(features)[0])

    print(json.dumps({
        "ok": True,
        "sector": sector,
        "predicted_growth_pct": growth,
        "predicted_trend": trend,
    }))
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)}))
